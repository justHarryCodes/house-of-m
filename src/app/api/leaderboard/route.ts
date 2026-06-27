import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = (searchParams.get("sort") ?? "reputationScore") as string;
    const validSorts = ["reputationScore", "xpScore", "governanceParticipationCount"];
    const field = validSorts.includes(sortBy) ? sortBy : "reputationScore";

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("users")
      .where("isBanned", "==", false)
      .orderBy(field, "desc")
      .limit(100)
      .get();

    const members = snap.docs.map((d, i) => ({
      rank: i + 1,
      uid: d.id,
      memberId: d.data().memberId,
      displayName: d.data().displayName,
      photoUrl: d.data().photoUrl,
      tier: d.data().tier,
      reputationScore: d.data().reputationScore,
      xpScore: d.data().xpScore,
      governanceParticipationCount: d.data().governanceParticipationCount,
    }));

    return NextResponse.json<ApiResponse>({ data: members });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
