import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { memberId, telegramId } = await req.json();
    if (!memberId) {
      return NextResponse.json<ApiResponse>({ error: "memberId required" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const rewardRef = db.collection("rewards").doc(id);

    await db.runTransaction(async (tx) => {
      const rewardSnap = await tx.get(rewardRef);
      if (!rewardSnap.exists) throw new Error("Reward not found");

      const data = rewardSnap.data()!;
      if (data.status !== "claimable") throw new Error("Reward is not claimable");

      if (data.totalSlots && data.claimedSlots >= data.totalSlots) {
        throw new Error("No slots remaining");
      }

      // Check for duplicate claim
      const claimsSnap = await db
        .collection("rewardClaims")
        .where("rewardId", "==", id)
        .where("memberId", "==", memberId)
        .limit(1)
        .get();
      if (!claimsSnap.empty) throw new Error("Already claimed");

      const claimRef = db.collection("rewardClaims").doc();
      tx.set(claimRef, {
        id: claimRef.id,
        rewardId: id,
        memberId,
        telegramId,
        status: "claimed",
        claimedAt: Timestamp.now(),
      });

      tx.update(rewardRef, {
        claimedSlots: (data.claimedSlots ?? 0) + 1,
      });
    });

    return NextResponse.json<ApiResponse>({ message: "Claimed" });
  } catch (err: any) {
    const msg = err?.message ?? "Server error";
    const status = ["Reward not found", "Reward is not claimable", "No slots remaining", "Already claimed"].includes(msg)
      ? 400
      : 500;
    return NextResponse.json<ApiResponse>({ error: msg }, { status });
  }
}
