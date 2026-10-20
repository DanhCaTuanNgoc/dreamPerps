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

## 🔗 Verified Testnet Orders & Smart Account Architecture

During testing on **Somnia Tokyo Testnet (Chain ID: `50312`)**, live order execution and contract interactions were verified on-chain:

| Entity | Address / Hash | Description |
|:---|:---|:---|
| **Perps Arena Smart Account** | [`0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8`](https://explorer.testnet.somnia.network/tokyo/address/0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8) | Safe Smart Account proxy holding 1,000 USDso margin |
| **Owner / Signer EOA** | [`0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`](https://explorer.testnet.somnia.network/tokyo/address/0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF) | MetaMask signer wallet |
| **MarginBank Contract** | [`0x478769E1177C0773c43A593DCCc4Ad15F15F1394`](https://explorer.testnet.somnia.network/tokyo/address/0x478769E1177C0773c43A593DCCc4Ad15F15F1394) | Somnia Tokyo Perps MarginBank |
| **Verified Order TxHash** | [`0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3`](https://explorer.testnet.somnia.network/tokyo/tx/0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3) | Live BTC Long order executed at Block `28555324` |

---

## 📝 Bug & Feedback Submissions (Feedback Track)

As part of the **Feedback Track**, our automated test harness identified **8 concrete, reproducible defects** across the SDK and integration layer.

Detailed defect write-ups conforming to the hackathon guidelines are provided in [`feedback/`](feedback/) and summarized in [feedback-v1.md](feedback-v1.md):

| ID | Issue Title | Severity | Area | Status |
|:---|:---|:---:|:---:|:---:|
| **[ISSUE-01](feedback/issue-01-loadmarkets-empty-addresses.md)** | `loadMarkets()` returns empty array on Testnet unless contract addresses are manually passed | **Critical** | SDK | 100% Reproducible |
| **[ISSUE-02](feedback/issue-02-createorder-missing-client-validation.md)** | `createOrder()` bypasses client validation for `type` & `side`, wasting gas via contract revert | **Major** | SDK | 100% Reproducible |
| **[ISSUE-03](feedback/issue-03-watchorderbook-notconfigured-error.md)** | `watchOrderBook()` throws unhandled `NotConfiguredError` without on-chain polling fallback | **Major** | SDK | 100% Reproducible |
| **[ISSUE-04](feedback/issue-04-watchprice-pricefeed-notconfigured.md)** | `watchPrice()` throws `NotConfiguredError` requiring GraphQL price-feed without on-chain fallback | **Major** | SDK | 100% Reproducible |
| **[ISSUE-05](feedback/issue-05-fetchorderbook-unbounded-depth-revert.md)** | `fetchOrderBook()` with large depth triggers on-chain `ContractRevertError` instead of client check | **Normal** | SDK | 100% Reproducible |
| **[ISSUE-06](feedback/issue-06-fetchticker-unhandled-typeerror.md)** | `fetchTicker()` crashes with unhandled JavaScript `TypeError` on non-string inputs | **Normal** | SDK | 100% Reproducible |
| **[ISSUE-07](feedback/issue-07-cancelorder-syntaxerror-invalid-id.md)** | `cancelOrder()` crashes with unhandled `SyntaxError: Cannot convert to BigInt` on alphanumeric IDs | **Normal** | SDK | 100% Reproducible |
| **[ISSUE-08](feedback/issue-08-smart-account-undocumented.md)** | Undocumented Safe Smart Account architecture creates balance desync & order execution failure | **Major** | Docs / SDK | 100% Reproducible |

### Run Automated Reproduction Suite
To verify all 8 issues in a single execution against Somnia Tokyo Testnet:
```bash
node feedback/reproduce_all.js
```

---

## 📢 X Posts

Links to our official posts on X documenting development progress and tagging `@DreamDEXSomnia`:

- **Post 1 (Introduction & Architecture):** [Link to X Post 1](https://x.com/your_handle/status/...)
- **Post 2 (Live Testnet Orders & Demo):** [Link to X Post 2](https://x.com/your_handle/status/...)
- **Post 3 (Technical Breakdown & Findings):** [Link to X Post 3](https://x.com/your_handle/status/...)

---

## 📄 License
MIT License.
