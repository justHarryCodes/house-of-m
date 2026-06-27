"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { ViolationType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";

const VIOLATION_TYPES: ViolationType[] = [
  "spam", "harassment", "misinformation", "scam", "rule_violation", "impersonation", "other"
];

export default function AdminViolationsPage() {
  const { member } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    accusedMemberId: "",
    accusedDisplayName: "",
    type: "spam" as ViolationType,
    reason: "",
    evidence: "",
    screenshotUrls: "",
  });

  const handleCreate = async () => {
    if (!form.accusedMemberId || !form.reason || !member) return;
    setCreating(true);
    try {
      const res = await fetch("/api/violations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          screenshotUrls: form.screenshotUrls ? form.screenshotUrls.split(",").map(s => s.trim()) : [],
          reportedBy: member.memberId,
          accusedTelegramId: 0,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Case opened — community voting begins");
      setForm({ accusedMemberId: "", accusedDisplayName: "", type: "spam", reason: "", evidence: "", screenshotUrls: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to open case");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[18px] font-bold text-white">Open Case</h1>
        <p className="text-[11px] text-[#6b7a87]">File a House Review case against a member</p>
      </motion.div>

      <div className="card-hom p-3 flex items-start gap-2">
        <AlertTriangle size={13} className="text-[#e74c3c] shrink-0 mt-0.5" />
        <p className="text-[11px] text-[#a8b4c0]">
          Cases go to community vote for 72 hours. False reports may result in reputation penalties.
        </p>
      </div>

      <div className="card-hom p-4 space-y-3">
        <Input placeholder="Accused Member ID (M-0001)" value={form.accusedMemberId}
          onChange={e => setForm(f => ({ ...f, accusedMemberId: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Input placeholder="Accused Display Name" value={form.accusedDisplayName}
          onChange={e => setForm(f => ({ ...f, accusedDisplayName: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as ViolationType }))}>
          <SelectTrigger className="bg-[#161616] border-white/10 text-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161616] border-white/10">
            {VIOLATION_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-white capitalize">{t.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea placeholder="Reason for the case..." value={form.reason}
          onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={2} />
        <Textarea placeholder="Evidence (links, descriptions...)" value={form.evidence}
          onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={3} />
        <Input placeholder="Screenshot URLs (comma-separated)" value={form.screenshotUrls}
          onChange={e => setForm(f => ({ ...f, screenshotUrls: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Button onClick={handleCreate} disabled={creating || !form.accusedMemberId || !form.reason}
          className="w-full h-10 bg-[#e74c3c] hover:bg-[#c0392b] text-white border-0 rounded-xl font-semibold">
          {creating ? "Opening case..." : <><AlertTriangle size={14} className="mr-2" />Open Case</>}
        </Button>
      </div>
    </div>
  );
}
