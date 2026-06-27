import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "House of M",
  description: "The exclusive Web3 opportunity network for builders, creators, founders, and contributors.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  openGraph: {
    title: "House of M",
    description: "Exclusive Web3 members club",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="min-h-dvh bg-[#0a0a0a] text-[#e8e8e8] overflow-x-hidden">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
