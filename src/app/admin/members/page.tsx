"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { getTierColor, formatNumber, formatRelativeTime } from "@/lib/utils";
import { TIER_LABELS } from "@/types";
import type { HouseMember, MemberTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Ban, ChevronRight } from "lucide-react";

export default function AdminMembersPage() {
  const { member: admin } = useAuthStore();
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/leaderboard?sort=reputationScore&limit=100")
      .then(r => r.json())
      .then(d => setMembers(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = members.filter(m =>
    !search ||
    m.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    (m as any).memberId?.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleBan = async (m: HouseMember) => {
    try {
      const res = await fetch(`/api/users/${(m as any).memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !m.isBanned }),
      });
      if (!res.ok) throw new Error();
      setMembers(prev => prev.map(mb =>
        (mb as any).memberId === (m as any).memberId ? { ...mb, isBanned: !mb.isBanned } : mb
      ));
      toast.success(m.isBanned ? "Member unbanned" : "Member banned");
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="px-4 py-5 space-y-4 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[18px] font-bold text-white">Members</h1>
        <p className="text-[11px] text-[#6b7a87]">{members.length} total members</p>
      </motion.div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7a87]" />
        <Input
          placeholder="Search by name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-8 bg-[#161616] border-white/10 text-white text-[13px]"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m: any) => {
            const tierColor = getTierColor(m.tier);
            return (
              <motion.div
                key={m.uid}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`card-hom flex items-center gap-3 p-3 ${m.isBanned ? "opacity-50" : ""}`}
              >
                {m.photoUrl ? (
                  <img src={m.photoUrl} alt={m.displayName} className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: `${tierColor}15`, color: tierColor }}>
                    {m.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[12px] font-semibold text-white truncate">{m.displayName}</p>
                    {m.isAdmin && <span className="text-[9px] px-1 rounded bg-[#e74c3c]/15 text-[#e74c3c]">Admin</span>}
                    {m.isBanned && <span className="text-[9px] px-1 rounded bg-[#4a5568]/30 text-[#6b7a87]">Banned</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#6b7a87]">{m.memberId}</span>
                    <span className="text-[9px]" style={{ color: tierColor }}>{TIER_LABELS[m.tier as MemberTier]}</span>
                    <span className="text-[10px] text-[#6b7a87]">{formatNumber(m.reputationScore)} rep</span>
                  </div>
                </div>
                {admin?.isAdmin && m.memberId !== admin.memberId && (
                  <button
                    onClick={() => handleToggleBan(m)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      m.isBanned
                        ? "bg-[#27ae60]/15 text-[#27ae60] hover:bg-[#27ae60]/25"
                        : "bg-[#e74c3c]/15 text-[#e74c3c] hover:bg-[#e74c3c]/25"
                    }`}
                    title={m.isBanned ? "Unban" : "Ban"}
                  >
                    <Ban size={12} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
