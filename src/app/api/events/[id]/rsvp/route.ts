import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const body = await req.json();
    const { memberId, telegramId } = body;

    if (!memberId) {
      return NextResponse.json<ApiResponse>({ error: "memberId required" }, { status: 400 });
    }

    const { getFirestore, Timestamp, FieldValue } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const existing = await db
      .collection("eventRsvps")
      .where("eventId", "==", eventId)
      .where("memberId", "==", memberId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json<ApiResponse>({ error: "Already RSVP'd" }, { status: 409 });
    }

    const batch = db.batch();

    const rsvpRef = db.collection("eventRsvps").doc();
    batch.set(rsvpRef, {
      id: rsvpRef.id,
      eventId,
      memberId,
      telegramId,
      rsvpAt: Timestamp.now(),
      attended: false,
    });

    batch.update(db.collection("events").doc(eventId), {
      rsvpCount: FieldValue.increment(1),
    });

    await batch.commit();

    return NextResponse.json<ApiResponse>({ message: "RSVP confirmed" });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
