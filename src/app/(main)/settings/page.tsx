"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useTelegram } from "@/hooks/useTelegram";
import { Bell, Shield, Wallet, LogOut, ChevronRight, Moon, Globe, Info } from "lucide-react";

interface SettingRow {
  icon: React.ElementType;
  label: string;
  description?: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { member, reset } = useAuthStore();
  const { haptic } = useTelegram();
  const [notifications, setNotifications] = useState(true);

  if (!member) return null;

  const handleLogout = () => {
    haptic.warning();
    reset();
    router.replace("/onboarding");
  };

  const SECTIONS: Array<{ title: string; rows: SettingRow[] }> = [
    {
      title: "Account",
      rows: [
        {
          icon: Shield,
          label: "Member ID",
          value: member.memberId,
        },
        {
          icon: Wallet,
          label: "Wallet",
          value: member.walletAddress
            ? `${member.walletAddress.slice(0, 6)}...${member.walletAddress.slice(-4)}`
            : "Not connected",
          onClick: () => router.push("/onboarding/wallet"),
        },
      ],
    },
    {
      title: "Preferences",
      rows: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Push alerts for rep, votes, rewards",
          value: notifications ? "On" : "Off",
          onClick: () => {
            setNotifications(n => !n);
            haptic.selection();
          },
        },
        {
          icon: Moon,
          label: "Theme",
          value: "Dark (System)",
        },
        {
          icon: Globe,
          label: "Language",
          value: "English",
        },
      ],
    },
    {
      title: "About",
      rows: [
        {
          icon: Info,
          label: "Version",
          value: "1.0.0",
        },
      ],
    },
    {
      title: "Danger Zone",
      rows: [
        {
          icon: LogOut,
          label: "Sign Out",
          description: "Clear session and return to onboarding",
          onClick: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="px-4 py-5 space-y-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">Settings</h1>
        <p className="text-[12px] text-[#6b7a87]">Manage your account and preferences</p>
      </motion.div>

      {SECTIONS.map(({ title, rows }, si) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.07 }}
          className="space-y-1"
        >
          <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase px-1 mb-2">
            {title}
          </p>
          <div className="card-hom divide-y divide-white/5 overflow-hidden">
            {rows.map(({ icon: Icon, label, description, value, onClick, danger }) => (
              <button
                key={label}
                onClick={onClick}
                disabled={!onClick}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
                  ${onClick ? "hover:bg-white/5 active:bg-white/5" : "cursor-default"}
                `}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: danger ? "#e74c3c15" : "#c9a84c10",
                  }}
                >
                  <Icon size={15} style={{ color: danger ? "#e74c3c" : "#c9a84c" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: danger ? "#e74c3c" : "#ffffff" }}
                  >
                    {label}
                  </p>
                  {description && (
                    <p className="text-[11px] text-[#6b7a87] leading-tight mt-0.5">{description}</p>
                  )}
                </div>
                {value && (
                  <span className="text-[12px] text-[#6b7a87] shrink-0">{value}</span>
                )}
                {onClick && !danger && (
                  <ChevronRight size={14} className="text-[#4a5568] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
