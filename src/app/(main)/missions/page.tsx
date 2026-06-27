"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { formatTimeUntil, getQuestTypeLabel } from "@/lib/utils";
import type { Quest } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sword, Clock, Users, Zap, Shield, Star, ExternalLink, CheckCircle2, Upload } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  social: "#4a90d9",
  partner: "#c9a84c",
  community: "#27ae60",
  governance: "#9b59b6",
  creative: "#e74c3c",
};

function QuestCard({ quest, memberId }: { quest: Quest; memberId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if already submitted
    fetch(`/api/quests/${quest.id}/submit?check=${memberId}`)
      .then(r => r.json())
      .then(d => { if (d.data?.status) setSubmitted(true); })
      .catch(() => {});
  }, [quest.id, memberId]);

  const handleSubmit = async () => {
    if (!proofText && !proofUrl) {
      toast.error("Please provide proof");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/quests/${quest.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, proofText, proofUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSubmitted(true);
      setShowSubmit(false);
      toast.success("Proof submitted — pending review");
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const endsAt = (quest.endsAt as any)?.toDate?.() ?? new Date();
  const typeColor = TYPE_COLORS[quest.type] ?? "#a8b4c0";
  const spotsLeft = quest.maxParticipants
    ? quest.maxParticipants - quest.currentParticipants
    : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hom p-4 space-y-3 relative overflow-hidden"
      >
        {quest.imageUrl && (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url(${quest.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                style={{ background: `${typeColor}15`, color: typeColor }}
              >
                {getQuestTypeLabel(quest.type)}
              </span>
              {quest.partnerName && (
                <span className="text-[10px] text-[#6b7a87]">× {quest.partnerName}</span>
              )}
            </div>
            <h3 className="text-[14px] font-semibold text-white leading-tight">{quest.title}</h3>
            <p className="text-[11px] text-[#6b7a87] mt-0.5 line-clamp-2">{quest.description}</p>
          </div>

          {/* Reward badge */}
          <div
            className="shrink-0 flex flex-col items-center px-3 py-2 rounded-xl"
            style={{ background: `${typeColor}10`, border: `1px solid ${typeColor}20` }}
          >
            <span className="text-[12px] font-bold" style={{ color: typeColor }}>
              +{quest.rewardXp}
            </span>
            <span className="text-[9px] text-[#6b7a87]">XP</span>
            {quest.rewardReputation > 0 && (
              <>
                <span className="text-[12px] font-bold text-[#c9a84c]">+{quest.rewardReputation}</span>
                <span className="text-[9px] text-[#6b7a87]">REP</span>
              </>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[10px] text-[#6b7a87]">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            {formatTimeUntil(endsAt)}
          </div>
          <div className="flex items-center gap-1">
            <Users size={10} />
            {quest.currentParticipants} joined
            {spotsLeft !== null && ` · ${spotsLeft} left`}
          </div>
          {quest.rewardDescription && (
            <div className="flex items-center gap-1 text-[#c9a84c]">
              <Star size={10} />
              {quest.rewardDescription}
            </div>
          )}
        </div>

        {/* Action */}
        <div className="flex items-center gap-2">
          {quest.externalUrl && (
            <a
              href={quest.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-[#4a90d9] hover:underline"
            >
              <ExternalLink size={11} />
              Open Link
            </a>
          )}
          <div className="flex-1" />
          {submitted ? (
            <div className="flex items-center gap-1.5 text-[11px] text-[#27ae60]">
              <CheckCircle2 size={14} />
              Submitted
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => (quest.requiresProof ? setShowSubmit(true) : handleSubmit())}
              className="h-8 text-[11px] rounded-xl"
              style={{
                background: `linear-gradient(135deg, ${typeColor}CC, ${typeColor})`,
                color: "#fff",
                border: "none",
              }}
            >
              {quest.requiresProof ? <><Upload size={12} className="mr-1" /> Submit Proof</> : "Complete"}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Submit proof dialog */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="bg-[#111] border-[#c9a84c]/20 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Submit Proof</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-[12px] text-[#a8b4c0]">
              {quest.proofInstructions ?? "Provide evidence of completion"}
            </p>
            <Input
              placeholder="Proof URL (tweet, screenshot link...)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="bg-[#161616] border-white/10 text-white text-[13px]"
            />
            <Textarea
              placeholder="Description of what you did..."
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              className="bg-[#161616] border-white/10 text-white text-[13px] resize-none"
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting || (!proofText && !proofUrl)}
              className="w-full h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MissionsPage() {
  const { member } = useAuthStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/quests?status=active")
      .then(r => r.json())
      .then(d => setQuests(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!member) return null;

  const FILTERS = ["all", "social", "partner", "community", "governance", "creative"];
  const filtered = filter === "all" ? quests : quests.filter(q => q.type === filter);

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">Missions</h1>
        <p className="text-[12px] text-[#6b7a87]">Complete quests, earn rewards & reputation</p>
      </motion.div>

      {/* Filter strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
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

      {/* Quest list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card-hom p-10 text-center">
          <Sword size={28} className="text-[#6b7a87] mx-auto mb-3" />
          <p className="text-[13px] text-[#6b7a87]">No missions available right now</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestCard key={q.id} quest={q} memberId={member.memberId} />
          ))}
        </div>
      )}
    </div>
  );
}
