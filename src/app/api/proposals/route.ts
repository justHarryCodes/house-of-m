import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse, Proposal, ProposalType, ProposalStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const pageLimit = parseInt(searchParams.get("limit") ?? "20");

    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    let q = db.collection("proposals").orderBy("createdAt", "desc").limit(pageLimit);
    if (status) q = db.collection("proposals").where("status", "==", status).orderBy("createdAt", "desc").limit(pageLimit) as any;

    const snap = await q.get();
    const proposals = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json<ApiResponse>({ data: proposals });
  } catch (err) {
    console.error("[proposals GET]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, endsAt, authorId, authorTelegramId, authorDisplayName, linkedMemberId, tags } = body;

    if (!title || !description || !type || !authorId) {
      return NextResponse.json<ApiResponse>({ error: "Missing required fields" }, { status: 400 });
    }

    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");
    const db = getFirestore();

    const now = Timestamp.now();
    const proposal = {
      title,
      description,
      type: type as ProposalType,
      status: "active" as ProposalStatus,
      authorId,
      authorTelegramId,
      authorDisplayName,
      startsAt: now,
      endsAt: endsAt ? Timestamp.fromDate(new Date(endsAt)) : Timestamp.fromMillis(Date.now() + 7 * 86400000),
      createdAt: now,
      voteCount: { yes: 0, no: 0, abstain: 0, total: 0 },
      participationRate: 0,
      quorum: 10,
      linkedMemberId,
      tags,
    };

    const ref = db.collection("proposals").doc();
    await ref.set({ ...proposal, id: ref.id });

    return NextResponse.json<ApiResponse>({ data: { id: ref.id } }, { status: 201 });
  } catch (err) {
    console.error("[proposals POST]", err);
    return NextResponse.json<ApiResponse>({ error: "Server error" }, { status: 500 });
  }
}
