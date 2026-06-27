"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { truncateAddress } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle2, ArrowRight, ShieldCheck, SkipForward } from "lucide-react";

export default function WalletContent() {
  const router = useRouter();
  const { member, setMember } = useAuthStore();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync } = useSignMessage();
  const [isSaving, setIsSaving] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const handleSaveWallet = async () => {
    if (!address || !member) return;
    setIsSaving(true);
    try {
      await signMessageAsync({
        message: `House of M — Verify wallet ownership\nMember: ${member.memberId}\nAddress: ${address}\nTimestamp: ${Date.now()}`,
      });
      const res = await fetch(`/api/users/${member.memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (!res.ok) throw new Error("Failed to save wallet");
      setMember({ ...member, walletAddress: address });
      setIsSigned(true);
      toast.success("Wallet verified and saved");
      setTimeout(() => router.replace("/dashboard"), 1200);
    } catch (err: any) {
      if (err?.code === 4001 || err?.message?.includes("rejected")) {
        toast.error("Signature rejected");
      } else {
        toast.error("Failed to save wallet");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm flex flex-col items-center gap-8"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
            <Wallet size={28} className="text-[#c9a84c]" />
          </div>
          <h1 className="text-[22px] font-bold text-white">Connect Your Wallet</h1>
          <p className="text-[13px] text-[#a8b4c0] leading-relaxed">
            Link a Web3 wallet to access rewards, NFT benefits, and on-chain governance.
          </p>
        </div>

        {member && (
          <div className="card-hom-elevated w-full p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c9a84c]/10 flex items-center justify-center text-[#c9a84c] font-bold text-lg">
              {member.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] text-[#6b7a87]">{member.memberId}</p>
              <p className="text-[14px] font-semibold text-white">{member.displayName}</p>
            </div>
          </div>
        )}

        <div className="w-full space-y-3">
          {!isConnected ? (
            <Button
              onClick={openConnectModal}
              className="w-full h-14 text-[15px] font-semibold rounded-2xl gold-gradient text-[#0a0a0a] border-0"
            >
              <Wallet size={18} className="mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <AnimatePresence mode="wait">
              {isSigned ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-4">
                  <CheckCircle2 size={40} className="text-[#27ae60]" />
                  <p className="text-[14px] font-semibold text-white">Wallet Verified!</p>
                  <p className="text-[12px] text-[#6b7a87]">Entering the House...</p>
                </motion.div>
              ) : (
                <motion.div key="verify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="card-hom p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
                      <span className="text-[13px] text-[#a8b4c0]">Connected</span>
                    </div>
                    <span className="text-[13px] font-mono font-semibold text-white">
                      {truncateAddress(address ?? "")}
                    </span>
                  </div>
                  <Button onClick={handleSaveWallet} disabled={isSaving}
                    className="w-full h-14 text-[15px] font-semibold rounded-2xl gold-gradient text-[#0a0a0a] border-0">
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0a0a0a]/30 border-t-[#0a0a0a] rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck size={18} />Verify & Save Wallet<ArrowRight size={16} />
                      </span>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        <div className="w-full space-y-2">
          <p className="text-[11px] tracking-widest text-[#6b7a87] uppercase text-center mb-3">Wallet Unlocks</p>
          {["Partner airdrops & NFT drops", "Whitelist spots for launches", "On-chain governance voting", "NFT membership benefits"].map((perk) => (
            <div key={perk} className="flex items-center gap-2.5">
              <div className="w-1 h-1 rounded-full bg-[#c9a84c]" />
              <span className="text-[12px] text-[#a8b4c0]">{perk}</span>
            </div>
          ))}
        </div>

        <button onClick={() => router.replace("/dashboard")}
          className="text-[12px] text-[#6b7a87] hover:text-[#a8b4c0] flex items-center gap-1 transition-colors">
          <SkipForward size={13} />
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
