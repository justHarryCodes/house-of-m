"use client";

export const dynamic = "force-dynamic";

import nextDynamic from "next/dynamic";
import { LoadingScreen } from "@/components/common/LoadingScreen";

const NFTContent = nextDynamic(
  () => import("./NFTContent"),
  {
    ssr: false,
    loading: () => <LoadingScreen message="Loading NFTs..." />,
  }
);

export default function NFTPage() {
  return <NFTContent />;
}
