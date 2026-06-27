import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryConstraint,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import type {
  HouseMember,
  Proposal,
  Vote,
  Quest,
  QuestSubmission,
  Reward,
  RewardClaim,
  Violation,
  ViolationVote,
  NFTMembership,
  HouseEvent,
  EventRSVP,
  AppNotification,
  ReputationEvent,
  LeaderboardEntry,
  MemberTier,
  TIER_THRESHOLDS,
} from "@/types";

// ─── Collection names ─────────────────────────────────────────
export const COLLECTIONS = {
  USERS: "users",
  REPUTATION_HISTORY: "reputationHistory",
  PROPOSALS: "proposals",
  VOTES: "votes",
  QUESTS: "quests",
  QUEST_SUBMISSIONS: "questSubmissions",
  REWARDS: "rewards",
  REWARD_CLAIMS: "rewardClaims",
  VIOLATIONS: "violations",
  VIOLATION_VOTES: "violationVotes",
  NFT_MEMBERSHIPS: "nftMemberships",
  EVENTS: "events",
  EVENT_RSVPS: "eventRsvps",
  NOTIFICATIONS: "notifications",
  COUNTERS: "counters",
} as const;

// ─── Member ID generation ─────────────────────────────────────
export async function getNextMemberId(): Promise<string> {
  const counterRef = doc(db, COLLECTIONS.COUNTERS, "memberCounter");
  let nextId = 1;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    if (snap.exists()) {
      nextId = (snap.data().count as number) + 1;
    }
    tx.set(counterRef, { count: nextId });
  });

  return `M-${String(nextId).padStart(4, "0")}`;
}

// ─── Tier calculation ─────────────────────────────────────────
export function calculateTier(reputationScore: number): MemberTier {
  if (reputationScore >= 15000) return "emperor";
  if (reputationScore >= 5000) return "consul";
  if (reputationScore >= 2000) return "senator";
  if (reputationScore >= 500) return "patrician";
  return "citizen";
}

// ─── Users / Members ─────────────────────────────────────────
export async function getMemberByTelegramId(
  telegramId: number
): Promise<HouseMember | null> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where("telegramId", "==", telegramId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() } as HouseMember;
}

export async function getMemberById(memberId: string): Promise<HouseMember | null> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where("memberId", "==", memberId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { uid: snap.docs[0].id, ...snap.docs[0].data() } as HouseMember;
}

export async function getMemberByUid(uid: string): Promise<HouseMember | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as HouseMember;
}

export async function createMember(
  uid: string,
  data: Omit<HouseMember, "uid">
): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.USERS, uid), data);
}

export async function updateMember(
  uid: string,
  data: Partial<HouseMember>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
    ...data,
    lastActiveAt: Timestamp.now(),
  });
}

export function subscribeToMember(
  uid: string,
  callback: (member: HouseMember | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.USERS, uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ uid: snap.id, ...snap.data() } as HouseMember);
  });
}

// ─── Reputation ───────────────────────────────────────────────
export async function addReputationEvent(
  event: Omit<ReputationEvent, "id">
): Promise<void> {
  const batch = writeBatch(db);
  const eventRef = doc(collection(db, COLLECTIONS.REPUTATION_HISTORY));

  batch.set(eventRef, { ...event, id: eventRef.id });

  // Update member reputation + XP
  const memberQuery = query(
    collection(db, COLLECTIONS.USERS),
    where("memberId", "==", event.memberId),
    limit(1)
  );
  const memberSnap = await getDocs(memberQuery);
  if (!memberSnap.empty) {
    const memberRef = memberSnap.docs[0].ref;
    const current = memberSnap.docs[0].data() as HouseMember;
    const newRep = Math.max(0, current.reputationScore + event.points);
    const newTier = calculateTier(newRep);

    batch.update(memberRef, {
      reputationScore: newRep,
      xpScore: increment(Math.max(0, event.points)),
      tier: newTier,
      lastActiveAt: Timestamp.now(),
    });
  }

  await batch.commit();
}

