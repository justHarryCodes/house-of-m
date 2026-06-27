"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuthStore } from "@/store/authStore";
import { truncateAddress, getTierColor } from "@/lib/utils";
import type { NFTMembership } from "@/types";
import { Star, Gem, Shield, Wallet, ExternalLink, Award } from "lucide-react";

const RARITY_COLORS = {
  common: "#a8b4c0",
  rare: "#4a90d9",
  epic: "#9b59b6",
  legendary: "#c9a84c",
};

const RARITY_LABELS = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

function NFTCard({ nft }: { nft: NFTMembership }) {
  const rarityColor = nft.rarity ? RARITY_COLORS[nft.rarity] : "#a8b4c0";
  const rarityLabel = nft.rarity ? RARITY_LABELS[nft.rarity] : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-hom overflow-hidden"
      style={{ border: `1px solid ${rarityColor}25` }}
    >
      {nft.imageUrl ? (
        <img
          src={nft.imageUrl}
          alt={nft.name}
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div
          className="w-full aspect-square flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${rarityColor}10, ${rarityColor}25)` }}
        >
          <Gem size={48} style={{ color: rarityColor }} />
        </div>
      )}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white">{nft.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
            style={{ background: `${rarityColor}15`, color: rarityColor }}
          >
            {rarityLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#6b7a87]">
          <span>#{nft.tokenId}</span>
          <span>{truncateAddress(nft.contractAddress)}</span>
        </div>
        {nft.reputationBoost && (
          <div className="flex items-center gap-1 text-[11px] text-[#27ae60]">
            <Star size={11} fill="#27ae60" />
            +{nft.reputationBoost}% reputation boost active
          </div>
        )}
        {nft.attributes && nft.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {nft.attributes.slice(0, 4).map((attr) => (
              <span
                key={attr.trait_type}
                className="text-[9px] px-1.5 py-0.5 rounded bg-[#1c1c1c] text-[#6b7a87]"
              >
                {attr.trait_type}: {attr.value}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function NFTContent() {
  const { isConnected, address } = useAccount();
  const { member } = useAuthStore();
  const [nfts, setNfts] = useState<NFTMembership[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    fetch(`/api/nft?memberId=${member.memberId}`)
      .then(r => r.json())
      .then(d => setNfts(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [member?.memberId]);

  if (!member) return null;

  const hasNFT = nfts.length > 0 || member.nftOwned.length > 0;

  return (
    <div className="px-4 py-5 space-y-6 max-w-md mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-[20px] font-bold text-white">NFT Membership</h1>
        <p className="text-[12px] text-[#6b7a87]">Your House of M identity tokens</p>
      </motion.div>

      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-hom-elevated p-6 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 flex items-center justify-center">
            <Wallet size={24} className="text-[#c9a84c]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-white">Connect Wallet</p>
            <p className="text-[12px] text-[#6b7a87] mt-1">
              Link your wallet to view your NFT memberships and unlock token-gated benefits.
            </p>
          </div>
          <ConnectButton />
        </motion.div>
      ) : (
        <>
          <div className="card-hom p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#27ae60]" />
              <span className="text-[12px] text-[#a8b4c0]">Wallet Connected</span>
            </div>
            <span className="text-[12px] font-mono text-white">{truncateAddress(address ?? "")}</span>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="card-hom-elevated p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-[#6b7a87] uppercase tracking-widest">Membership Status</p>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                  hasNFT
                    ? "bg-[#c9a84c]/15 text-[#c9a84c]"
                    : "bg-white/5 text-[#6b7a87]"
                }`}
              >
                {hasNFT ? "NFT Holder" : "Non-holder"}
              </span>
            </div>

            {hasNFT ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#27ae60]">
                  <Shield size={14} />
                  <span className="text-[12px] font-medium">Active membership NFT detected</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "NFTs Held", value: member.nftOwned.length },
                    { label: "Rep Boost", value: "+10%" },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-[#1c1c1c] rounded-xl p-3 text-center">
                      <p className="text-[18px] font-bold text-[#c9a84c]">{value}</p>
                      <p className="text-[10px] text-[#6b7a87]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[12px] text-[#a8b4c0]">
                  No House of M NFTs found in this wallet. Hold a membership NFT to unlock:
                </p>
                {[
                  "Reputation score boosts",
                  "Exclusive mission access",
                  "NFT-gated governance votes",
                  "Partner priority access",
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-[#6b7a87]" />
                    <span className="text-[11px] text-[#6b7a87]">{benefit}</span>
                  </div>
                ))}
                <a
                  href="https://opensea.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[12px] text-[#4a90d9] mt-2"
                >
                  <ExternalLink size={12} />
                  View Collection on OpenSea
                </a>
              </div>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : nfts.length > 0 ? (
            <>
              <p className="text-[10px] tracking-[0.3em] text-[#6b7a87] uppercase">Your NFTs</p>
              <div className="grid grid-cols-2 gap-3">
                {nfts.map((nft) => (
                  <NFTCard key={nft.id} nft={nft} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}

      <div className="card-hom p-4 space-y-2">
        <p className="text-[11px] tracking-widest text-[#6b7a87] uppercase">Upcoming Features</p>
        {[
          "NFT-gated exclusive channels",
          "Rarity-based tier upgrades",
          "NFT staking for reputation",
          "Cross-chain membership support",
        ].map((feat) => (
          <div key={feat} className="flex items-center gap-2">
            <Award size={10} className="text-[#c9a84c]/50" />
            <span className="text-[11px] text-[#6b7a87]">{feat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
