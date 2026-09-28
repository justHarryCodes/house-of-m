# House of Mon — Deployment Guide

## Prerequisites

- Node.js 20+
- Firebase project (Blaze plan for Admin SDK)
- Telegram Bot (created via @BotFather)
- WalletConnect project ID (cloud.walletconnect.com)
- Vercel account (or any Node.js host)

---

## 1. Firebase Setup

### Create project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project — name it `house-of-m`
3. Enable **Firestore Database** (Production mode)
4. Enable **Authentication** → Sign-in method → **Custom token** (already enabled by default)
5. Enable **Storage** (for proof screenshots)

### Firestore indexes (required)
Create composite indexes in Firebase Console > Firestore > Indexes:

| Collection | Fields |
|---|---|
| `users` | `isBanned ASC, reputationScore DESC` |
| `users` | `isBanned ASC, xpScore DESC` |
| `users` | `isBanned ASC, governanceParticipationCount DESC` |
| `reputationHistory` | `memberId ASC, createdAt DESC` |
| `votes` | `proposalId ASC, memberId ASC` |
| `violationVotes` | `violationId ASC, memberId ASC` |
| `eventRsvps` | `eventId ASC, memberId ASC` |
| `questSubmissions` | `questId ASC, memberId ASC` |

### Firestore security rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all non-banned members
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    // All authenticated users can read public collections
    match /proposals/{id} {
      allow read: if request.auth != null;
    }
    match /votes/{id} {
      allow read: if request.auth != null;
    }
    match /quests/{id} {
      allow read: if request.auth != null;
    }
    match /rewards/{id} {
      allow read: if request.auth != null;
    }
    match /events/{id} {
      allow read: if request.auth != null;
    }
    match /violations/{id} {
      allow read: if request.auth != null;
    }
    match /notifications/{id} {
      allow read: if request.auth != null 
        && resource.data.memberId == request.auth.token.memberId;
    }
    // All other writes go through the Admin SDK (server-side only)
    match /{document=**} {
      allow write: if false;
    }
  }
}
```

### Get Admin SDK credentials
1. Firebase Console > Project Settings > Service Accounts
2. Click **Generate new private key** → downloads JSON
3. Extract `project_id`, `client_email`, `private_key` into `.env.local`

---

## 2. Telegram Bot Setup

### Create the bot
1. Open Telegram, start chat with **@BotFather**
2. Send `/newbot` → follow prompts → copy the **bot token**
3. Send `/setmenubutton` → set the URL to your deployed app URL
4. Send `/setdomain` → add your domain for web app access

### Enable Web App
1. Send `/newapp` to BotFather
2. Name it **House of Mon**
3. Set the URL to your Vercel deployment URL
4. The bot will generate a short link like `t.me/YourBot/app`

---

## 3. WalletConnect Setup

1. Go to [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Create a new project → name it `house-of-m`
3. Copy the **Project ID** into `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

---

## 4. Local Development

```bash
# Clone and install
cd house-of-m
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in all values in .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** In development mode, a mock Telegram user is used automatically
> (ID: 123456789, name: "House Member"). Full Telegram auth only works when
> deployed behind an HTTPS domain with a real bot token.

---

## 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Or connect GitHub repo to Vercel dashboard for auto-deploy
```

### Environment variables on Vercel
Add all variables from `.env.local.example` in:
**Vercel Dashboard > Your Project > Settings > Environment Variables**

---

## 6. Set First Admin

After the first user registers, manually set them as admin in Firestore:

1. Firebase Console > Firestore > `users` collection
2. Find the document with your `memberId`
3. Edit: set `isAdmin: true`

---

## 7. Post-deployment checklist

- [ ] Telegram bot token set
- [ ] Firebase client config set
- [ ] Firebase Admin SDK credentials set
- [ ] WalletConnect project ID set
- [ ] Firestore indexes created
- [ ] Firestore security rules deployed
- [ ] First admin account promoted
- [ ] Telegram bot Web App URL updated to production URL
- [ ] Test full auth flow via Telegram
- [ ] Test wallet connect + signature

---

## Tech Stack Reference

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Animations | Framer Motion |
| State | Zustand |
| Database | Firebase Firestore |
| Auth | Firebase Authentication (custom tokens) |
| Telegram | Telegram Web App SDK |
| Web3 | RainbowKit + Wagmi + Viem |
| Hosting | Vercel (recommended) |

---

## Firestore Collection Reference

| Collection | Purpose |
|---|---|
| `users` | Member profiles |
| `counters` | Auto-increment for member IDs |
| `reputationHistory` | Full reputation event log |
| `proposals` | Governance proposals |
| `votes` | Individual governance votes |
| `quests` | Missions and quests |
| `questSubmissions` | Member proof submissions |
| `rewards` | Available rewards |
| `rewardClaims` | Claim records |
| `violations` | House review cases |
| `violationVotes` | Case votes (retain/evict) |
| `nftMemberships` | NFT ownership records |
| `events` | X Spaces, AMAs, community events |
| `eventRsvps` | Event attendance records |
| `notifications` | In-app notification inbox |
