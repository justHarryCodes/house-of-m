import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, ViolationType, ViolationStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    let ref: any = db.collection("violations").orderBy("createdAt", "desc").limit(50);
    if (status) {
      ref = db.collection("violations").where("status", "==", status).orderBy("createdAt", "desc").limit(50);
    }

    const snap = await ref.get();
    const violations = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: violations });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accusedMemberId, accusedDisplayName, accusedTelegramId, type, reason, evidence, reportedBy } = body;

    if (!accusedMemberId || !type || !reason || !reportedBy) {
      return NextResponse.json<ApiResponse>({ error: "Missing required fields" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const ref = db.collection("violations").doc();
    await ref.set({
      id: ref.id,
      accusedMemberId,
      accusedDisplayName,
      accusedTelegramId,
      type: type as ViolationType,
      reason,
      evidence,
      screenshotUrls: body.screenshotUrls ?? [],
      reportedBy,
      status: "voting" as ViolationStatus,
      voteCount: { retain: 0, evict: 0, total: 0 },
      votingEndsAt: Timestamp.fromMillis(Date.now() + 3 * 86400000),
      createdAt: Timestamp.now(),
    });

    return NextResponse.json<ApiResponse>({ data: { id: ref.id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
