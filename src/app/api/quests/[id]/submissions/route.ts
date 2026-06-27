import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questId } = await params;
    const { searchParams } = new URL(req.url);
    const checkMemberId = searchParams.get("check");

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    if (checkMemberId) {
      const snap = await db
        .collection("questSubmissions")
        .where("questId", "==", questId)
        .where("memberId", "==", checkMemberId)
        .limit(1)
        .get();
      return NextResponse.json<ApiResponse>({
        data: snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() },
      });
    }

    const snap = await db
      .collection("questSubmissions")
      .where("questId", "==", questId)
      .orderBy("submittedAt", "desc")
      .get();

    return NextResponse.json<ApiResponse>({
      data: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
