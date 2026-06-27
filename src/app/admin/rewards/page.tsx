"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { RewardType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Plus } from "lucide-react";

const REWARD_TYPES: RewardType[] = ["airdrop", "nft_drop", "whitelist", "community_token", "exclusive_access", "merch"];

export default function AdminRewardsPage() {
  const { member } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "airdrop" as RewardType,
    partnerName: "",
    totalSlots: "",
    claimDeadline: "",
    externalClaimUrl: "",
    minReputation: "",
    minXp: "",
  });

  const handleCreate = async () => {
    if (!form.title || !member) return;
    setCreating(true);
    try {
      const requirements = [];
      if (form.minReputation) requirements.push({
        type: "min_reputation",
        value: Number(form.minReputation),
        description: `Minimum ${form.minReputation} reputation`,
      });
      if (form.minXp) requirements.push({
        type: "min_xp",
        value: Number(form.minXp),
        description: `Minimum ${form.minXp} XP`,
      });

      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalSlots: form.totalSlots ? Number(form.totalSlots) : undefined,
          eligibilityRequirements: requirements,
          createdBy: member.memberId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Reward created!");
      setForm({ title: "", description: "", type: "airdrop", partnerName: "", totalSlots: "", claimDeadline: "", externalClaimUrl: "", minReputation: "", minXp: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create reward");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[18px] font-bold text-white">Add Reward</h1>
        <p className="text-[11px] text-[#6b7a87]">Create a reward for eligible members</p>
      </motion.div>

      <div className="card-hom p-4 space-y-3">
        <Input placeholder="Reward title" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Textarea placeholder="Description..." value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={2} />
        <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as RewardType }))}>
          <SelectTrigger className="bg-[#161616] border-white/10 text-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161616] border-white/10">
            {REWARD_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-white capitalize">{t.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Partner name" value={form.partnerName}
          onChange={e => setForm(f => ({ ...f, partnerName: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Total slots" type="number" value={form.totalSlots}
            onChange={e => setForm(f => ({ ...f, totalSlots: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
          <Input placeholder="Claim deadline" value={form.claimDeadline}
            onChange={e => setForm(f => ({ ...f, claimDeadline: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
        </div>
        <p className="text-[10px] text-[#6b7a87] uppercase tracking-widest">Eligibility Requirements</p>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Min Reputation" type="number" value={form.minReputation}
            onChange={e => setForm(f => ({ ...f, minReputation: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
          <Input placeholder="Min XP" type="number" value={form.minXp}
            onChange={e => setForm(f => ({ ...f, minXp: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
        </div>
        <Input placeholder="External claim URL (optional)" value={form.externalClaimUrl}
          onChange={e => setForm(f => ({ ...f, externalClaimUrl: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Button onClick={handleCreate} disabled={creating || !form.title}
          className="w-full h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold">
          {creating ? "Creating..." : <><Coins size={14} className="mr-2" />Create Reward</>}
        </Button>
      </div>
    </div>
  );
}
