"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Sword, Scroll, Coins, Calendar, AlertTriangle, TrendingUp } from "lucide-react";

interface Stats {
  totalMembers: number;
  activeQuests: number;
  activeProposals: number;
  pendingSubmissions: number;
  openViolations: number;
  claimableRewards: number;
  upcomingEvents: number;
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    activeQuests: 0,
    activeProposals: 0,
    pendingSubmissions: 0,
    openViolations: 0,
    claimableRewards: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/users/stats").then(r => r.json()).catch(() => ({ data: {} })),
      fetch("/api/quests?status=active").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/proposals?status=active").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/violations?status=voting").then(r => r.json()).catch(() => ({ data: [] })),
      fetch("/api/events").then(r => r.json()).catch(() => ({ data: [] })),
    ]).then(([userStats, quests, proposals, violations, events]) => {
      setStats({
        totalMembers: userStats.data?.total ?? 0,
        activeQuests: quests.data?.length ?? 0,
        activeProposals: proposals.data?.length ?? 0,
        pendingSubmissions: 0,
        openViolations: violations.data?.length ?? 0,
        claimableRewards: 0,
        upcomingEvents: events.data?.length ?? 0,
      });
    });
  }, []);

  const CARDS = [
    { label: "Total Members", value: stats.totalMembers, icon: Users, color: "#c9a84c", href: "/admin/members" },
    { label: "Active Quests", value: stats.activeQuests, icon: Sword, color: "#4a90d9", href: "/admin/quests" },
    { label: "Active Proposals", value: stats.activeProposals, icon: Scroll, color: "#9b59b6", href: "/admin/governance" },
    { label: "Open Violations", value: stats.openViolations, icon: AlertTriangle, color: "#e74c3c", href: "/admin/violations" },
    { label: "Events", value: stats.upcomingEvents, icon: Calendar, color: "#27ae60", href: "/admin/events" },
    { label: "Pending Actions", value: stats.pendingSubmissions, icon: TrendingUp, color: "#a8b4c0", href: "/admin/quests" },
  ];

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">Overview</h1>
        <p className="text-[12px] text-[#6b7a87]">House of M command center</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {CARDS.map(({ label, value, icon: Icon, color, href }, i) => (
          <motion.a
            key={label}
            href={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="card-hom p-4 space-y-2 hover:border-white/15 transition-all"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${color}15` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[22px] font-bold text-white">{value}</p>
              <p className="text-[10px] text-[#6b7a87]">{label}</p>
            </div>
          </motion.a>
        ))}
      </div>

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Quick Actions</p>
        {[
          { href: "/admin/quests", label: "Create New Quest", icon: Sword },
          { href: "/admin/governance", label: "Create Proposal", icon: Scroll },
          { href: "/admin/violations", label: "Open Case", icon: AlertTriangle },
          { href: "/admin/events", label: "Schedule Event", icon: Calendar },
        ].map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="card-hom flex items-center gap-3 p-3.5 hover:border-white/15 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/10 flex items-center justify-center">
              <Icon size={14} className="text-[#c9a84c]" />
            </div>
            <span className="text-[13px] font-medium text-white">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
