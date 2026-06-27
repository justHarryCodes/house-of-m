"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/store/notificationStore";
import {
  LayoutDashboard,
  Shield,
  Sword,
  Trophy,
  Bell,
  Scroll,
  Crown,
  Star,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/missions", icon: Sword, label: "Missions" },
  { href: "/governance", icon: Scroll, label: "Senate" },
  { href: "/leaderboard", icon: Trophy, label: "Ranks" },
  { href: "/notifications", icon: Bell, label: "Alerts" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass-dark border-t border-white/5 px-2 pt-2 pb-1">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const isNotif = href === "/notifications";

            return (
              <Link key={href} href={href} className="relative flex-1">
                <div
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl transition-all duration-200",
                    isActive
                      ? "text-[#c9a84c]"
                      : "text-[#6b7a87] hover:text-[#a8b4c0]"
                  )}
                >
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="nav-indicator"
                        className="absolute inset-0 rounded-lg bg-[#c9a84c]/10"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={22}
                      className={cn(
                        "relative z-10 transition-all duration-200",
                        isActive ? "scale-110" : "scale-100"
                      )}
                    />
                    {isNotif && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-[#c9a84c] text-[#0a0a0a] text-[9px] font-bold z-20">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium tracking-wide transition-all duration-200",
                      isActive ? "opacity-100" : "opacity-60"
                    )}
                  >
                    {label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
