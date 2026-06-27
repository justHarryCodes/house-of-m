import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, VoteChoice } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
    const { searchParams } = new URL(req.url);
    const checkMemberId = searchParams.get("check");

    if (!checkMemberId) {
      return NextResponse.json<ApiResponse>({ error: "check param required" }, { status: 400 });
    }

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("votes")
      .where("proposalId", "==", proposalId)
      .where("memberId", "==", checkMemberId)
      .limit(1)
      .get();

    return NextResponse.json<ApiResponse>({
      data: snap.empty ? null : { choice: snap.docs[0].data().choice },
    });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
    const body = await req.json();
    const { memberId, telegramId, choice } = body as {
      memberId: string;
      telegramId: number;
      choice: VoteChoice;
    };

    if (!memberId || !choice || !["yes", "no", "abstain"].includes(choice)) {
      return NextResponse.json<ApiResponse>({ error: "Invalid vote data" }, { status: 400 });
    }

    const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    // Check existing vote
    const existingSnap = await db
      .collection("votes")
      .where("proposalId", "==", proposalId)
      .where("memberId", "==", memberId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json<ApiResponse>({ error: "Already voted" }, { status: 409 });
    }

    // Check proposal active
    const proposalRef = db.collection("proposals").doc(proposalId);
    const proposalSnap = await proposalRef.get();
    if (!proposalSnap.exists || proposalSnap.data()!.status !== "active") {
      return NextResponse.json<ApiResponse>({ error: "Proposal not active" }, { status: 404 });
    }

    const batch = db.batch();

    const voteRef = db.collection("votes").doc();
    batch.set(voteRef, {
      id: voteRef.id,
      proposalId,
      memberId,
      telegramId,
      choice,
      votedAt: Timestamp.now(),
    });

    batch.update(proposalRef, {
      [`voteCount.${choice}`]: FieldValue.increment(1),
      "voteCount.total": FieldValue.increment(1),
    });

    // Reputation reward
    const memberSnap = await db.collection("users").where("memberId", "==", memberId).limit(1).get();
    if (!memberSnap.empty) {
      const memberRef = memberSnap.docs[0].ref;
      batch.update(memberRef, {
        reputationScore: FieldValue.increment(10),
        xpScore: FieldValue.increment(10),
        governanceParticipationCount: FieldValue.increment(1),
        "contributionStats.votesParticipated": FieldValue.increment(1),
      });

      const repRef = db.collection("reputationHistory").doc();
      batch.set(repRef, {
        id: repRef.id,
        memberId,
        type: "vote_participated",
        points: 10,
        description: `Voted on: ${proposalSnap.data()!.title}`,
        referenceId: proposalId,
        createdAt: Timestamp.now(),
      });
    }

    await batch.commit();
    return NextResponse.json<ApiResponse>({ message: "Vote recorded" });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
