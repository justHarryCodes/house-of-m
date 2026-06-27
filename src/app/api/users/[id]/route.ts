import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const q = db.collection("users").where("memberId", "==", id).limit(1);
    const snap = await q.get();

    if (snap.empty) {
      return NextResponse.json<ApiResponse>({ error: "Member not found" }, { status: 404 });
    }

    const doc = snap.docs[0];
    return NextResponse.json<ApiResponse>({
      data: { uid: doc.id, ...doc.data() },
    });
  } catch (err) {
    console.error("[users/[id]]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { walletAddress, bio, socialLinks } = body;

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const q = db.collection("users").where("memberId", "==", id).limit(1);
    const snap = await q.get();
    if (snap.empty) {
      return NextResponse.json<ApiResponse>({ error: "Member not found" }, { status: 404 });
    }

    const { isBanned } = body;
    const updates: Record<string, unknown> = { lastActiveAt: Timestamp.now() };
    if (walletAddress !== undefined) updates.walletAddress = walletAddress;
    if (bio !== undefined) updates.bio = bio;
    if (socialLinks !== undefined) updates.socialLinks = socialLinks;
    if (isBanned !== undefined) updates.isBanned = isBanned;

    await snap.docs[0].ref.update(updates);

    return NextResponse.json<ApiResponse>({ message: "Updated" });
  } catch (err) {
    console.error("[users/[id] PATCH]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
