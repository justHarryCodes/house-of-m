"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { formatRelativeTime, formatTimeUntil } from "@/lib/utils";
import type { HouseEvent, EventType } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar, Mic2, Users, Clock, ExternalLink, CheckCircle2, Radio } from "lucide-react";

const TYPE_CONFIG: Record<EventType, { label: string; icon: React.ElementType; color: string }> = {
  x_space: { label: "X Space", icon: Mic2, color: "#1DA1F2" },
  community: { label: "Community", icon: Users, color: "#c9a84c" },
  partner: { label: "Partner", icon: Calendar, color: "#27ae60" },
  governance: { label: "Governance", icon: Users, color: "#9b59b6" },
  ama: { label: "AMA", icon: Mic2, color: "#e74c3c" },
};

function EventCard({ event, memberId }: { event: HouseEvent; memberId: string }) {
  const [rsvped, setRsvped] = useState(false);
  const [rsvping, setRsvping] = useState(false);
  const cfg = TYPE_CONFIG[event.type];
  const Icon = cfg.icon;
  const startsAt = (event.startsAt as any)?.toDate?.() ?? new Date();
  const isLive = event.status === "live";
  const isPast = event.status === "ended";

  const handleRSVP = async () => {
    if (rsvped) return;
    setRsvping(true);
    try {
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setRsvped(true);
      toast.success("RSVP confirmed!");
    } catch (err: any) {
      if (err.message === "Already RSVP'd") {
        setRsvped(true);
      } else {
        toast.error("RSVP failed");
      }
    } finally {
      setRsvping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hom overflow-hidden"
      style={{ border: isLive ? `1px solid ${cfg.color}40` : undefined }}
    >
      {/* Image */}
      {event.imageUrl ? (
        <div className="h-24 relative">
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
          {isLive && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-[#e74c3c] text-white text-[10px] font-bold">
              <Radio size={10} className="animate-pulse" />
              LIVE
            </div>
          )}
        </div>
      ) : isLive ? (
        <div className="h-2 w-full" style={{ background: cfg.color }} />
      ) : null}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div
            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
            style={{ background: `${cfg.color}15` }}
          >
            <Icon size={16} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide"
                style={{ background: `${cfg.color}15`, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <h3 className="text-[14px] font-semibold text-white leading-tight">{event.title}</h3>
            <p className="text-[11px] text-[#6b7a87]">by {event.hostDisplayName}</p>
          </div>
        </div>

        {event.description && (
          <p className="text-[12px] text-[#a8b4c0] line-clamp-2">{event.description}</p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-[10px] text-[#6b7a87]">
          <div className="flex items-center gap-1">
            <Clock size={10} />
            {isLive ? "Live now" : isPast ? "Ended" : formatTimeUntil(startsAt)}
          </div>
          <div className="flex items-center gap-1">
            <Users size={10} />
            {event.rsvpCount} RSVP
          </div>
          {event.rewardXp && (
            <div className="text-[#c9a84c]">+{event.rewardXp} XP for attending</div>
          )}
        </div>

        {/* Actions */}
        {!isPast && (
          <div className="flex items-center gap-2">
            {rsvped ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[#27ae60]">
                <CheckCircle2 size={13} />
                RSVP'd
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleRSVP}
                disabled={rsvping}
                className="h-8 text-[11px] rounded-xl border-0"
                style={{
                  background: isLive
                    ? `linear-gradient(135deg, #e74c3cCC, #e74c3c)`
                    : `linear-gradient(135deg, ${cfg.color}CC, ${cfg.color})`,
                  color: "#fff",
                }}
              >
                {rsvping ? "..." : isLive ? "Join Live" : "RSVP"}
              </Button>
            )}
            {event.externalUrl && (
              <a
                href={event.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-[#6b7a87] hover:text-white"
              >
                <ExternalLink size={12} />
                Open
              </a>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function EventsPage() {
  const { member } = useAuthStore();
  const [events, setEvents] = useState<HouseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then(r => r.json())
      .then(d => setEvents(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!member) return null;

  const liveEvents = events.filter(e => e.status === "live");
  const upcomingEvents = events.filter(e => e.status === "upcoming");

  return (
    <div className="px-4 py-5 space-y-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">Events</h1>
        <p className="text-[12px] text-[#6b7a87]">Spaces, AMAs & community gatherings</p>
      </motion.div>

      {/* Live now */}
      {liveEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#e74c3c] animate-pulse" />
            <p className="text-[10px] tracking-[0.3em] text-[#e74c3c] uppercase font-semibold">
              Live Now
            </p>
          </div>
          {liveEvents.map(e => <EventCard key={e.id} event={e} memberId={member.memberId} />)}
        </div>
      )}

      {/* Upcoming */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : upcomingEvents.length === 0 && liveEvents.length === 0 ? (
        <div className="card-hom p-10 text-center">
          <Calendar size={28} className="text-[#6b7a87] mx-auto mb-3" />
          <p className="text-[13px] text-[#6b7a87]">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingEvents.length > 0 && (
            <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Upcoming</p>
          )}
          {upcomingEvents.map(e => <EventCard key={e.id} event={e} memberId={member.memberId} />)}
        </div>
      )}
    </div>
  );
}
