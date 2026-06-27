import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { MemberTier } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4) {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatRelativeTime(date: Date | number): string {
  const now = Date.now();
  const ts = typeof date === "number" ? date : date.getTime();
  const diff = now - ts;

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function formatTimeUntil(date: Date | number): string {
  const now = Date.now();
  const ts = typeof date === "number" ? date : date.getTime();
  const diff = ts - now;

  if (diff <= 0) return "Ended";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m left`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h left`;
  return `${Math.floor(diff / 86_400_000)}d left`;
}

export function getTierColor(tier: MemberTier): string {
  const colors: Record<MemberTier, string> = {
    citizen: "#a8b4c0",
    patrician: "#c9a84c",
    senator: "#4a90d9",
    consul: "#9b59b6",
    emperor: "#e74c3c",
  };
  return colors[tier];
}

export function getTierIcon(tier: MemberTier): string {
  const icons: Record<MemberTier, string> = {
    citizen: "◆",
    patrician: "◈",
    senator: "⬡",
    consul: "⬟",
    emperor: "⬠",
  };
  return icons[tier];
}

export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function xpForNextLevel(currentXp: number): number {
  const level = calculateLevel(currentXp);
  return level * level * 100;
}

export function xpProgress(currentXp: number): number {
  const level = calculateLevel(currentXp);
  const prevLevelXp = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  return ((currentXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100;
}

export function getProposalStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "#27ae60",
    passed: "#4a90d9",
    rejected: "#e74c3c",
    draft: "#a8b4c0",
    cancelled: "#6b7a87",
  };
  return map[status] ?? "#a8b4c0";
}

export function getQuestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    social: "Social",
    partner: "Partner",
    community: "Community",
    governance: "Governance",
    creative: "Creative",
  };
  return labels[type] ?? type;
}
