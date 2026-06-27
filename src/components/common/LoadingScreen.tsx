"use client";

import { motion } from "framer-motion";

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[100]">
      {/* Animated logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        {/* Roman M symbol */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#c9a84c]/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full border border-[#c9a84c]/10" />
          <span className="text-5xl font-bold text-gold-gradient z-10">M</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] tracking-[0.35em] text-[#6b7a87] uppercase">
            House of
          </span>
          <span className="text-[22px] font-bold tracking-[0.2em] text-gold-gradient uppercase">
            Magnolia
          </span>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#c9a84c]"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {message && (
          <p className="text-[12px] text-[#6b7a87] mt-2">{message}</p>
        )}
      </motion.div>
    </div>
  );
}
