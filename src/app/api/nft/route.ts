import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    if (!memberId) {
      return NextResponse.json<ApiResponse>({ error: "memberId required" }, { status: 400 });
    }

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("nftMemberships")
      .where("memberId", "==", memberId)
      .get();

    const nfts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: nfts });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
