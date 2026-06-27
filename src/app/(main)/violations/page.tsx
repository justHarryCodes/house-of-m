"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime, formatTimeUntil } from "@/lib/utils";
import type { Violation, ViolationType, ViolationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Clock, Users, CheckCircle, XCircle } from "lucide-react";

const TYPE_LABELS: Record<ViolationType, string> = {
  spam: "Spam",
  harassment: "Harassment",
  misinformation: "Misinformation",
  scam: "Scam",
  rule_violation: "Rule Violation",
  impersonation: "Impersonation",
  other: "Other",
};

const STATUS_CONFIG: Record<ViolationStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "#c9a84c" },
  voting: { label: "Voting", color: "#4a90d9" },
  resolved_retain: { label: "Retained", color: "#27ae60" },
  resolved_evict: { label: "Evicted", color: "#e74c3c" },
  dismissed: { label: "Dismissed", color: "#6b7a87" },
};

function ViolationCard({ violation, memberId }: { violation: Violation; memberId: string }) {
  const [voted, setVoted] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const cfg = STATUS_CONFIG[violation.status];
  const isVoting = violation.status === "voting";
  const endsAt = (violation.votingEndsAt as any)?.toDate?.();
  const total = violation.voteCount.total || 1;
  const retainRatio = (violation.voteCount.retain / total) * 100;
  const evictRatio = (violation.voteCount.evict / total) * 100;

  const handleVote = async (choice: "retain" | "evict") => {
    if (!isVoting || voted) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/violations/${violation.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, choice }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setVoted(choice);
      toast.success(`Voted to ${choice} member`);
    } catch (err: any) {
      toast.error(err.message ?? "Vote failed");
    } finally {
      setVoting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hom p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
              style={{ background: `${cfg.color}15`, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c1c1c] text-[#6b7a87]">
              {TYPE_LABELS[violation.type]}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-[#e74c3c]" />
            <span className="text-[14px] font-semibold text-white">
              {violation.accusedDisplayName}
            </span>
          </div>
          <p className="text-[11px] text-[#6b7a87] mt-0.5">{violation.accusedMemberId}</p>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-[11px] text-[#a8b4c0]">
          <span className="text-[#6b7a87]">Reason: </span>
          {violation.reason}
        </p>
        <p className="text-[11px] text-[#a8b4c0] line-clamp-2">
          <span className="text-[#6b7a87]">Evidence: </span>
          {violation.evidence}
        </p>
      </div>

      {/* Vote bar */}
      {violation.voteCount.total > 0 && (
        <div className="space-y-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1c1c1c]">
            <div className="h-full bg-[#27ae60] transition-all" style={{ width: `${retainRatio}%` }} />
            <div className="h-full bg-[#e74c3c] transition-all" style={{ width: `${evictRatio}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6b7a87]">
            <span className="text-[#27ae60]">Retain: {violation.voteCount.retain}</span>
            <span className="text-[#e74c3c]">Evict: {violation.voteCount.evict}</span>
          </div>
        </div>
      )}

      {/* Vote actions */}
      {isVoting && (
        <div className="space-y-2">
          {voted ? (
            <div className="flex items-center gap-2 text-[12px] text-[#6b7a87]">
              <CheckCircle size={13} className="text-[#27ae60]" />
              You voted to {voted} this member
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleVote("retain")}
                disabled={voting}
                className="h-9 rounded-xl text-[12px] font-semibold border border-[#27ae60]/30 text-[#27ae60] hover:bg-[#27ae60]/10 transition-all"
              >
                <CheckCircle size={12} className="inline mr-1" />
                Retain
              </button>
              <button
                onClick={() => handleVote("evict")}
                disabled={voting}
                className="h-9 rounded-xl text-[12px] font-semibold border border-[#e74c3c]/30 text-[#e74c3c] hover:bg-[#e74c3c]/10 transition-all"
              >
                <XCircle size={12} className="inline mr-1" />
                Evict
              </button>
            </div>
          )}
          {endsAt && (
            <div className="flex items-center gap-1 text-[10px] text-[#6b7a87]">
              <Clock size={10} />
              Voting ends {formatTimeUntil(endsAt)}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#6b7a87]">
        <span>Case #{violation.id.slice(-6).toUpperCase()}</span>
        <span>{formatRelativeTime((violation.createdAt as any)?.toDate?.() ?? new Date())}</span>
      </div>
    </motion.div>
  );
}

export default function ViolationsPage() {
  const { member } = useAuthStore();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | ViolationStatus>("all");

  useEffect(() => {
    setLoading(true);
    const url = filter === "all" ? "/api/violations" : `/api/violations?status=${filter}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setViolations(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (!member) return null;

  const FILTERS: Array<"all" | ViolationStatus> = ["all", "voting", "resolved_retain", "resolved_evict"];

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">House Review</h1>
        <p className="text-[12px] text-[#6b7a87]">Community conduct enforcement</p>
      </motion.div>

      <div className="card-hom p-3 flex items-start gap-2">
        <AlertTriangle size={14} className="text-[#c9a84c] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#a8b4c0] leading-relaxed">
          The community governs itself. Members vote to retain or evict those who violate the House Code.
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 h-7 rounded-full text-[11px] font-medium capitalize transition-all duration-200
              ${filter === f ? "bg-[#c9a84c] text-[#0a0a0a]" : "bg-[#1c1c1c] text-[#6b7a87]"}`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : violations.length === 0 ? (
        <div className="card-hom p-10 text-center">
          <Shield size={28} className="text-[#27ae60] mx-auto mb-3" />
          <p className="text-[13px] text-[#6b7a87]">No cases found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((v) => (
            <ViolationCard key={v.id} violation={v} memberId={member.memberId} />
          ))}
        </div>
      )}
    </div>
  );
}
