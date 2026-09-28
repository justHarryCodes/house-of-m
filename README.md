# House of Mon

**The exclusive Web3 opportunity network for builders, creators, founders and contributors.**

House of Mon is a community platform that runs as a Telegram Mini App. Members complete missions, earn reputation and rewards, vote on proposals, RSVP to events and hold membership NFTs. Admins run everything from a built-in back office.

## Features

**Members**
- Sign in instantly through Telegram, then link a wallet (RainbowKit)
- **Missions:** complete quests and submit proof for review
- **Reputation and leaderboard:** earn points for contributions and climb the rankings
- **Rewards:** claim rewards unlocked by reputation
- **Governance:** create and vote on community proposals
- **Events:** browse and RSVP
- **NFTs:** view membership NFTs
- **Community moderation:** report violations and vote on them
- Notifications and profile settings

**Admins (`/admin`)**
- Manage members, quests (including reviewing submissions), rewards, events, proposals and violations

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router), React, TypeScript |
| Platform | Telegram Mini Apps SDK |
| Wallets | wagmi, viem, RainbowKit |
| Backend | Firebase (Firestore, Admin SDK) |
| UI | Tailwind CSS, shadcn/ui, Framer Motion, Sonner |
| State | Zustand |

## Getting started

```bash
git clone https://github.com/justHarryCodes/house-of-m.git
cd house-of-m
npm install
# create .env.local (see below)
npm run dev          # http://localhost:3000
```

To test inside Telegram, expose your dev server over HTTPS (for example with ngrok) and set it as your bot's Web App URL.

The full guide, covering Firebase, the Telegram bot, WalletConnect, Vercel, the first admin and a post-deploy checklist, is in **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**.

## Environment variables

| Group | Variables |
|---|---|
| Telegram | `TELEGRAM_BOT_TOKEN`, used server-side to verify Telegram login data |
| WalletConnect | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` |
| Firebase client | `NEXT_PUBLIC_FIREBASE_*` |
| Firebase Admin | `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` |

## Project structure

```
src/
├── app/
│   ├── (main)/        # dashboard, missions, rewards, reputation, leaderboard,
│   │                  # governance, events, nft, violations, notifications, profile, settings
│   ├── admin/         # Back office
│   ├── onboarding/    # Telegram sign-in and wallet linking
│   └── api/           # auth/telegram, quests, rewards, proposals, events, violations, …
├── components/  hooks/  lib/  store/  types/
docs/DEPLOYMENT.md     # Setup and deployment guide
```
