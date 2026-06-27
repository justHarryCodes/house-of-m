"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { getTierColor, getTierIcon, formatNumber, calculateLevel, xpProgress } from "@/lib/utils";
import { TIER_LABELS, TIER_THRESHOLDS } from "@/types";
import type { MemberTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Star, Wallet, AtSign, Code2, Globe, Edit2, Check, X } from "lucide-react";

export default function ProfilePage() {
  const { member, setMember, telegramUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState(member?.bio ?? "");
  const [twitter, setTwitter] = useState(member?.socialLinks?.twitter ?? "");
  const [github, setGithub] = useState(member?.socialLinks?.github ?? "");
  const [website, setWebsite] = useState(member?.socialLinks?.website ?? "");

  if (!member) return null;

  const tierColor = getTierColor(member.tier);
  const level = calculateLevel(member.xpScore);
  const progress = xpProgress(member.xpScore);
  const tierLabel = TIER_LABELS[member.tier as MemberTier];

  const TIERS: MemberTier[] = ["citizen", "patrician", "senator", "consul", "emperor"];
  const currentTierIdx = TIERS.indexOf(member.tier as MemberTier);

  const handleSave = async () => {
    if (!member) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${member.memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          socialLinks: { twitter, github, website },
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setMember({
        ...member,
        bio,
        socialLinks: { twitter, github, website },
      });
      setEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBio(member.bio ?? "");
    setTwitter(member.socialLinks?.twitter ?? "");
    setGithub(member.socialLinks?.github ?? "");
    setWebsite(member.socialLinks?.website ?? "");
    setEditing(false);
  };

  return (
    <div className="px-4 py-5 space-y-5 max-w-md mx-auto">
      {/* Identity Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-hom-elevated p-5 space-y-4"
        style={{ borderColor: `${tierColor}20` }}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16" style={{ outline: `2px solid ${tierColor}40` }}>
              <AvatarImage src={member.photoUrl} alt={member.displayName} />
              <AvatarFallback
                className="text-2xl font-bold"
                style={{ background: `${tierColor}15`, color: tierColor }}
              >
                {member.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span
              className="absolute -bottom-0.5 -right-0.5 text-lg leading-none"
              style={{ color: tierColor }}
            >
              {getTierIcon(member.tier)}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-white">{member.displayName}</h1>
              {telegramUser?.is_premium && (
                <Star size={12} className="text-[#c9a84c]" fill="#c9a84c" />
              )}
            </div>
            <p className="text-[11px] font-mono text-[#6b7a87]">{member.memberId}</p>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold mt-1 inline-block"
              style={{ background: `${tierColor}15`, color: tierColor }}
            >
              {tierLabel}
            </span>
          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-[#6b7a87] hover:text-[#c9a84c] transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>

        {/* Bio */}
        {editing ? (
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell your story..."
            className="bg-[#161616] border-white/10 text-white text-[13px] resize-none"
            rows={3}
            maxLength={200}
          />
        ) : member.bio ? (
          <p className="text-[12px] text-[#a8b4c0] leading-relaxed">{member.bio}</p>
        ) : !editing ? (
          <p className="text-[12px] text-[#4a5568] italic">No bio set</p>
        ) : null}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Reputation", value: formatNumber(member.reputationScore) },
            { label: "Level", value: `Lv.${level}` },
            { label: "XP", value: formatNumber(member.xpScore) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0f0f0f] rounded-xl p-3 text-center">
              <p className="text-[16px] font-bold text-white">{value}</p>
              <p className="text-[10px] text-[#6b7a87]">{label}</p>
            </div>
          ))}
        </div>

        {/* XP progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-[#6b7a87]">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="h-1.5 bg-[#1c1c1c] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${tierColor}80, ${tierColor})` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tier Progression */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="card-hom p-4 space-y-3"
      >
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Tier Progression</p>
        <div className="flex items-center justify-between gap-1">
          {TIERS.map((tier, i) => {
            const tc = getTierColor(tier);
            const isActive = i === currentTierIdx;
            const isPast = i < currentTierIdx;
            return (
              <div key={tier} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all"
                  style={{
                    background: isActive || isPast ? `${tc}20` : "#1c1c1c",
                    border: isActive ? `1px solid ${tc}40` : "1px solid transparent",
                  }}
                >
                  <span style={{ color: isActive || isPast ? tc : "#4a5568" }}>
                    {getTierIcon(tier)}
                  </span>
                </div>
                <span className="text-[8px] text-center" style={{ color: isActive ? tc : "#4a5568" }}>
                  {TIER_LABELS[tier]}
                </span>
              </div>
            );
          })}
        </div>
        {currentTierIdx < TIERS.length - 1 && (
          <p className="text-[11px] text-[#6b7a87]">
            {formatNumber(TIER_THRESHOLDS[TIERS[currentTierIdx + 1]] - member.reputationScore)} rep to{" "}
            <span style={{ color: getTierColor(TIERS[currentTierIdx + 1]) }}>
              {TIER_LABELS[TIERS[currentTierIdx + 1]]}
            </span>
          </p>
        )}
      </motion.div>

      {/* Wallet */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="card-hom p-4 space-y-2"
      >
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Wallet</p>
        {member.walletAddress ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
            <span className="text-[12px] font-mono text-white">{member.walletAddress}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-[#6b7a87]" />
            <span className="text-[12px] text-[#6b7a87]">No wallet connected</span>
          </div>
        )}
      </motion.div>

      {/* Social Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="card-hom p-4 space-y-3"
      >
        <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Social Links</p>
        {editing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AtSign size={14} className="text-[#4a90d9] shrink-0" />
              <Input value={twitter} onChange={e => setTwitter(e.target.value)}
                placeholder="Twitter username" className="bg-[#161616] border-white/10 text-white text-[13px] h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Code2 size={14} className="text-[#a8b4c0] shrink-0" />
              <Input value={github} onChange={e => setGithub(e.target.value)}
                placeholder="GitHub username" className="bg-[#161616] border-white/10 text-white text-[13px] h-8" />
            </div>
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-[#27ae60] shrink-0" />
              <Input value={website} onChange={e => setWebsite(e.target.value)}
                placeholder="Website URL" className="bg-[#161616] border-white/10 text-white text-[13px] h-8" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { icon: AtSign, color: "#4a90d9", value: member.socialLinks?.twitter, label: "Twitter" },
              { icon: Code2, color: "#a8b4c0", value: member.socialLinks?.github, label: "GitHub" },
              { icon: Globe, color: "#27ae60", value: member.socialLinks?.website, label: "Website" },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={14} style={{ color }} className="shrink-0" />
                <span className={`text-[12px] ${value ? "text-white" : "text-[#4a5568]"}`}>
                  {value || `No ${label} linked`}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Save / Cancel */}
      {editing && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <Button onClick={handleSave} disabled={saving}
            className="flex-1 h-10 gold-gradient text-[#0a0a0a] border-0 rounded-xl font-semibold text-[13px]">
            {saving ? "Saving..." : <><Check size={14} className="mr-1.5" />Save Changes</>}
          </Button>
          <Button onClick={handleCancel} variant="outline"
            className="flex-1 h-10 border-white/10 text-[#a8b4c0] rounded-xl text-[13px] bg-transparent">
            <X size={14} className="mr-1.5" />Cancel
          </Button>
        </motion.div>
      )}
    </div>
  );
}
