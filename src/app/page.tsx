"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/LoadingScreen";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, member } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/onboarding");
    } else if (member && !member.walletAddress) {
      router.replace("/onboarding/wallet");
    } else {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, member, router]);

  return <LoadingScreen message="Entering the House..." />;
}
