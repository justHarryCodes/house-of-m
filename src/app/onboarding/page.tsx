"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { Shield, Zap, Crown, Users } from "lucide-react";

const PILLARS = [
  { icon: Shield, label: "Exclusive Access", desc: "Vetted Web3 builders only" },
  { icon: Zap, label: "Alpha Missions", desc: "Earn while you contribute" },
  { icon: Crown, label: "Governance Power", desc: "Shape the community" },
  { icon: Users, label: "Network Effects", desc: "Founders, investors, creators" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, member } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && member?.walletAddress) {
      router.replace("/dashboard");
    } else if (isAuthenticated && !member?.walletAddress) {
      router.replace("/onboarding/wallet");
    }
  }, [isAuthenticated, isLoading, member, router]);

  if (isLoading) return <LoadingScreen message="Authenticating with Telegram..." />;

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-between px-6 py-10">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center gap-6 mt-8"
      >
        {/* Emblem */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-[#c9a84c]/20 animate-pulse" />
          <div className="absolute inset-3 rounded-full border border-[#c9a84c]/10" />
          <div className="absolute inset-5 rounded-full bg-gradient-to-br from-[#c9a84c]/10 to-transparent" />
          <span
            className="text-6xl font-black z-10"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            M
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] tracking-[0.4em] text-[#6b7a87] uppercase">Welcome to</p>
          <h1
            className="text-[32px] font-black tracking-wider uppercase"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8c96a 50%, #c9a84c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            House of M
          </h1>
          <p className="text-[13px] text-[#a8b4c0] max-w-xs leading-relaxed mt-2">
            The exclusive Web3 opportunity network for builders, creators, and contributors.
          </p>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="roman-divider w-full my-6" />

      {/* Pillars */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-2 gap-3 w-full max-w-sm"
      >
        {PILLARS.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
            className="card-hom p-4 flex flex-col gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
              <Icon size={16} className="text-[#c9a84c]" />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-white">{label}</p>
              <p className="text-[11px] text-[#6b7a87] leading-tight">{desc}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Auth status */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-sm flex flex-col items-center gap-4 mt-6"
      >
        <div className="flex items-center gap-2 text-[12px] text-[#6b7a87]">
          <div className="w-1.5 h-1.5 rounded-full bg-[#27ae60] animate-pulse" />
          Authenticating via Telegram...
        </div>

        <div className="roman-divider w-full" />

        <p className="text-[11px] text-center text-[#6b7a87] px-4">
          By entering, you agree to uphold the House Code of Conduct
        </p>
      </motion.div>
    </div>
  );
}
