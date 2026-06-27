"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { getTierColor, getTierIcon } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings, ChevronLeft } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "House of Mon",
  "/reputation": "Reputation",
  "/governance": "Senate",
  "/missions": "Missions",
  "/rewards": "Rewards",
  "/nft": "NFT Membership",
  "/events": "Events",
  "/leaderboard": "Leaderboard",
  "/violations": "House Review",
  "/notifications": "Notifications",
  "/profile": "Profile",
};

export function Header() {
  const pathname = usePathname();
  const { member } = useAuthStore();

  const title = PAGE_TITLES[pathname] ?? PAGE_TITLES[`/${pathname.split("/")[1]}`] ?? "House of Mon";
  const isDashboard = pathname === "/dashboard";
  const showBack = !isDashboard && pathname !== "/";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 safe-top">
      <div className="glass-dark border-b border-white/5 px-4 h-14 flex items-center justify-between max-w-md mx-auto">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1 text-[#a8b4c0] hover:text-[#c9a84c] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}

          {isDashboard && member ? (
            <Link href="/profile" className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="w-8 h-8 ring-1 ring-[#c9a84c]/30">
                  <AvatarImage src={member.photoUrl} alt={member.displayName} />
                  <AvatarFallback className="bg-[#1c1c1c] text-[#c9a84c] text-xs font-bold">
                    {member.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="absolute -bottom-0.5 -right-0.5 text-[8px] leading-none"
                  style={{ color: getTierColor(member.tier) }}
                >
                  {getTierIcon(member.tier)}
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] text-[#6b7a87]">{member.memberId}</span>
                <span className="text-[13px] font-semibold text-white truncate max-w-[120px]">
                  {member.displayName}
                </span>
              </div>
            </Link>
          ) : (
            <span className="text-[15px] font-semibold tracking-wide text-white">{title}</span>
          )}
        </div>

        {/* Center — wordmark on dashboard */}
        {isDashboard && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            <span className="text-[15px] font-bold tracking-widest text-gold-gradient uppercase">
              House of Mon
            </span>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {member && (
            <Link href="/settings" className="text-[#6b7a87] hover:text-[#c9a84c] transition-colors">
              <Settings size={18} />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
