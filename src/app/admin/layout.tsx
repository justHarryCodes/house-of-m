"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Sword, Scroll, AlertTriangle,
  Coins, Calendar, ChevronLeft, Shield
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/members", icon: Users, label: "Members" },
  { href: "/admin/quests", icon: Sword, label: "Quests" },
  { href: "/admin/governance", icon: Scroll, label: "Governance" },
  { href: "/admin/violations", icon: AlertTriangle, label: "Violations" },
  { href: "/admin/rewards", icon: Coins, label: "Rewards" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { member, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && (!member || (!member.isAdmin && !member.isModerator))) {
      router.replace("/dashboard");
    }
  }, [member, isLoading, router]);

  if (isLoading) return <LoadingScreen />;
  if (!member?.isAdmin && !member?.isModerator) return null;

  return (
    <div className="flex flex-col min-h-dvh bg-[#0a0a0a]">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="px-4 h-13 flex items-center gap-3 max-w-md mx-auto">
          <Link href="/dashboard" className="text-[#6b7a87] hover:text-[#c9a84c] transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#c9a84c]" />
            <span className="text-[14px] font-bold text-white tracking-wide">Admin Panel</span>
          </div>
          <div className="ml-auto">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wide ${
                member.isAdmin
                  ? "bg-[#e74c3c]/15 text-[#e74c3c]"
                  : "bg-[#c9a84c]/15 text-[#c9a84c]"
              }`}
            >
              {member.isAdmin ? "Admin" : "Moderator"}
            </span>
          </div>
        </div>
      </header>

      {/* Admin Nav */}
      <div className="fixed top-13 left-0 right-0 z-40 bg-[#0d0d0d] border-b border-white/5">
        <div className="flex overflow-x-auto scrollbar-none px-4 gap-1 py-2 max-w-md mx-auto">
          {ADMIN_NAV.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-xl text-[11px] font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#c9a84c] text-[#0a0a0a]"
                    : "bg-[#1c1c1c] text-[#6b7a87] hover:text-[#a8b4c0]"
                )}
              >
                <Icon size={12} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 pt-[88px] pb-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
