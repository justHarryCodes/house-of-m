"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import {
  formatNumber,
  getTierColor,
  getTierIcon,
  calculateLevel,
  xpProgress,
  xpForNextLevel,
  truncateAddress,
} from "@/lib/utils";
import { TIER_LABELS } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Scroll,
  Sword,
  Trophy,
  Coins,
  Calendar,
  Shield,
  Wallet,
  TrendingUp,
  ChevronRight,
  Star,
} from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
  accent,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  href?: string;
  accent?: string;
  delay?: number;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card-hom p-4 flex flex-col gap-3 relative overflow-hidden group"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at top left, ${accent ?? "#c9a84c"}0a, transparent 60%)`,
        }}
      />
      <div className="flex items-start justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accent ?? "#c9a84c"}15` }}
        >
          <Icon size={18} style={{ color: accent ?? "#c9a84c" }} />
        </div>
        {href && (
          <ChevronRight size={14} className="text-[#6b7a87] group-hover:text-[#c9a84c] transition-colors" />
        )}
      </div>
      <div>
        <div className="text-[22px] font-bold text-white leading-none">{value}</div>
        <div className="text-[11px] text-[#6b7a87] mt-0.5">{label}</div>
        {sub && <div className="text-[10px] text-[#4a5568] mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function DashboardPage() {
  const { member } = useAuthStore();
  const [stats, setStats] = useState({
    activeMissions: 0,
    activeVotes: 0,
    availableRewards: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/quests?status=active").then((r) => r.json()),
      fetch("/api/proposals?status=active").then((r) => r.json()),
      fetch("/api/rewards").then((r) => r.json()),
      fetch("/api/events").then((r) => r.json()),
    ]).then(([quests, proposals, rewards, events]) => {
      setStats({
        activeMissions: quests.data?.length ?? 0,
        activeVotes: proposals.data?.length ?? 0,
        availableRewards: rewards.data?.filter((r: any) => r.status === "claimable").length ?? 0,
        upcomingEvents: events.data?.length ?? 0,
      });
    }).catch(() => {});
  }, []);

  if (!member) return null;

  const level = calculateLevel(member.xpScore);
  const xpPct = xpProgress(member.xpScore);
  const nextLevelXp = xpForNextLevel(member.xpScore);
  const tierColor = getTierColor(member.tier);
  const tierIcon = getTierIcon(member.tier);

  return (
    <div className="px-4 py-5 space-y-6 max-w-md mx-auto">
      {/* Member Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card-hom-elevated p-5 relative overflow-hidden"
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-2xl"
          style={{ background: tierColor }}
        />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.displayName}
                  className="w-14 h-14 rounded-2xl object-cover"
                  style={{ outline: `2px solid ${tierColor}40` }}
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: `${tierColor}15`,
                    outline: `2px solid ${tierColor}40`,
                    color: tierColor,
                  }}
                >
                  {member.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="absolute -bottom-1 -right-1 text-sm"
                style={{ color: tierColor }}
              >
                {tierIcon}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[18px] font-bold text-white leading-tight">
                  {member.displayName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[#6b7a87] font-mono">{member.memberId}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide"
                  style={{
                    background: `${tierColor}15`,
                    color: tierColor,
                  }}
                >
                  {TIER_LABELS[member.tier]}
                </span>
              </div>
              {member.walletAddress && (
                <div className="flex items-center gap-1 mt-1">
                  <Wallet size={10} className="text-[#6b7a87]" />
                  <span className="text-[10px] font-mono text-[#6b7a87]">
                    {truncateAddress(member.walletAddress)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star size={12} className="text-[#c9a84c]" fill="#c9a84c" />
              <span className="text-[18px] font-bold text-white">
                {formatNumber(member.reputationScore)}
              </span>
            </div>
            <span className="text-[10px] text-[#6b7a87]">Reputation</span>
          </div>
        </div>

        {/* XP Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[#c9a84c]" />
              <span className="text-[11px] text-[#a8b4c0]">
                Level {level} — {formatNumber(member.xpScore)} XP
              </span>
            </div>
            <span className="text-[10px] text-[#6b7a87]">
              {formatNumber(nextLevelXp)} to L{level + 1}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-[#1c1c1c] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${tierColor}80, ${tierColor})`,
              }}
            />
          </div>
        </div>
      </motion.div>

      <div className="roman-divider w-full" />

      <div>
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-3">
          Active Intelligence
        </p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Sword} label="Active Missions" value={stats.activeMissions} href="/missions" delay={0.1} />
          <StatCard icon={Scroll} label="Active Votes" value={stats.activeVotes} href="/governance" delay={0.15} />
          <StatCard icon={Coins} label="Rewards Available" value={stats.availableRewards} href="/rewards" accent="#27ae60" delay={0.2} />
          <StatCard icon={Calendar} label="Upcoming Events" value={stats.upcomingEvents} href="/events" accent="#4a90d9" delay={0.25} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-3">Contribution Record</p>
        <div className="card-hom p-4 grid grid-cols-3 gap-4">
          {[
            { label: "Missions", value: member.contributionStats.missionsCompleted },
            { label: "Votes", value: member.contributionStats.votesParticipated },
            { label: "Referrals", value: member.contributionStats.referrals },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-[20px] font-bold text-white">{value}</span>
              <span className="text-[10px] text-[#6b7a87]">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase mb-3">Navigate</p>
        <div className="space-y-2">
          {[
            { href: "/reputation", icon: Shield, label: "Reputation History", desc: "View your full rep log" },
            { href: "/nft", icon: Star, label: "Beramon NFTs", desc: "Your House of Mon NFTs" },
            { href: "/leaderboard", icon: Trophy, label: "Leaderboard", desc: "Top members ranking" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link key={href} href={href} className="card-hom flex items-center gap-3 p-3.5 hover:border-[#c9a84c]/20 transition-all duration-200 group">
              <div className="w-9 h-9 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
                <Icon size={16} className="text-[#c9a84c]" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">{label}</p>
                <p className="text-[11px] text-[#6b7a87]">{desc}</p>
              </div>
              <ChevronRight size={14} className="text-[#6b7a87] group-hover:text-[#c9a84c] transition-colors" />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
