"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { formatTimeUntil, formatRelativeTime, getProposalStatusColor } from "@/lib/utils";
import type { Proposal, ProposalType } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scroll, Plus, Clock, Users, ChevronRight, CheckCircle, XCircle, MinusCircle } from "lucide-react";

const TYPE_LABELS: Record<ProposalType, string> = {
  community_decision: "Community",
  member_review: "Member Review",
  rule_update: "Rule Update",
  partner_approval: "Partner",
};

const TYPE_COLORS: Record<ProposalType, string> = {
  community_decision: "#4a90d9",
  member_review: "#e74c3c",
  rule_update: "#c9a84c",
  partner_approval: "#27ae60",
};

function ProposalCard({ proposal, memberId }: { proposal: Proposal; memberId: string }) {
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const isActive = proposal.status === "active";
  const endsAt = (proposal.endsAt as any)?.toDate?.() ?? new Date();
  const timeLeft = formatTimeUntil(endsAt);
  const total = proposal.voteCount.total || 1;
  const yesRatio = (proposal.voteCount.yes / total) * 100;
  const noRatio = (proposal.voteCount.no / total) * 100;

  useEffect(() => {
    // Check if member already voted
    fetch(`/api/proposals/${proposal.id}/vote?check=${memberId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.choice) setVoted(d.data.choice);
      })
      .catch(() => {});
  }, [proposal.id, memberId]);

  const handleVote = async (choice: "yes" | "no" | "abstain") => {
    if (!isActive || voted) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, choice }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setVoted(choice);
      toast.success(`Voted ${choice} — +10 reputation`);
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
              style={{
                background: `${TYPE_COLORS[proposal.type]}15`,
                color: TYPE_COLORS[proposal.type],
              }}
            >
              {TYPE_LABELS[proposal.type]}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
              style={{
                background: `${getProposalStatusColor(proposal.status)}15`,
                color: getProposalStatusColor(proposal.status),
              }}
            >
              {proposal.status}
            </span>
          </div>
          <h3 className="text-[14px] font-semibold text-white leading-tight line-clamp-2">
            {proposal.title}
          </h3>
          <p className="text-[11px] text-[#6b7a87] mt-0.5 line-clamp-2">{proposal.description}</p>
        </div>
      </div>

      {/* Vote bar */}
      {proposal.voteCount.total > 0 && (
        <div className="space-y-1">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[#1c1c1c]">
            <div className="h-full bg-[#27ae60] transition-all" style={{ width: `${yesRatio}%` }} />
            <div className="h-full bg-[#e74c3c] transition-all" style={{ width: `${noRatio}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#6b7a87]">
            <span>{proposal.voteCount.yes} Yes · {proposal.voteCount.no} No · {proposal.voteCount.abstain} Abstain</span>
            <span>{proposal.voteCount.total} total</span>
          </div>
        </div>
      )}

      {/* Vote actions */}
      {isActive && (
        <div className="space-y-2">
          {voted ? (
            <div className="flex items-center gap-2 text-[12px] text-[#6b7a87]">
              <CheckCircle size={14} className="text-[#27ae60]" />
              You voted <span className="font-semibold text-white capitalize">{voted}</span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "no", "abstain"] as const).map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleVote(choice)}
                  disabled={voting}
                  className={`h-9 rounded-xl text-[12px] font-semibold capitalize border transition-all duration-200
                    ${choice === "yes" ? "border-[#27ae60]/30 text-[#27ae60] hover:bg-[#27ae60]/10"
                    : choice === "no" ? "border-[#e74c3c]/30 text-[#e74c3c] hover:bg-[#e74c3c]/10"
                    : "border-white/10 text-[#a8b4c0] hover:bg-white/5"
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-[#6b7a87]">
            <Clock size={10} />
            {timeLeft}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-[10px] text-[#6b7a87]">
        <span>By {proposal.authorDisplayName}</span>
        <span>{formatRelativeTime((proposal.createdAt as any)?.toDate?.() ?? new Date())}</span>
      </div>
    </motion.div>
  );
}

export default function GovernancePage() {
  const { member } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "passed" | "rejected">("active");

  useEffect(() => {
    setLoading(true);
    const url = filter === "all" ? "/api/proposals" : `/api/proposals?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setProposals(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (!member) return null;

  const FILTERS = ["active", "passed", "rejected", "all"] as const;

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-[20px] font-bold text-white">Senate</h1>
          <p className="text-[12px] text-[#6b7a87]">Shape the House's future</p>
        </div>
        {(member.isAdmin || member.isModerator) && (
          <Link href="/admin/governance">
            <Button size="sm" className="h-8 text-[11px] gold-gradient text-[#0a0a0a] border-0 rounded-xl">
              <Plus size={13} className="mr-1" />
              Propose
            </Button>
          </Link>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Your Votes", value: member.governanceParticipationCount },
          { label: "Active", value: proposals.filter(p => p.status === "active").length },
          { label: "Quorum", value: "10" },
        ].map(({ label, value }) => (
          <div key={label} className="card-hom p-3 text-center">
            <p className="text-[18px] font-bold text-white">{value}</p>
            <p className="text-[10px] text-[#6b7a87]">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 h-7 rounded-full text-[11px] font-medium capitalize transition-all duration-200
              ${filter === f
                ? "bg-[#c9a84c] text-[#0a0a0a]"
                : "bg-[#1c1c1c] text-[#6b7a87] hover:text-[#a8b4c0]"
              }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Proposals */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div className="card-hom p-10 text-center">
          <Scroll size={28} className="text-[#6b7a87] mx-auto mb-3" />
          <p className="text-[13px] text-[#6b7a87]">No proposals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} memberId={member.memberId} />
          ))}
        </div>
      )}
    </div>
  );
}
