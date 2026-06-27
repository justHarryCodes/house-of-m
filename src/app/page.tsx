"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/LoadingScreen";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, member, error, authenticate } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (error) return; // stay on this page and show error

    if (!isAuthenticated) {
      router.replace("/onboarding");
    } else if (member && !member.walletAddress) {
      router.replace("/onboarding/wallet");
    } else {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, member, error, router]);

  if (error) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center px-6 gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#e74c3c]/10 flex items-center justify-center text-3xl">⚠</div>
        <div className="text-center space-y-1">
          <p className="text-[15px] font-semibold text-white">Authentication Failed</p>
          <p className="text-[12px] text-[#6b7a87] max-w-xs">{error}</p>
        </div>
        <button
          onClick={() => authenticate()}
          className="px-6 py-3 rounded-2xl text-[13px] font-semibold text-[#0a0a0a]"
          style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96a)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  return <LoadingScreen message="Entering the House of Mon..." />;
}
