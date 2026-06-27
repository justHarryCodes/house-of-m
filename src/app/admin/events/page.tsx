"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import type { EventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

const EVENT_TYPES: EventType[] = ["x_space", "community", "partner", "governance", "ama"];
const TYPE_LABELS: Record<EventType, string> = {
  x_space: "X Space",
  community: "Community",
  partner: "Partner",
  governance: "Governance",
  ama: "AMA",
};

export default function AdminEventsPage() {
  const { member } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "x_space" as EventType,
    startsAt: "",
    externalUrl: "",
    maxAttendees: "",
    rewardXp: "25",
    tags: "",
  });

  const handleCreate = async () => {
    if (!form.title || !form.startsAt || !member) return;
    setCreating(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxAttendees: form.maxAttendees ? Number(form.maxAttendees) : undefined,
          rewardXp: Number(form.rewardXp),
          tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
          hostId: member.memberId,
          hostDisplayName: member.displayName,
          hostAvatarUrl: member.photoUrl,
          createdBy: member.memberId,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success("Event created!");
      setForm({ title: "", description: "", type: "x_space", startsAt: "", externalUrl: "", maxAttendees: "", rewardXp: "25", tags: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create event");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[18px] font-bold text-white">Schedule Event</h1>
        <p className="text-[11px] text-[#6b7a87]">Add a Space, AMA, or community event</p>
      </motion.div>

      <div className="card-hom p-4 space-y-3">
        <Input placeholder="Event title" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Textarea placeholder="Description..." value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px] resize-none" rows={2} />
        <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as EventType }))}>
          <SelectTrigger className="bg-[#161616] border-white/10 text-white text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#161616] border-white/10">
            {EVENT_TYPES.map(t => (
              <SelectItem key={t} value={t} className="text-white">{TYPE_LABELS[t]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Start datetime (2024-12-25T20:00)" value={form.startsAt}
          onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <Input placeholder="External URL (Space link, etc.)" value={form.externalUrl}
          onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
          className="bg-[#161616] border-white/10 text-white text-[13px]" />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Max attendees" type="number" value={form.maxAttendees}
            onChange={e => setForm(f => ({ ...f, maxAttendees: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
          <Input placeholder="XP reward" type="number" value={form.rewardXp}
            onChange={e => setForm(f => ({ ...f, rewardXp: e.target.value }))}
            className="bg-[#161616] border-white/10 text-white text-[13px]" />
        </div>
        <Button onClick={handleCreate} disabled={creating || !form.title || !form.startsAt}
          className="w-full h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold">
          {creating ? "Creating..." : <><Calendar size={14} className="mr-2" />Schedule Event</>}
        </Button>
      </div>
    </div>
  );
}
