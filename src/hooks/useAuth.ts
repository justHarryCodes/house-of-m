"use client";

import { useEffect, useCallback } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { subscribeToMember } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { useTelegram } from "./useTelegram";

export function useAuth() {
  const { webApp, isReady } = useTelegram();
  const {
    telegramUser,
    initData,
    member,
    isAuthenticated,
    isLoading,
    error,
    setMember,
    setLoading,
    setError,
  } = useAuthStore();

  const authenticate = useCallback(async () => {
    if (!initData && process.env.NODE_ENV !== "development") return;

    setLoading(true);
    setError(null);

    try {
      const payload = initData || "mock_init_data";

      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: payload }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error ?? "Authentication failed");
      }

      const { customToken, member: memberData } = json.data;

      // Sign in to Firebase with custom token
      await signInWithCustomToken(auth, customToken);

      setMember(memberData);
    } catch (err: any) {
      console.error("[useAuth]", err);
      setError(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  }, [initData, setLoading, setError, setMember]);

  // Subscribe to live member updates
  useEffect(() => {
    if (!member?.uid) return;
    const unsubscribe = subscribeToMember(member.uid, (updated) => {
      if (updated) setMember(updated);
    });
    return unsubscribe;
  }, [member?.uid, setMember]);

  // Trigger auth when Telegram SDK is ready
  useEffect(() => {
    if (isReady && !isAuthenticated && !isLoading) {
      authenticate();
    }
  }, [isReady, isAuthenticated, isLoading, authenticate]);

  return {
    member,
    telegramUser,
    isAuthenticated,
    isLoading,
    error,
    authenticate,
  };
}
