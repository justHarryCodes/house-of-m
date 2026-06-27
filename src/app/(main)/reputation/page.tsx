"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { getReputationHistory } from "@/lib/firebase/firestore";
import { formatRelativeTime, formatNumber, getTierColor, calculateLevel, xpProgress, xpForNextLevel } from "@/lib/utils";
import { TIER_LABELS, TIER_THRESHOLDS, type ReputationEvent, type MemberTier } from "@/types";
import { Shield, TrendingUp, TrendingDown, Star, Award, Zap } from "lucide-react";

const EVENT_ICONS: Record<string, React.ElementType> = {
  mission_complete: Zap,
  vote_participated: Shield,
  space_hosted: Star,
  community_contribution: Award,
  referral: TrendingUp,
  join_bonus: Star,
  spam_penalty: TrendingDown,
  violation_penalty: TrendingDown,
  inactivity_penalty: TrendingDown,
  admin_adjustment: Shield,
  nft_bonus: Star,
  partner_activity: Award,
};

const EVENT_LABELS: Record<string, string> = {
  mission_complete: "Mission Completed",
  vote_participated: "Governance Vote",
  space_hosted: "Space Hosted",
  community_contribution: "Community Contribution",
  referral: "Referral Bonus",
  join_bonus: "Join Bonus",
  spam_penalty: "Spam Penalty",
  violation_penalty: "Violation Penalty",
  inactivity_penalty: "Inactivity Penalty",
  admin_adjustment: "Admin Adjustment",
  nft_bonus: "NFT Boost",
  partner_activity: "Partner Activity",
};

function TierBar({ current }: { current: MemberTier }) {
  const tiers: MemberTier[] = ["citizen", "patrician", "senator", "consul", "emperor"];
  const currentIdx = tiers.indexOf(current);

  return (
    <div className="flex items-center gap-1 w-full">
      {tiers.map((tier, i) => (
        <div key={tier} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="h-1.5 w-full rounded-full transition-all duration-500"
            style={{
              background: i <= currentIdx ? getTierColor(current) : "#1c1c1c",
            }}
          />
          <span
            className="text-[9px] uppercase tracking-wide"
            style={{ color: i <= currentIdx ? getTierColor(tier) : "#4a5568" }}
          >
            {TIER_LABELS[tier].slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ReputationPage() {
  const { member } = useAuthStore();
  const [history, setHistory] = useState<ReputationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member) return;
    getReputationHistory(member.memberId, 50)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [member?.memberId]);

  if (!member) return null;

  const tierColor = getTierColor(member.tier);
  const level = calculateLevel(member.xpScore);
  const xpPct = xpProgress(member.xpScore);
  const nextXp = xpForNextLevel(member.xpScore);

  const tiers: MemberTier[] = ["citizen", "patrician", "senator", "consul", "emperor"];
  const nextTierIdx = tiers.indexOf(member.tier) + 1;
  const nextTier = tiers[nextTierIdx];
  const nextTierThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const toNextTier = nextTierThreshold
    ? nextTierThreshold - member.reputationScore
    : null;

  return (
    <div className="px-4 py-5 space-y-6 max-w-md mx-auto">
      {/* Rep overview */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hom-elevated p-5 space-y-5"
      >
        {/* Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-1">
              Reputation Score
            </p>
            <div className="flex items-end gap-2">
              <span
                className="text-[42px] font-black leading-none"
                style={{ color: tierColor }}
              >
                {formatNumber(member.reputationScore)}
              </span>
              <span className="text-[14px] text-[#6b7a87] pb-1">pts</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide"
              style={{ background: `${tierColor}15`, color: tierColor }}
            >
              {TIER_LABELS[member.tier]}
            </span>
            {toNextTier && nextTier && (
              <span className="text-[10px] text-[#6b7a87]">
                {formatNumber(toNextTier)} to {TIER_LABELS[nextTier]}
              </span>
            )}
          </div>
        </div>

        {/* Tier progression */}
        <TierBar current={member.tier} />

        {/* XP row */}
        <div className="card-hom p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-[#c9a84c]" />
            </div>
            <div>
              <p className="text-[11px] text-[#a8b4c0]">Level {level}</p>
              <p className="text-[10px] text-[#6b7a87]">{formatNumber(member.xpScore)} XP total</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 w-24">
            <span className="text-[10px] text-[#6b7a87]">{Math.round(xpPct)}%</span>
            <div className="h-1 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="h-full rounded-full bg-[#c9a84c]"
              />
            </div>
            <span className="text-[9px] text-[#4a5568]">{formatNumber(nextXp)} to L{level + 1}</span>
          </div>
        </div>

        {/* Earning summary */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { label: "Missions", value: member.contributionStats.missionsCompleted },
            { label: "Votes", value: member.contributionStats.votesParticipated },
            { label: "Spaces", value: member.contributionStats.spacesHosted },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[16px] font-bold text-white">{value}</p>
              <p className="text-[10px] text-[#6b7a87]">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Earning breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-3">
          How You Earn Points
        </p>
        <div className="card-hom p-4 space-y-2">
          {[
            { action: "Complete a mission", pts: "+50–200" },
            { action: "Participate in governance vote", pts: "+10" },
            { action: "Host a Space", pts: "+100" },
            { action: "Refer a member", pts: "+150" },
            { action: "NFT ownership boost", pts: "×1.1" },
            { action: "Inactivity (30d)", pts: "−50" },
            { action: "Rule violation", pts: "−100–500" },
          ].map(({ action, pts }) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-[12px] text-[#a8b4c0]">{action}</span>
              <span
                className="text-[11px] font-mono font-semibold"
                style={{ color: pts.startsWith("+") || pts.startsWith("×") ? "#27ae60" : "#e74c3c" }}
              >
                {pts}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* History */}
      <div>
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-3">
          Activity History
        </p>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <div className="card-hom p-8 text-center text-[#6b7a87] text-[13px]">
            No activity yet. Complete missions to earn points.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((event, i) => {
              const Icon = EVENT_ICONS[event.type] ?? Shield;
              const isPositive = event.points > 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="card-hom flex items-center gap-3 p-3.5"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isPositive ? "rgba(39, 174, 96, 0.1)" : "rgba(231, 76, 60, 0.1)",
                    }}
                  >
                    <Icon
                      size={16}
                      style={{ color: isPositive ? "#27ae60" : "#e74c3c" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">
                      {EVENT_LABELS[event.type] ?? event.type}
                    </p>
                    <p className="text-[10px] text-[#6b7a87] truncate">{event.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-[13px] font-bold"
                      style={{ color: isPositive ? "#27ae60" : "#e74c3c" }}
                    >
                      {isPositive ? "+" : ""}{event.points}
                    </span>
                    <p className="text-[9px] text-[#6b7a87]">
                      {formatRelativeTime((event.createdAt as any)?.toDate?.() ?? new Date())}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
