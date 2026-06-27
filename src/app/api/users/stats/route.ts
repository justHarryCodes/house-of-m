import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db.collection("users").count().get();
    const total = snap.data().count;

    return NextResponse.json<ApiResponse>({ data: { total } });
  } catch (err) {
    console.error("[users/stats]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
