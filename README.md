# 🚀 dreamDEX Perps Sentinel & Trading Agent

> Built for the **dreamDEX Perps Builder Bounty** on **Somnia Tokyo Testnet** (Chain ID: `50312`).

[![Somnia Network](https://img.shields.io/badge/Network-Somnia_Tokyo_Testnet-blue.svg)](https://somnia.network)
[![dreamDEX](https://img.shields.io/badge/DEX-dreamDEX_Perps-purple.svg)](https://app.testnet.dreamdex.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

**dreamDEX Perps Sentinel & Trading Agent** is an autonomous trading agent and risk management system built on top of dreamDEX’s high-performance Central Limit Order Book (CLOB) on Somnia.

### Key Features
1. **Automated Grid Trading Engine:** Dynamically calculates price levels and sets limit orders around market mid-price with customizable margins and sizes.
2. **Margin & Solvency Sentinel:** Actively monitors the `MarginBank` health, position leverage ratio, unrealized PnL, and liquidation distance.
3. **Dry-Run Mode & Live Execution:** Supports safe offline simulation (`--dry-run`) as well as real on-chain transaction execution on Somnia Testnet.
4. **Structured Feedback Collection:** Integrated exception interceptors formatted according to the hackathon's Feedback Track requirements.

---

## 🎯 Target Audience

- **Algorithmic Traders:** Users seeking reliable, sub-second execution on high-frequency CLOB perps with 0% trading fees.
- **DeFi Market Makers:** Liquidity providers aiming to capture stablecoin yields via automated quotation spreads.
- **Developers & Auditors:** Builders exploring the `@somnia-chain/markets-sdk` and looking for reproducible feedback opportunities.

---

## 🛠️ Tech Stack & Architecture

- **Blockchain:** Somnia Shannon / Tokyo Testnet (`Chain ID: 50312`)
- **Language / Runtime:** TypeScript / Node.js (ES2022)
- **Core SDK:** `@somnia-chain/markets-sdk` (v0.32.x)
- **Web3 Engine:** `viem`

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.x
- npm / pnpm

### 2. Installation
```bash
git clone <your-repo-url>
cd dreamdex-perps
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and fill in your parameters:
```bash
cp .env.example .env
```

Key environment parameters:
- `PRIVATE_KEY`: Your Somnia testnet private key (faucet testnet STT for gas and USDso for margin).
- `TRADING_PAIR`: Default `BTC/USDso:USDso`
- `DRY_RUN`: Set to `true` for dry-run simulation or `false` for real testnet order execution.

### 4. Running the Agent

#### Test Network Connection
```bash
npm run test:connection
```

#### Run in Dry-Run Simulation Mode (No on-chain funds needed)
```bash
npm run dry-run
```

#### Run Live on Somnia Testnet
```bash
npm start
```

---

## 📝 Bug & Feedback Submissions (Feedback Track)

All reported issues, SDK discrepancies, and documentation gaps discovered during development and stress-testing are documented under the [`feedback/`](feedback/) directory following the official hackathon template.

---

## 📢 X Posts

Links to our official posts on X documenting development progress and tagging `@DreamDEXSomnia`:

- **Post 1 (Introduction & Architecture):** [Link to X Post 1](https://x.com/your_handle/status/...)
- **Post 2 (Live Testnet Orders & Demo):** [Link to X Post 2](https://x.com/your_handle/status/...)
- **Post 3 (Technical Breakdown & Findings):** [Link to X Post 3](https://x.com/your_handle/status/...)

---

## 📄 License
MIT License.
