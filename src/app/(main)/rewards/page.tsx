"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime } from "@/lib/utils";
import type { Reward, RewardType, RewardStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Coins, Gift, ExternalLink, Lock, CheckCircle2, Star, Zap } from "lucide-react";

const TYPE_ICONS: Record<RewardType, React.ElementType> = {
  airdrop: Zap,
  nft_drop: Star,
  whitelist: Gift,
  community_token: Coins,
  exclusive_access: Lock,
  merch: Gift,
};

const TYPE_COLORS: Record<RewardType, string> = {
  airdrop: "#c9a84c",
  nft_drop: "#9b59b6",
  whitelist: "#27ae60",
  community_token: "#4a90d9",
  exclusive_access: "#e74c3c",
  merch: "#a8b4c0",
};

const STATUS_CONFIG: Record<RewardStatus, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "#a8b4c0" },
  claimable: { label: "Claimable", color: "#27ae60" },
  claimed: { label: "Claimed", color: "#6b7a87" },
  expired: { label: "Expired", color: "#4a5568" },
};

function RewardCard({ reward, member }: { reward: Reward; member: any }) {
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const Icon = TYPE_ICONS[reward.type] ?? Gift;
  const color = TYPE_COLORS[reward.type] ?? "#c9a84c";
  const statusCfg = STATUS_CONFIG[reward.status];

  // Check if member meets requirements
  const isEligible = reward.eligibilityRequirements.every((req) => {
    if (req.type === "min_reputation") return member.reputationScore >= Number(req.value);
    if (req.type === "min_xp") return member.xpScore >= Number(req.value);
    if (req.type === "tier") return member.tier === req.value;
    return true;
  });

  const handleClaim = async () => {
    if (!isEligible || reward.status !== "claimable") return;
    if (reward.externalClaimUrl) {
      window.open(reward.externalClaimUrl, "_blank");
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch(`/api/rewards/${reward.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.memberId, telegramId: member.telegramId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setClaimed(true);
      toast.success("Reward claimed!");
    } catch (err: any) {
      toast.error(err.message ?? "Claim failed");
    } finally {
      setClaiming(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hom overflow-hidden"
    >
      {/* Image banner */}
      {reward.imageUrl ? (
        <div
          className="h-24 w-full"
          style={{
            backgroundImage: `url(${reward.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div
          className="h-16 w-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${color}10, ${color}25)` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium"
                style={{ background: `${color}15`, color }}
              >
                {reward.type.replace("_", " ")}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  background: `${statusCfg.color}15`,
                  color: statusCfg.color,
                }}
              >
                {statusCfg.label}
              </span>
            </div>
            <h3 className="text-[14px] font-semibold text-white">{reward.title}</h3>
            {reward.partnerName && (
              <p className="text-[11px] text-[#6b7a87]">by {reward.partnerName}</p>
            )}
          </div>
          {reward.totalSlots && (
            <div className="text-right">
              <p className="text-[12px] font-bold text-white">
                {reward.totalSlots - reward.claimedSlots}
              </p>
              <p className="text-[9px] text-[#6b7a87]">left</p>
            </div>
          )}
        </div>

        <p className="text-[11px] text-[#a8b4c0]">{reward.description}</p>

        {/* Requirements */}
        {reward.eligibilityRequirements.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] tracking-widest text-[#6b7a87] uppercase">Requirements</p>
            {reward.eligibilityRequirements.map((req, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-1 h-1 rounded-full"
                  style={{ background: isEligible ? "#27ae60" : "#e74c3c" }}
                />
                <span className="text-[11px] text-[#a8b4c0]">{req.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        {claimed || reward.status === "claimed" ? (
          <div className="flex items-center gap-1.5 text-[12px] text-[#27ae60]">
            <CheckCircle2 size={14} />
            Claimed
          </div>
        ) : reward.status === "claimable" ? (
          <Button
            onClick={handleClaim}
            disabled={!isEligible || claiming}
            className="w-full h-10 rounded-xl text-[13px] font-semibold border-0"
            style={{
              background: isEligible
                ? `linear-gradient(135deg, ${color}CC, ${color})`
                : "#1c1c1c",
              color: isEligible ? "#fff" : "#6b7a87",
            }}
          >
            {claiming ? "Claiming..." : isEligible ? (
              <span className="flex items-center gap-1.5">
                {reward.externalClaimUrl ? <><ExternalLink size={13} />Claim External</> : "Claim Reward"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5"><Lock size={13} />Not Eligible</span>
            )}
          </Button>
        ) : (
          <div className="h-8" />
        )}
      </div>
    </motion.div>
  );
}

export default function RewardsPage() {
  const { member } = useAuthStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | RewardStatus>("all");

  useEffect(() => {
    fetch("/api/rewards")
      .then(r => r.json())
      .then(d => setRewards(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!member) return null;

  const FILTERS: Array<"all" | RewardStatus> = ["all", "claimable", "upcoming", "claimed"];
  const filtered = filter === "all" ? rewards : rewards.filter(r => r.status === filter);

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">Rewards</h1>
        <p className="text-[12px] text-[#6b7a87]">Airdrops, NFTs, whitelists & more</p>
      </motion.div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 h-7 rounded-full text-[11px] font-medium capitalize transition-all duration-200
              ${filter === f ? "bg-[#c9a84c] text-[#0a0a0a]" : "bg-[#1c1c1c] text-[#6b7a87]"}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-hom p-10 text-center">
          <Gift size={28} className="text-[#6b7a87] mx-auto mb-3" />
          <p className="text-[13px] text-[#6b7a87]">No rewards in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <RewardCard key={r.id} reward={r} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
