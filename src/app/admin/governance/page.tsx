"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { ProposalType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scroll } from "lucide-react";

const PROPOSAL_TYPES: ProposalType[] = [
  "community_decision", "member_review", "rule_update", "partner_approval"
];

const TYPE_LABELS: Record<ProposalType, string> = {
  community_decision: "Community Decision",
  member_review: "Member Review",
  rule_update: "Rule Update",
  partner_approval: "Partner Approval",
};

export default function AdminGovernancePage() {
  const { member } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "community_decision" as ProposalType,
    endsAt: "",
    linkedMemberId: "",
    tags: "",
  });

  const handleCreate = async () => {
    if (!form.title || !form.description || !member) return;
    setCreating(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          authorId: member.memberId,
          authorTelegramId: member.telegramId,
          authorDisplayName: member.displayName,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Proposal created and live!");
      setForm({ title: "", description: "", type: "community_decision", endsAt: "", linkedMemberId: "", tags: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create proposal");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[18px] font-bold text-white">Create Proposal</h1>
        <p className="text-[11px] text-[#6b7a87]">Submit a governance proposal for community vote</p>
      </motion.div>

      <div className="card-hom p-4 space-y-3">
        <Input
          placeholder="Proposal title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]"
        />
        <Textarea
          placeholder="Detailed description and context..."
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px] resize-none"
          rows={4}
        />
        <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as ProposalType }))}>
          <SelectTrigger className="bg-[#161616] border-white/10 text-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161616] border-white/10">
            {PROPOSAL_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-white">{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.type === "member_review" && (
          <Input
            placeholder="Member ID being reviewed (M-0001)"
            value={form.linkedMemberId}
            onChange={e => setForm(f => ({ ...f, linkedMemberId: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]"
          />
        )}
        <Input
          placeholder="End date (YYYY-MM-DD) — default 7 days"
          value={form.endsAt}
          onChange={e => setForm(f => ({ ...f, endsAt: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]"
        />
        <Input
          placeholder="Tags (comma-separated)"
          value={form.tags}
          onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]"
        />
        <Button
          onClick={handleCreate}
          disabled={creating || !form.title || !form.description}
          className="w-full h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold"
        >
          {creating ? "Creating..." : (
            <><Scroll size={14} className="mr-2" />Submit Proposal</>
          )}
        </Button>
      </div>

      <div className="card-hom p-3">
        <p className="text-[11px] text-[#6b7a87] leading-relaxed">
          Proposals go live immediately and run until the end date. Members earn +10 reputation for participating in votes.
          Proposals require a minimum of 10 votes to be valid.
        </p>
      </div>
    </div>
  );
}
