import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, RewardType, RewardStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("rewards")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const rewards = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: rewards });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, partnerName, partnerLogoUrl, imageUrl,
      eligibilityRequirements, totalSlots, claimDeadline, externalClaimUrl, createdBy } = body;

    if (!title || !type || !createdBy) {
      return NextResponse.json<ApiResponse>({ error: "Missing required fields" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const ref = db.collection("rewards").doc();
    await ref.set({
      id: ref.id,
      title,
      description,
      type: type as RewardType,
      partnerName,
      partnerLogoUrl,
      imageUrl,
      status: "upcoming" as RewardStatus,
      eligibilityRequirements: eligibilityRequirements ?? [],
      totalSlots,
      claimedSlots: 0,
      claimDeadline: claimDeadline ? Timestamp.fromDate(new Date(claimDeadline)) : null,
      externalClaimUrl,
      createdAt: Timestamp.now(),
      createdBy,
    });

    return NextResponse.json<ApiResponse>({ data: { id: ref.id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
