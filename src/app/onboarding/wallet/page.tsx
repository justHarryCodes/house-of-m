"use client";

export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { LoadingScreen } from "@/components/common/LoadingScreen";

const WalletOnboardingContent = nextDynamic(
  () => import("./WalletContent"),
  {
    ssr: false,
    loading: () => <LoadingScreen message="Loading wallet..." />,
  }
);

export default function WalletOnboardingPage() {
  return <WalletOnboardingContent />;
}
