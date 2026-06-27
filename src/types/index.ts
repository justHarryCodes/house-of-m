// ============================================================
// House of M — Core Type Definitions
// ============================================================

import { Timestamp } from "firebase/firestore";

// ─── Member Tiers ────────────────────────────────────────────
export type MemberTier =
  | "citizen"
  | "patrician"
  | "senator"
  | "consul"
  | "emperor";

export const TIER_THRESHOLDS: Record<MemberTier, number> = {
  citizen: 0,
  patrician: 500,
  senator: 2000,
  consul: 5000,
  emperor: 15000,
};

export const TIER_LABELS: Record<MemberTier, string> = {
  citizen: "Citizen",
  patrician: "Patrician",
  senator: "Senator",
  consul: "Consul",
  emperor: "Emperor",
};

// ─── User / Profile ──────────────────────────────────────────
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  is_premium?: boolean;
  language_code?: string;
}

export interface HouseMember {
  uid: string;                    // Firebase UID
  memberId: string;               // M-0001 format
  telegramId: number;
  username?: string;
  displayName: string;
  photoUrl?: string;
  walletAddress?: string;
  tier: MemberTier;
  reputationScore: number;
  xpScore: number;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  isAdmin: boolean;
  isModerator: boolean;
  isBanned: boolean;
  referredBy?: string;            // memberId of referrer
  referralCount: number;
  contributionStats: ContributionStats;
  governanceParticipationCount: number;
  nftOwned: string[];             // token IDs
  bio?: string;
  socialLinks?: SocialLinks;
}

export interface ContributionStats {
  missionsCompleted: number;
  votesParticipated: number;
  spacesHosted: number;
  communityContributions: number;
  referrals: number;
  partnerActivities: number;
}

export interface SocialLinks {
  twitter?: string;
  github?: string;
  website?: string;
}

// ─── Reputation ───────────────────────────────────────────────
export type ReputationEventType =
  | "mission_complete"
  | "vote_participated"
  | "space_hosted"
  | "community_contribution"
  | "referral"
  | "partner_activity"
  | "spam_penalty"
  | "violation_penalty"
  | "inactivity_penalty"
  | "admin_adjustment"
  | "nft_bonus"
  | "join_bonus";

export interface ReputationEvent {
  id: string;
  memberId: string;
  type: ReputationEventType;
  points: number;               // positive = gain, negative = loss
  description: string;
  referenceId?: string;         // linked quest/proposal/violation id
  createdAt: Timestamp;
  createdBy?: string;           // admin uid if manual
}

// ─── Governance ───────────────────────────────────────────────
export type ProposalType =
  | "community_decision"
  | "member_review"
  | "rule_update"
  | "partner_approval";

export type ProposalStatus =
  | "draft"
  | "active"
  | "passed"
  | "rejected"
  | "cancelled";

export type VoteChoice = "yes" | "no" | "abstain";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  authorId: string;             // memberId
  authorTelegramId: number;
  authorDisplayName: string;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt: Timestamp;
  voteCount: {
    yes: number;
    no: number;
    abstain: number;
    total: number;
  };
  participationRate: number;    // 0-100
  quorum: number;               // minimum votes required
  linkedMemberId?: string;      // for member_review type
  tags?: string[];
}

export interface Vote {
  id: string;
  proposalId: string;
  memberId: string;
  telegramId: number;
  choice: VoteChoice;
  votedAt: Timestamp;
}

// ─── Quests / Missions ────────────────────────────────────────
export type QuestType =
  | "social"
  | "partner"
  | "community"
  | "governance"
  | "creative";

export type QuestStatus = "upcoming" | "active" | "completed" | "cancelled";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface Quest {
  id: string;
  title: string;
  description: string;
  instructions: string;
  type: QuestType;
  status: QuestStatus;
  rewardXp: number;
  rewardReputation: number;
  rewardDescription?: string;   // e.g. "WL spot + 50 XP"
  imageUrl?: string;
  partnerName?: string;
  partnerLogoUrl?: string;
  requiresProof: boolean;
  proofInstructions?: string;
  maxParticipants?: number;
  currentParticipants: number;
  startsAt: Timestamp;
  endsAt: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  tags?: string[];
  externalUrl?: string;
}

