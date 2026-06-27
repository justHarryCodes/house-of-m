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
      .collection("notifications")
      .where("memberId", "==", memberId)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json<ApiResponse>({ data: notifications });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { memberId, notificationId } = body;

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    if (notificationId) {
      await db.collection("notifications").doc(notificationId).update({ read: true });
    } else if (memberId) {
      // Mark all read
      const snap = await db
        .collection("notifications")
        .where("memberId", "==", memberId)
        .where("read", "==", false)
        .get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    }

    return NextResponse.json<ApiResponse>({ message: "Updated" });
  } catch (err) {
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
