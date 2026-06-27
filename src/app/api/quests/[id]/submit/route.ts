import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;
    const body = await req.json();
    const { memberId, telegramId, proofUrl, proofText } = body;

    if (!memberId) {
      return NextResponse.json<ApiResponse>({ error: "memberId required" }, { status: 400 });
    }

    const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    // Check quest exists
    const questSnap = await db.collection("quests").doc(questId).get();
    if (!questSnap.exists || questSnap.data()!.status !== "active") {
      return NextResponse.json<ApiResponse>({ error: "Quest not found or inactive" }, { status: 404 });
    }

    // Check duplicate submission
    const existingSnap = await db
      .collection("questSubmissions")
      .where("questId", "==", questId)
      .where("memberId", "==", memberId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return NextResponse.json<ApiResponse>({ error: "Already submitted" }, { status: 409 });
    }

    const ref = db.collection("questSubmissions").doc();
    await ref.set({
      id: ref.id,
      questId,
      memberId,
      telegramId,
      proofUrl,
      proofText,
      status: "pending",
      submittedAt: Timestamp.now(),
      rewardDistributed: false,
    });

    await db.collection("quests").doc(questId).update({
      currentParticipants: FieldValue.increment(1),
    });

    return NextResponse.json<ApiResponse>({
      data: { submissionId: ref.id },
      message: "Submission received, pending review",
    }, { status: 201 });
  } catch (err) {
    console.error("[quests/submit]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