export interface QuestSubmission {
  id: string;
  questId: string;
  memberId: string;
  telegramId: number;
  proofUrl?: string;
  proofText?: string;
  proofScreenshotUrl?: string;
  status: SubmissionStatus;
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNote?: string;
  rewardDistributed: boolean;
}

// ─── Rewards ──────────────────────────────────────────────────
export type RewardType =
  | "airdrop"
  | "nft_drop"
  | "whitelist"
  | "community_token"
  | "exclusive_access"
  | "merch";

export type RewardStatus = "upcoming" | "claimable" | "claimed" | "expired";

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: RewardType;
  partnerName?: string;
  partnerLogoUrl?: string;
  imageUrl?: string;
  status: RewardStatus;
  eligibilityRequirements: EligibilityRequirement[];
  totalSlots?: number;
  claimedSlots: number;
  claimDeadline?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  externalClaimUrl?: string;
}

export interface EligibilityRequirement {
  type: "min_reputation" | "min_xp" | "tier" | "nft_holder" | "quest_complete" | "custom";
  value: string | number;
  description: string;
}

export interface RewardClaim {
  id: string;
  rewardId: string;
  memberId: string;
  telegramId: number;
  claimedAt: Timestamp;
  txHash?: string;
}

// ─── Violations / House Review ────────────────────────────────
export type ViolationType =
  | "spam"
  | "harassment"
  | "misinformation"
  | "scam"
  | "rule_violation"
  | "impersonation"
  | "other";

export type ViolationStatus =
  | "open"
  | "voting"
  | "resolved_retain"
  | "resolved_evict"
  | "dismissed";

export type ViolationVoteChoice = "retain" | "evict";

export interface Violation {
  id: string;
  accusedMemberId: string;
  accusedDisplayName: string;
  accusedTelegramId: number;
  type: ViolationType;
  reason: string;
  evidence: string;
  screenshotUrls?: string[];
  reportedBy: string;           // admin memberId
  status: ViolationStatus;
  voteCount: {
    retain: number;
    evict: number;
    total: number;
  };
  votingEndsAt?: Timestamp;
  resolvedAt?: Timestamp;
  resolution?: string;
  createdAt: Timestamp;
}

export interface ViolationVote {
  id: string;
  violationId: string;
  memberId: string;
  telegramId: number;
  choice: ViolationVoteChoice;
  votedAt: Timestamp;
}

// ─── NFT Membership ───────────────────────────────────────────
export interface NFTMembership {
  id: string;
  memberId: string;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  imageUrl?: string;
  name: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
  attributes?: NFTAttribute[];
  reputationBoost?: number;     // % boost
  acquiredAt: Timestamp;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

// ─── Events ───────────────────────────────────────────────────
export type EventType = "x_space" | "community" | "partner" | "governance" | "ama";
export type EventStatus = "upcoming" | "live" | "ended" | "cancelled";

export interface HouseEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  hostId: string;
  hostDisplayName: string;
  hostAvatarUrl?: string;
  externalUrl?: string;         // Twitter Space link, etc.
  imageUrl?: string;
  startsAt: Timestamp;
  endsAt?: Timestamp;
  rsvpCount: number;
  maxAttendees?: number;
  rewardXp?: number;
  rewardReputation?: number;
  tags?: string[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface EventRSVP {
  id: string;
  eventId: string;
  memberId: string;
  telegramId: number;
  rsvpAt: Timestamp;
  attended?: boolean;
}

// ─── Notifications ────────────────────────────────────────────
export type NotificationType =
  | "new_vote"
  | "new_quest"
  | "reward_available"
  | "governance_update"
  | "house_announcement"
  | "violation_opened"
  | "quest_approved"
  | "quest_rejected"
  | "reputation_change"
  | "tier_upgrade"
  | "event_reminder";

export interface AppNotification {
  id: string;
  memberId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  referenceId?: string;
  referenceType?: "proposal" | "quest" | "reward" | "violation" | "event";
  createdAt: Timestamp;
}

// ─── Leaderboard ─────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  memberId: string;
  displayName: string;
  photoUrl?: string;
  tier: MemberTier;
  reputationScore: number;
  xpScore: number;
  contributionScore: number;
  governanceScore: number;
}

// ─── API Response helpers ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
