"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { getTierColor, getTierIcon, formatNumber } from "@/lib/utils";
import { TIER_LABELS, type MemberTier } from "@/types";
import { Trophy, Medal, Star, Shield, Crown } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  uid: string;
  memberId: string;
  displayName: string;
  photoUrl?: string;
  tier: MemberTier;
  reputationScore: number;
  xpScore: number;
  governanceParticipationCount: number;
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={16} className="text-[#c9a84c]" fill="#c9a84c" />;
  if (rank === 2) return <Medal size={16} className="text-[#d0dbe6]" fill="#d0dbe6" />;
  if (rank === 3) return <Medal size={16} className="text-[#cd7f32]" fill="#cd7f32" />;
  return (
    <span className="text-[12px] font-mono text-[#6b7a87] w-4 text-center">{rank}</span>
  );
}

function MemberRow({
  entry,
  sortBy,
  isMe,
  delay,
}: {
  entry: LeaderboardEntry;
  sortBy: string;
  isMe: boolean;
  delay: number;
}) {
  const tierColor = getTierColor(entry.tier);
  const tierIcon = getTierIcon(entry.tier);
  const score =
    sortBy === "xpScore"
      ? entry.xpScore
      : sortBy === "governanceParticipationCount"
      ? entry.governanceParticipationCount
      : entry.reputationScore;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
        isMe
          ? "border border-[#c9a84c]/30 bg-[#c9a84c]/5"
          : "card-hom"
      }`}
    >
      {/* Rank */}
      <div className="w-5 flex items-center justify-center shrink-0">
        <RankMedal rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div className="relative shrink-0">
        {entry.photoUrl ? (
          <img
            src={entry.photoUrl}
            alt={entry.displayName}
            className="w-10 h-10 rounded-xl object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[15px]"
            style={{ background: `${tierColor}15`, color: tierColor }}
          >
            {entry.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 text-[9px]"
          style={{ color: tierColor }}
        >
          {tierIcon}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-white truncate">
            {entry.displayName}
          </span>
          {isMe && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-[#c9a84c]/20 text-[#c9a84c] font-medium">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-mono text-[#6b7a87]">{entry.memberId}</span>
          <span
            className="text-[9px] px-1 rounded"
            style={{ background: `${tierColor}15`, color: tierColor }}
          >
            {TIER_LABELS[entry.tier]}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <span
          className="text-[16px] font-bold"
          style={{ color: entry.rank <= 3 ? "#c9a84c" : "#e8e8e8" }}
        >
          {formatNumber(score)}
        </span>
      </div>
    </motion.div>
  );
}

type SortKey = "reputationScore" | "xpScore" | "governanceParticipationCount";

export default function LeaderboardPage() {
  const { member } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("reputationScore");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?sort=${sortBy}`)
      .then(r => r.json())
      .then(d => setEntries(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sortBy]);

  if (!member) return null;

  const myRank = entries.findIndex(e => e.memberId === member.memberId) + 1;

  const SORTS: Array<{ key: SortKey; label: string; icon: React.ElementType }> = [
    { key: "reputationScore", label: "Reputation", icon: Star },
    { key: "xpScore", label: "XP", icon: Trophy },
    { key: "governanceParticipationCount", label: "Governance", icon: Shield },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        <h1 className="text-[20px] font-bold text-white">Leaderboard</h1>
        <p className="text-[12px] text-[#6b7a87]">The House standings</p>
      </motion.div>

      {/* My rank */}
      {myRank > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-hom-elevated p-4 flex items-center justify-between"
        >
          <div>
            <p className="text-[10px] text-[#6b7a87] uppercase tracking-widest">Your Rank</p>
            <p className="text-[28px] font-black text-[#c9a84c]">#{myRank}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#6b7a87]">out of {entries.length} members</p>
            <p className="text-[18px] font-bold text-white">
              {formatNumber(
                sortBy === "xpScore"
                  ? member.xpScore
                  : sortBy === "governanceParticipationCount"
                  ? member.governanceParticipationCount
                  : member.reputationScore
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2">
        {SORTS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-xl text-[11px] font-medium transition-all duration-200
              ${sortBy === key ? "bg-[#c9a84c] text-[#0a0a0a]" : "bg-[#1c1c1c] text-[#6b7a87]"}`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 50).map((entry, i) => (
            <MemberRow
              key={entry.uid}
              entry={entry}
              sortBy={sortBy}
              isMe={entry.memberId === member.memberId}
              delay={Math.min(i * 0.03, 0.5)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
