import { NextRequest, NextResponse } from "next/server";
import { validateTelegramInitData } from "@/lib/telegram/validate";
import type { ApiResponse, HouseMember } from "@/types";

// POST /api/auth/telegram
// Validates Telegram initData, creates/fetches member, returns Firebase custom token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { initData } = body as { initData: string };

    if (!initData) {
      return NextResponse.json<ApiResponse>(
        { error: "initData required" },
        { status: 400 }
      );
    }

    const telegramUser = validateTelegramInitData(initData);
    if (!telegramUser) {
      return NextResponse.json<ApiResponse>(
        { error: "Invalid Telegram authentication" },
        { status: 401 }
      );
    }

    // Firebase Admin SDK operations are handled server-side
    // Import dynamically to avoid client-side bundling
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const { getFirestore, Timestamp } = await import("firebase-admin/firestore");

    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const adminAuth = getAuth();
    const adminDb = getFirestore();

    const uid = `tg_${telegramUser.id}`;

    // Upsert Firebase Auth user
    try {
      await adminAuth.getUser(uid);
    } catch {
      await adminAuth.createUser({
        uid,
        displayName: `${telegramUser.first_name}${telegramUser.last_name ? ` ${telegramUser.last_name}` : ""}`,
        photoURL: telegramUser.photo_url,
      });
    }

    // Check if member exists
    const memberRef = adminDb.collection("users").doc(uid);
    const memberSnap = await memberRef.get();

    let isNewMember = false;

    if (!memberSnap.exists) {
      isNewMember = true;
      // Get next member ID
      const counterRef = adminDb.collection("counters").doc("memberCounter");
      let nextId = 1;
      await adminDb.runTransaction(async (tx) => {
        const counterSnap = await tx.get(counterRef);
        if (counterSnap.exists) {
          nextId = (counterSnap.data()!.count as number) + 1;
        }
        tx.set(counterRef, { count: nextId });
      });

      const memberId = `M-${String(nextId).padStart(4, "0")}`;
      const displayName = telegramUser.last_name
        ? `${telegramUser.first_name} ${telegramUser.last_name}`
        : telegramUser.first_name;

      const newMember: Omit<HouseMember, "uid"> = {
        memberId,
        telegramId: telegramUser.id,
        username: telegramUser.username,
        displayName,
        photoUrl: telegramUser.photo_url,
        walletAddress: undefined,
        tier: "citizen",
        reputationScore: 50, // Join bonus
        xpScore: 50,
        joinedAt: Timestamp.now() as any,
        lastActiveAt: Timestamp.now() as any,
        isAdmin: false,
        isModerator: false,
        isBanned: false,
        referralCount: 0,
        contributionStats: {
          missionsCompleted: 0,
          votesParticipated: 0,
          spacesHosted: 0,
          communityContributions: 0,
          referrals: 0,
          partnerActivities: 0,
        },
        governanceParticipationCount: 0,
        nftOwned: [],
      };

      await memberRef.set(newMember);

      // Join bonus reputation event
      await adminDb.collection("reputationHistory").add({
        memberId,
        type: "join_bonus",
        points: 50,
        description: "Welcome to House of M — join bonus",
        createdAt: Timestamp.now(),
      });
    } else {
      // Update last active
      await memberRef.update({ lastActiveAt: Timestamp.now() });
    }

    const customToken = await adminAuth.createCustomToken(uid);
    const memberData = isNewMember
      ? (await memberRef.get()).data()
      : memberSnap.data();

    return NextResponse.json<ApiResponse>({
      data: {
        customToken,
        member: { uid, ...memberData },
        isNewMember,
        telegramUser,
      },
    });
  } catch (err) {
    console.error("[auth/telegram]", err);
    return NextResponse.json<ApiResponse>(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
