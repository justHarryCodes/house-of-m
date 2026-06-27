"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { Quest, QuestType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Sword, Clock, Users, CheckCircle, XCircle, Eye } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const QUEST_TYPES: QuestType[] = ["social", "partner", "community", "governance", "creative"];

interface Submission {
  id: string;
  questId: string;
  memberId: string;
  telegramId: number;
  proofUrl?: string;
  proofText?: string;
  status: string;
  submittedAt: any;
}

export default function AdminQuestsPage() {
  const { member } = useAuthStore();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    type: "social" as QuestType,
    rewardXp: "50",
    rewardReputation: "25",
    rewardDescription: "",
    partnerName: "",
    requiresProof: true,
    proofInstructions: "",
    maxParticipants: "",
    endsAt: "",
    externalUrl: "",
    tags: "",
  });

  useEffect(() => {
    fetch("/api/quests?status=active")
      .then(r => r.json())
      .then(d => setQuests(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadSubmissions = (questId: string) => {
    fetch(`/api/quests/${questId}/submissions`)
      .then(r => r.json())
      .then(d => setSubmissions(d.data ?? []))
      .catch(console.error);
  };

  const handleCreate = async () => {
    if (!form.title || !member) return;
    setCreating(true);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rewardXp: Number(form.rewardXp),
          rewardReputation: Number(form.rewardReputation),
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
          createdBy: member.memberId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Quest created!");
      setShowCreate(false);
      // Refresh
      const d = await fetch("/api/quests?status=active").then(r => r.json());
      setQuests(d.data ?? []);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create quest");
    } finally {
      setCreating(false);
    }
  };

  const handleReview = async (submissionId: string, action: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/quests/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action, reviewedBy: member?.memberId }),
      });
      if (!res.ok) throw new Error();
      setSubmissions(s => s.map(sub =>
        sub.id === submissionId ? { ...sub, status: action } : sub
      ));
      toast.success(`Submission ${action}`);
    } catch {
      toast.error("Review failed");
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-bold text-white">Quests</h1>
          <p className="text-[11px] text-[#6b7a87]">{quests.length} active</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowCreate(true)}
          className="h-8 text-[11px] gold-gradient text-[#0a0a0a] border-0 rounded-xl"
        >
          <Plus size={13} className="mr-1" />
          Create Quest
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-shimmer rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {quests.map(q => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-hom p-3.5 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white truncate">{q.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-[#c9a84c]">+{q.rewardXp} XP</span>
                  <span className="text-[10px] text-[#6b7a87]">{q.currentParticipants} joined</span>
                  <span className="text-[10px] text-[#6b7a87] capitalize">{q.type}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setSelectedQuest(q); loadSubmissions(q.id); }}
                className="h-7 text-[10px] border-white/10 text-[#a8b4c0] rounded-xl"
              >
                <Eye size={11} className="mr-1" />
                Review
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Quest Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#111] border-[#c9a84c]/20 text-white max-w-sm max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Create Quest</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px]" />
            <Textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={2} />
            <Textarea placeholder="Instructions for members" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={2} />
            <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as QuestType }))}>
              <SelectTrigger className="bg-[#161616] border-white/10 text-white text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-white/10">
                {QUEST_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="text-white capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="XP Reward" type="number" value={form.rewardXp} onChange={e => setForm(f => ({ ...f, rewardXp: e.target.value }))}
                className="bg-[#161616] border-white/10 text-white text-[13px]" />
              <Input placeholder="Rep Reward" type="number" value={form.rewardReputation} onChange={e => setForm(f => ({ ...f, rewardReputation: e.target.value }))}
                className="bg-[#161616] border-white/10 text-white text-[13px]" />
            </div>
            <Input placeholder="Reward description (e.g. WL spot)" value={form.rewardDescription} onChange={e => setForm(f => ({ ...f, rewardDescription: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px]" />
            <Input placeholder="Partner name (optional)" value={form.partnerName} onChange={e => setForm(f => ({ ...f, partnerName: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px]" />
            <Input placeholder="External URL (optional)" value={form.externalUrl} onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px]" />
            <Input placeholder="End date (YYYY-MM-DD)" value={form.endsAt} onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
              className="bg-[#161616] border-white/10 text-white text-[13px]" />
            <Button onClick={handleCreate} disabled={creating || !form.title}
              className="w-full h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold">
              {creating ? "Creating..." : "Create Quest"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Submissions Dialog */}
      <Dialog open={!!selectedQuest} onOpenChange={() => { setSelectedQuest(null); setSubmissions([]); }}>
        <DialogContent className="bg-[#111] border-[#c9a84c]/20 text-white max-w-sm max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[14px]">{selectedQuest?.title} — Submissions</DialogTitle>
          </DialogHeader>
          {submissions.length === 0 ? (
            <p className="text-[12px] text-[#6b7a87] text-center py-6">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => (
                <div key={sub.id} className="card-hom p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-white">{sub.memberId}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize
                      ${sub.status === "approved" ? "bg-[#27ae60]/15 text-[#27ae60]"
                      : sub.status === "rejected" ? "bg-[#e74c3c]/15 text-[#e74c3c]"
                      : "bg-[#c9a84c]/15 text-[#c9a84c]"}`}>
                      {sub.status}
                    </span>
                  </div>
                  {sub.proofText && <p className="text-[11px] text-[#a8b4c0]">{sub.proofText}</p>}
                  {sub.proofUrl && (
                    <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer"
                      className="text-[11px] text-[#4a90d9] hover:underline truncate block">
                      {sub.proofUrl}
                    </a>
                  )}
                  {sub.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleReview(sub.id, "approved")}
                        className="flex-1 h-7 text-[10px] bg-[#27ae60]/20 text-[#27ae60] border-0 rounded-lg hover:bg-[#27ae60]/30">
                        <CheckCircle size={11} className="mr-1" />Approve
                      </Button>
                      <Button size="sm" onClick={() => handleReview(sub.id, "rejected")}
                        className="flex-1 h-7 text-[10px] bg-[#e74c3c]/20 text-[#e74c3c] border-0 rounded-lg hover:bg-[#e74c3c]/30">
                        <XCircle size={11} className="mr-1" />Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
