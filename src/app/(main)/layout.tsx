"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { LoadingScreen } from "@/components/common/LoadingScreen";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0a]">
      <Header />
      <main className="flex-1 pt-14 pb-20 overflow-y-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
