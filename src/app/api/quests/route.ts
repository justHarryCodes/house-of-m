import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Quest, QuestType, QuestStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "active";

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("quests")
      .where("status", "==", status)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const quests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: quests });
  } catch (err) {
    console.error("[quests GET]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, instructions, type, rewardXp, rewardReputation,
      rewardDescription, partnerName, requiresProof, proofInstructions,
      maxParticipants, endsAt, createdBy, tags, externalUrl, imageUrl } = body;

    if (!title || !description || !type || !createdBy) {
      return NextResponse.json<ApiResponse>({ error: "Missing required fields" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const now = Timestamp.now();
    const ref = db.collection("quests").doc();

    const quest = {
      title,
      description,
      instructions: instructions ?? "",
      type: type as QuestType,
      status: "active" as QuestStatus,
      rewardXp: rewardXp ?? 0,
      rewardReputation: rewardReputation ?? 0,
      rewardDescription,
      imageUrl,
      partnerName,
      requiresProof: requiresProof ?? false,
      proofInstructions,
      maxParticipants,
      currentParticipants: 0,
      startsAt: now,
      endsAt: endsAt ? Timestamp.fromDate(new Date(endsAt)) : Timestamp.fromMillis(Date.now() + 30 * 86400000),
      createdAt: now,
      createdBy,
      tags,
      externalUrl,
    };

    await ref.set({ ...quest, id: ref.id });
    return NextResponse.json<ApiResponse>({ data: { id: ref.id } }, { status: 201 });
  } catch (err) {
    console.error("[quests POST]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
