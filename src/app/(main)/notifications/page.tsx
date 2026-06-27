"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { formatRelativeTime } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Bell, Scroll, Sword, Coins, Megaphone, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, Crown, Calendar
} from "lucide-react";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string; label: string }> = {
  new_vote: { icon: Scroll, color: "#4a90d9", label: "New Vote" },
  new_quest: { icon: Sword, color: "#c9a84c", label: "New Quest" },
  reward_available: { icon: Coins, color: "#27ae60", label: "Reward Available" },
  governance_update: { icon: Scroll, color: "#9b59b6", label: "Governance" },
  house_announcement: { icon: Megaphone, color: "#c9a84c", label: "Announcement" },
  violation_opened: { icon: AlertTriangle, color: "#e74c3c", label: "Case Opened" },
  quest_approved: { icon: CheckCircle, color: "#27ae60", label: "Quest Approved" },
  quest_rejected: { icon: XCircle, color: "#e74c3c", label: "Quest Rejected" },
  reputation_change: { icon: TrendingUp, color: "#c9a84c", label: "Reputation" },
  tier_upgrade: { icon: Crown, color: "#c9a84c", label: "Tier Upgrade" },
  event_reminder: { icon: Calendar, color: "#4a90d9", label: "Event" },
};

function NotificationItem({ notif, onRead }: { notif: AppNotification; onRead: (id: string) => void }) {
  const cfg = TYPE_CONFIG[notif.type] ?? { icon: Bell, color: "#a8b4c0", label: "Notification" };
  const Icon = cfg.icon;

  const handleClick = () => {
    if (!notif.read) onRead(notif.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 ${
        notif.read ? "card-hom" : "card-hom-elevated border border-[#c9a84c]/15"
      }`}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${cfg.color}15` }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`text-[13px] font-semibold leading-tight ${notif.read ? "text-[#a8b4c0]" : "text-white"}`}>
              {notif.title}
            </p>
            <p className="text-[11px] text-[#6b7a87] mt-0.5 leading-relaxed">{notif.body}</p>
          </div>
          {!notif.read && (
            <div className="w-2 h-2 rounded-full bg-[#c9a84c] shrink-0 mt-1" />
          )}
        </div>
        <p className="text-[10px] text-[#4a5568] mt-1">
          {formatRelativeTime((notif.createdAt as any)?.toDate?.() ?? new Date())}
        </p>
      </div>
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { member } = useAuthStore();
  const { notifications, unreadCount, isLoading, setNotifications, markRead, markAllRead, setLoading } =
    useNotificationStore();

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    fetch(`/api/notifications?memberId=${member.memberId}`)
      .then(r => r.json())
      .then(d => setNotifications(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [member?.memberId]);

  const handleMarkRead = async (id: string) => {
    markRead(id);
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    }).catch(() => {});
  };

  const handleMarkAllRead = async () => {
    if (!member) return;
    markAllRead();
    fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.memberId }),
    }).catch(() => {});
  };

  if (!member) return null;

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-white">Notifications</h1>
          <p className="text-[12px] text-[#6b7a87]">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            className="h-7 text-[11px] border-white/10 text-[#a8b4c0] hover:text-white hover:border-white/20"
          >
            Mark all read
          </Button>
        )}
      </motion.div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card-hom p-12 flex flex-col items-center gap-3">
          <Bell size={32} className="text-[#6b7a87]" />
          <p className="text-[13px] text-[#6b7a87]">No notifications yet</p>
          <p className="text-[11px] text-[#4a5568] text-center">
            You'll be notified about new votes, quests, and House announcements.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notif={n} onRead={handleMarkRead} />
          ))}
        </div>
      )}
    </div>
  );
}