export async function getReputationHistory(
  memberId: string,
  pageLimit = 20
): Promise<ReputationEvent[]> {
  const q = query(
    collection(db, COLLECTIONS.REPUTATION_HISTORY),
    where("memberId", "==", memberId),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReputationEvent));
}

// ─── Governance / Proposals ───────────────────────────────────
export async function getActiveProposals(): Promise<Proposal[]> {
  const q = query(
    collection(db, COLLECTIONS.PROPOSALS),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal));
}

export async function getAllProposals(
  pageLimit = 20,
  cursor?: DocumentData
): Promise<Proposal[]> {
  const constraints: QueryConstraint[] = [
    orderBy("createdAt", "desc"),
    limit(pageLimit),
  ];
  if (cursor) constraints.push(startAfter(cursor));

  const q = query(collection(db, COLLECTIONS.PROPOSALS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Proposal));
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.PROPOSALS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Proposal;
}

export async function createProposal(
  data: Omit<Proposal, "id">
): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.PROPOSALS));
  await setDoc(ref, { ...data, id: ref.id });
  return ref.id;
}

export async function castVote(
  proposalId: string,
  vote: Omit<Vote, "id">
): Promise<void> {
  const batch = writeBatch(db);

  // Check existing vote
  const existingQ = query(
    collection(db, COLLECTIONS.VOTES),
    where("proposalId", "==", proposalId),
    where("memberId", "==", vote.memberId),
    limit(1)
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) throw new Error("Already voted on this proposal");

  const voteRef = doc(collection(db, COLLECTIONS.VOTES));
  batch.set(voteRef, { ...vote, id: voteRef.id });

  const proposalRef = doc(db, COLLECTIONS.PROPOSALS, proposalId);
  batch.update(proposalRef, {
    [`voteCount.${vote.choice}`]: increment(1),
    "voteCount.total": increment(1),
  });

  await batch.commit();
}

export async function getMemberVote(
  proposalId: string,
  memberId: string
): Promise<Vote | null> {
  const q = query(
    collection(db, COLLECTIONS.VOTES),
    where("proposalId", "==", proposalId),
    where("memberId", "==", memberId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Vote;
}

// ─── Quests ───────────────────────────────────────────────────
export async function getActiveQuests(): Promise<Quest[]> {
  const q = query(
    collection(db, COLLECTIONS.QUESTS),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quest));
}

export async function getAllQuests(pageLimit = 20): Promise<Quest[]> {
  const q = query(
    collection(db, COLLECTIONS.QUESTS),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Quest));
}

export async function getQuest(id: string): Promise<Quest | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.QUESTS, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Quest;
}

export async function submitQuestProof(
  submission: Omit<QuestSubmission, "id">
): Promise<string> {
  const ref = doc(collection(db, COLLECTIONS.QUEST_SUBMISSIONS));
  await setDoc(ref, { ...submission, id: ref.id });
  await updateDoc(doc(db, COLLECTIONS.QUESTS, submission.questId), {
    currentParticipants: increment(1),
  });
  return ref.id;
}

export async function getMemberSubmission(
  questId: string,
  memberId: string
): Promise<QuestSubmission | null> {
  const q = query(
    collection(db, COLLECTIONS.QUEST_SUBMISSIONS),
    where("questId", "==", questId),
    where("memberId", "==", memberId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as QuestSubmission;
}

// ─── Rewards ──────────────────────────────────────────────────
export async function getRewards(status?: string): Promise<Reward[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (status) constraints.unshift(where("status", "==", status));

  const q = query(collection(db, COLLECTIONS.REWARDS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Reward));
}

export async function claimReward(claim: Omit<RewardClaim, "id">): Promise<string> {
  const existingQ = query(
    collection(db, COLLECTIONS.REWARD_CLAIMS),
    where("rewardId", "==", claim.rewardId),
    where("memberId", "==", claim.memberId),
    limit(1)
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) throw new Error("Already claimed this reward");

  const batch = writeBatch(db);
  const claimRef = doc(collection(db, COLLECTIONS.REWARD_CLAIMS));
  batch.set(claimRef, { ...claim, id: claimRef.id });
  batch.update(doc(db, COLLECTIONS.REWARDS, claim.rewardId), {
    claimedSlots: increment(1),
  });
  await batch.commit();
  return claimRef.id;
}

// ─── Violations ───────────────────────────────────────────────
export async function getViolations(status?: string): Promise<Violation[]> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
  if (status) constraints.unshift(where("status", "==", status));

  const q = query(collection(db, COLLECTIONS.VIOLATIONS), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Violation));
}

