import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, ViolationVoteChoice } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: violationId } = await params;
    const body = await req.json();
    const { memberId, telegramId, choice } = body as {
      memberId: string;
      telegramId: number;
      choice: ViolationVoteChoice;
    };

    if (!memberId || !["retain", "evict"].includes(choice)) {
      return NextResponse.json<ApiResponse>({ error: "Invalid vote" }, { status: 400 });
    }

    const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const existing = await db
      .collection("violationVotes")
      .where("violationId", "==", violationId)
      .where("memberId", "==", memberId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json<ApiResponse>({ error: "Already voted" }, { status: 409 });
    }

    const batch = db.batch();

    const voteRef = db.collection("violationVotes").doc();
    batch.set(voteRef, {
      id: voteRef.id,
      violationId,
      memberId,
      telegramId,
      choice,
      votedAt: Timestamp.now(),
    });

    batch.update(db.collection("violations").doc(violationId), {
      [`voteCount.${choice}`]: FieldValue.increment(1),
      "voteCount.total": FieldValue.increment(1),
    });

    await batch.commit();

    return NextResponse.json<ApiResponse>({ message: "Vote recorded" });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
