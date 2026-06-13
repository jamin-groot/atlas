# Atlas — The Wealth Exploration Layer for Web3

> DeFi excludes billions who can't decode it. Atlas translates complex on-chain opportunities into a spatial, goal-driven experience — guided by an AI agent whose every recommendation is transparent, auditable, and recorded permanently on Mantle.

**Live:** [atlas-web3.vercel.app](https://atlas-web3.vercel.app)

---

## What is Atlas?

Atlas is a navigable 3D world where your crypto portfolio becomes an island. Instead of dashboards and spreadsheets, capital has a **location**. Asset classes live in **districts** you can fly into. An AI agent called **Navigator** learns your goal and builds routes to get you there — and every decision it makes is recorded on-chain.

### Districts
| District | Assets | Strategy |
|---|---|---|
| Income District | USDY (tokenized US Treasury) | Stable passive yield |
| Staking District | mETH | ETH staking rewards |
| Treasury District | mUSD | Capital protection |
| Growth District | MNT/USDT LP, MNT Lending | High yield (coming soon) |
| Emerging Districts | Init Capital, Cleopatra | New protocols (coming soon) |

---

## Key Features

- **3D World** — Navigable spatial interface built with React Three Fiber. Your island grows as you allocate capital.
- **Goal-First AI Navigator** — Set a goal (income target, portfolio growth, capital protection). Navigator reasons about your portfolio and decides when to suggest a route — and when to tell you to hold.
- **ERC-8004 Compliance** — Full AI agent identity standard implementation on Mantle Sepolia. Every Navigator decision is signed, recorded on-chain, and publicly auditable.
- **Real World Assets** — USDY (Ondo Finance tokenized T-bills) and mUSD as core yield opportunities.
- **On-Chain Transparency** — Identity Registry, Reputation Registry, and Validation Registry deployed on Mantle Sepolia.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| 3D World | React Three Fiber, Three.js |
| Animations | Framer Motion |
| AI Agent | Claude API (claude-opus-4-8) |
| Wallet | Wagmi, Viem, MetaMask |
| Contracts | Solidity 0.8.26, Hardhat v3 |
| Database | Supabase |
| Blockchain | Mantle Sepolia (Chain ID: 5003) |
| Standard | ERC-8004 (AI Agent Identity) |

---

## Smart Contracts (Mantle Sepolia)

| Contract | Address |
|---|---|
| AtlasIdentityRegistry (ERC-8004) | `0x44A89E7F550E4c6A311c5c594F3b87e0b2C9155e` |
| AtlasReputationRegistry (ERC-8004) | `0x8b489B9916fa6A20BA2eC1e4F26762708A7C2a69` |
| AtlasValidationRegistry (ERC-8004) | `0x32766EF1b5A81E6CCD303bac9eDDa86359E6dc05` |

Explorer: [explorer.sepolia.mantle.xyz](https://explorer.sepolia.mantle.xyz)

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask with Mantle Sepolia network
- Test MNT from [faucet.sepolia.mantle.xyz](https://faucet.sepolia.mantle.xyz)

### Mantle Sepolia Network
- **RPC:** `https://rpc.sepolia.mantle.xyz`
- **Chain ID:** `5003`
- **Symbol:** MNT

### Installation

```bash
git clone https://github.com/jamin-groot/atlas.git
cd atlas
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_ATLAS_REGISTRY_ADDRESS=0x44A89E7F550E4c6A311c5c594F3b87e0b2C9155e
NEXT_PUBLIC_ATLAS_AGENT_ID=1
NEXT_PUBLIC_ATLAS_REPUTATION_ADDRESS=0x8b489B9916fa6A20BA2eC1e4F26762708A7C2a69
NEXT_PUBLIC_ATLAS_VALIDATION_ADDRESS=0x32766EF1b5A81E6CCD303bac9eDDa86359E6dc05
NEXT_PUBLIC_VAULT_USDY=<vault_address>
NEXT_PUBLIC_VAULT_METH=<vault_address>
NEXT_PUBLIC_VAULT_MUSD=<vault_address>
ANTHROPIC_API_KEY=<your_key>
NEXT_PUBLIC_SUPABASE_URL=<your_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_key>
DEPLOYER_PRIVATE_KEY=<deployer_key>
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ERC-8004 Implementation

Atlas implements the full ERC-8004 AI Agent Identity Standard:

- **Identity Registry** — ERC-721 based agent registration with on-chain metadata
- **Reputation Registry** — Client feedback, agent responses, aggregated scoring
- **Validation Registry** — Independent third-party verification of agent actions

Navigator is registered as Agent ID #1. Every recommendation, route suggestion, and portfolio analysis is recorded on-chain with full context including goal state, portfolio health, and the agent's reasoning.

---

## Architecture

```
src/
├── app/
│   ├── api/navigator/     # Claude AI streaming endpoint
│   └── page.tsx           # Main app shell
├── components/
│   ├── world/             # 3D scene (R3F)
│   ├── navigator/         # AI Navigator UI + chat
│   ├── goal/              # Goal-first routing modal
│   ├── districts/         # District explorer
│   ├── opportunity/       # Opportunity detail view
│   ├── allocation/        # On-chain allocation flow
│   └── landing/           # Marketing landing page
├── lib/
│   ├── routes.ts          # Goal-aware route generation
│   ├── districts.ts       # District + opportunity definitions
│   └── vaults.ts          # Vault contract ABIs + addresses
contracts/
├── AtlasIdentityRegistry.sol
├── AtlasReputationRegistry.sol
└── AtlasValidationRegistry.sol
```

---

## Built For

**Turing Test Hackathon 2026** — $100K prize pool

Primary track: **AI x RWA** — Dynamic yield and automated risk for assets like USDY and mETH on Mantle.
Secondary tracks: **Consumer & Viral DApps** · **AI Trading & Strategy**

Built by [@jamin-groot](https://github.com/jamin-groot)