export async function castViolationVote(
  violationId: string,
  vote: Omit<ViolationVote, "id">
): Promise<void> {
  const existingQ = query(
    collection(db, COLLECTIONS.VIOLATION_VOTES),
    where("violationId", "==", violationId),
    where("memberId", "==", vote.memberId),
    limit(1)
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) throw new Error("Already voted on this case");

  const batch = writeBatch(db);
  const voteRef = doc(collection(db, COLLECTIONS.VIOLATION_VOTES));
  batch.set(voteRef, { ...vote, id: voteRef.id });
  batch.update(doc(db, COLLECTIONS.VIOLATIONS, violationId), {
    [`voteCount.${vote.choice}`]: increment(1),
    "voteCount.total": increment(1),
  });
  await batch.commit();
}

// ─── Events ───────────────────────────────────────────────────
export async function getUpcomingEvents(): Promise<HouseEvent[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where("status", "in", ["upcoming", "live"]),
    where("startsAt", ">=", now),
    orderBy("startsAt", "asc"),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as HouseEvent));
}

export async function rsvpEvent(rsvp: Omit<EventRSVP, "id">): Promise<void> {
  const existingQ = query(
    collection(db, COLLECTIONS.EVENT_RSVPS),
    where("eventId", "==", rsvp.eventId),
    where("memberId", "==", rsvp.memberId),
    limit(1)
  );
  const existing = await getDocs(existingQ);
  if (!existing.empty) throw new Error("Already RSVP'd to this event");

  const batch = writeBatch(db);
  const rsvpRef = doc(collection(db, COLLECTIONS.EVENT_RSVPS));
  batch.set(rsvpRef, { ...rsvp, id: rsvpRef.id });
  batch.update(doc(db, COLLECTIONS.EVENTS, rsvp.eventId), {
    rsvpCount: increment(1),
  });
  await batch.commit();
}

export async function getMemberEventRsvp(
  eventId: string,
  memberId: string
): Promise<EventRSVP | null> {
  const q = query(
    collection(db, COLLECTIONS.EVENT_RSVPS),
    where("eventId", "==", eventId),
    where("memberId", "==", memberId),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as EventRSVP;
}

// ─── Notifications ────────────────────────────────────────────
export async function getMemberNotifications(
  memberId: string,
  pageLimit = 30
): Promise<AppNotification[]> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("memberId", "==", memberId),
    orderBy("createdAt", "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), { read: true });
}

export async function markAllNotificationsRead(memberId: string): Promise<void> {
  const q = query(
    collection(db, COLLECTIONS.NOTIFICATIONS),
    where("memberId", "==", memberId),
    where("read", "==", false)
  );
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
}

export async function createNotification(
  notification: Omit<AppNotification, "id">
): Promise<void> {
  const ref = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
  await setDoc(ref, { ...notification, id: ref.id });
}

// ─── Leaderboard ─────────────────────────────────────────────
export async function getLeaderboard(
  sortBy: "reputationScore" | "xpScore" = "reputationScore",
  pageLimit = 50
): Promise<HouseMember[]> {
  const q = query(
    collection(db, COLLECTIONS.USERS),
    where("isBanned", "==", false),
    orderBy(sortBy, "desc"),
    limit(pageLimit)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as HouseMember));
}
