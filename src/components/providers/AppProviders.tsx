"use client";

import { Web3Provider } from "./Web3Provider";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#161616",
            border: "1px solid rgba(201, 168, 76, 0.2)",
            color: "#e8e8e8",
            fontFamily: "inherit",
          },
        }}
      />
    </Web3Provider>
  );
}
