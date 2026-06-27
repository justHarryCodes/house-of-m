import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, EventType, EventStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const snap = await db
      .collection("events")
      .where("status", "in", ["upcoming", "live"])
      .orderBy("startsAt", "asc")
      .limit(30)
      .get();

    const events = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: events });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, startsAt, hostId, hostDisplayName, externalUrl, imageUrl, maxAttendees, rewardXp, tags, createdBy } = body;

    if (!title || !type || !startsAt || !createdBy) {
      return NextResponse.json<ApiResponse>({ error: "Missing required fields" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const ref = db.collection("events").doc();
    await ref.set({
      id: ref.id,
      title,
      description,
      type: type as EventType,
      status: "upcoming" as EventStatus,
      hostId,
      hostDisplayName,
      externalUrl,
      imageUrl,
      startsAt: Timestamp.fromDate(new Date(startsAt)),
      rsvpCount: 0,
      maxAttendees,
      rewardXp,
      tags,
      createdAt: Timestamp.now(),
      createdBy,
    });

    return NextResponse.json<ApiResponse>({ data: { id: ref.id } }, { status: 201 });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
