import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reviewedBy, reviewNote } = body;

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json<ApiResponse>({ error: "Invalid status" }, { status: 400 });
    }

    const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const subRef = db.collection("questSubmissions").doc(id);
    const subSnap = await subRef.get();
    if (!subSnap.exists) {
      return NextResponse.json<ApiResponse>({ error: "Submission not found" }, { status: 404 });
    }

    const batch = db.batch();
    batch.update(subRef, {
      status,
      reviewedAt: Timestamp.now(),
      reviewedBy,
      reviewNote,
    });

    // If approved, distribute rewards
    if (status === "approved") {
      const { questId, memberId } = subSnap.data()!;
      const questSnap = await db.collection("quests").doc(questId).get();

      if (questSnap.exists) {
        const quest = questSnap.data()!;
        const memberSnap = await db.collection("users")
          .where("memberId", "==", memberId).limit(1).get();

        if (!memberSnap.empty) {
          const memberRef = memberSnap.docs[0].ref;
          batch.update(memberRef, {
            reputationScore: FieldValue.increment(quest.rewardReputation ?? 0),
            xpScore: FieldValue.increment(quest.rewardXp ?? 0),
            "contributionStats.missionsCompleted": FieldValue.increment(1),
          });

          // Reputation event
          const repRef = db.collection("reputationHistory").doc();
          batch.set(repRef, {
            id: repRef.id,
            memberId,
            type: "mission_complete",
            points: quest.rewardReputation ?? 0,
            description: `Completed mission: ${quest.title}`,
            referenceId: questId,
            createdAt: Timestamp.now(),
          });
        }
      }

      batch.update(subRef, { rewardDistributed: true });
    }

    await batch.commit();
    return NextResponse.json<ApiResponse>({ message: "Submission reviewed" });
  } catch (err) {
    console.error("[submissions/[id]]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
