import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, base, arbitrum, optimism } from "wagmi/chains";

// RainbowKit validates projectId at module evaluation — use a fallback during SSR/build
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "placeholder_not_used_server_side";

export const wagmiConfig = getDefaultConfig({
  appName: "House of M",
  projectId,
  chains: [mainnet, polygon, base, arbitrum, optimism],
  ssr: false, // disable SSR — we guard with `mounted` in Web3Provider
});
