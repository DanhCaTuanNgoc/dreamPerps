# 🚀 dreamDEX Perps Sentinel & Trading Agent

> Institutional-grade Trading Agent, Risk Sentinel, and Comprehensive Defect Audit Harness built for the **dreamDEX Perps Builder Bounty** on **Somnia Tokyo Testnet**.

[![Somnia Network](https://img.shields.io/badge/Network-Somnia_Tokyo_Testnet-blue.svg)](https://somnia.network)
[![dreamDEX](https://img.shields.io/badge/DEX-dreamDEX_Perps-purple.svg)](https://app.testnet.dreamdex.io)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.x-blue.svg)](https://www.typescriptlang.org)
[![Core SDK](https://img.shields.io/badge/SDK-%40somnia--chain%2Fmarkets--sdk-orange.svg)](https://www.npmjs.com/package/@somnia-chain/markets-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Executive Summary

**dreamDEX Perps Sentinel & Trading Agent** is a full-stack algorithmic trading system and automated security/reliability test harness designed specifically for dreamDEX’s high-throughput Central Limit Order Book (CLOB) perpetual contracts on the Somnia Blockchain.

The project addresses two core tracks of the bounty program:
1. **MVP Track:** An autonomous, risk-managed Grid Trading Agent equipped with real-time solvency monitoring (`MarginBank` sentinel), orderbook spread analytics, configurable leverage, and dual execution modes (Safe Dry-Run simulation vs. Live On-Chain execution).
2. **Feedback Track:** A rigorous automated stress-testing harness housed in the [`feedback/`](feedback/) directory that audits the client SDK (`@somnia-chain/markets-sdk`), on-chain settlement layer, and documentation integrity, capturing 10 verified, reproducible defects with live on-chain transaction hashes.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DREAMDEX PERPS SENTINEL                         │
├──────────────────────────────────┬─────────────────────────────────────┤
│      Trading & Strategy Tier     │         Sentinel & Risk Tier        │
│  • Dynamic Arithmetic Grid       │  • MarginBank Collateral Health     │
│  • Bid/Ask Spread Maker          │  • Liquidation Distance Engine      │
│  • Multi-Tier Slippage Guards    │  • Unrealized / Realized PnL Watch  │
└─────────────────┬────────────────┴──────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Integration Layer: @somnia-chain/markets-sdk               │
│      Unified CCXT-Style Exchange Engine • Viem Contract Signers        │
└─────────────────┬───────────────────────────────────┬──────────────────┘
                  │                                   │
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌───────────────────────────────────┐
│     Off-Chain Matching Engine    │ │      Somnia Tokyo On-Chain        │
│  • Sub-10ms CLOB Orderbook       │ │  • MarginBank (0x4787...)         │
│  • GraphQL Indexer Streams       │ │  • Safe Smart Account (0x2d8B...) │
│  • OracleHub Price Feeds         │ │  • BTC/USDso Perp Pool (0x4181...) │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

---

## ✨ Key Features

- **Automated Grid Trading Engine:**
  - Automatically calculates grid bands (upper/lower bounds, step intervals, order sizing) around the live market mid-price.
  - Places alternating limit buy and sell orders to capture volatility spread with zero maker fees.
- **Margin & Solvency Sentinel:**
  - Actively polls `getAccountHealth` from the `MarginBank` contract.
  - Monitors Unlocked Margin vs. Locked Margin, Initial Margin (IM) requirements, and Maintenance Margin (MM) thresholds.
  - Enforces automatic position reduction or circuit breaks if margin ratio approaches liquidation levels.
- **Dual Execution Engine (Dry-Run vs. Live):**
  - **Dry-Run Mode (`DRY_RUN=true`):** Simulates order placement, fills, and balance updates offline with zero gas or capital risk.
  - **Live Mode (`DRY_RUN=false`):** Broadcasts real signed EVM transactions to Somnia Tokyo Testnet contracts.
- **Smart Account & EOA Dual Awareness:**
  - Verified routing patterns supporting both direct EOA accounts and Safe Smart Account proxies used by the DreamDEX Perps Arena UI.

---

## 📂 Project Structure

```text
├── feedback/                    # Standardized bug reports & automated reproduction scripts
│   ├── issue-01-loadmarkets-empty-addresses.md
│   ├── issue-02-createorder-missing-client-validation.md
│   ├── issue-03-watchorderbook-notconfigured-error.md
│   ├── issue-04-watchprice-pricefeed-notconfigured.md
│   ├── issue-05-fetchorderbook-unbounded-depth-revert.md
│   ├── issue-06-fetchticker-unhandled-typeerror.md
│   ├── issue-07-cancelorder-syntaxerror-invalid-id.md
│   ├── issue-08-smart-account-undocumented.md
│   ├── issue-09-fetchfundingratehistory-notconfigured.md
│   ├── issue-10-market-missing-limits-precision.md
│   ├── reproduce_all.js         # Single-command runner for all 10 issues
│   ├── phase2_smart_account.js  # Live on-chain Safe & MarginBank audit
│   ├── phase2_margin_invariants.js # Financial invariant math test suite
│   ├── phase2_concurrency_race.js  # 15-call burst concurrency stress test
│   ├── phase2_quick_wins.js     # Edge-case input fuzzing harness
│   └── phase2_docs_audit.js     # Documentation code snippet verification
├── src/
│   ├── config/                  # Network constants, pairs, grid parameters
│   ├── services/                # MarketService wrapper over SomniaMarkets SDK
│   ├── strategies/              # GridTradingEngine & Sentinel implementations
│   ├── utils/                   # Structured logger, math helpers
│   └── index.ts                 # CLI Entrypoint for agent execution
├── feedback-v1.md               # Comprehensive audit whitepaper & defect synthesis
├── hackathon_details.md         # Official bounty rules, submission format & resources
├── package.json
└── tsconfig.json
```

---

## 🛠️ Tech Stack & Network Specifications

| Parameter | Specification |
|:---|:---|
| **EVM Network** | Somnia Tokyo Testnet (Hideki: Chain ID `50383` / Shannon: `50312`) |
| **Native Gas Token** | `STT` (Somnia Test Token) |
| **Collateral Asset** | `USDso` (Paper USD on testnet) |
| **Perps Arena DEX** | [`https://app.testnet.dreamdex.io`](https://app.testnet.dreamdex.io) |
| **Block Explorer** | [`https://explorer.testnet.somnia.network/tokyo`](https://explorer.testnet.somnia.network/tokyo) |
| **Languages & Tools** | TypeScript, Node.js (v20+), Viem, `@somnia-chain/markets-sdk` |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18.x (v20 recommended)
- npm or pnpm

### 2. Installation
```bash
git clone <your-repo-url>
cd dreamdex-perps
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
# Somnia Tokyo Testnet RPC
RPC_URL=https://api.hideki2.infra.testnet.somnia.network
NETWORK_CHAIN_ID=50383

# Trader Signer Private Key (MetaMask EOA)
PRIVATE_KEY=0x...

# Trading Pair & Strategy Settings
TRADING_PAIR=BTC/USDso:USDso
DEFAULT_LEVERAGE=5
DRY_RUN=true

# Grid Parameters
GRID_LOWER_PRICE=60000
GRID_UPPER_PRICE=75000
GRID_LEVELS=10
ORDER_SIZE=0.001
```

### 4. Running the Agent

#### Step A: Verify Network & Contract Connectivity
```bash
npm run test:connection
```

#### Step B: Run in Dry-Run Simulation Mode (Zero Risk)
```bash
npm run dry-run
```

#### Step C: Run Live Trading on Somnia Tokyo Testnet
```bash
npm start
```

---

## 🔗 Live On-Chain Verification & Order Proofs

During live testing on **Somnia Tokyo Testnet**, real contract interactions and order executions were verified directly on the Somnia Block Explorer:

| Component | Identifier / Address | Verification Details |
|:---|:---|:---|
| **Live Verified Order** | [`0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3`](https://explorer.testnet.somnia.network/tokyo/tx/0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3) | BTC Long Perp order confirmed at Block `28555324` |
| **Perps Arena Smart Account** | [`0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8`](https://explorer.testnet.somnia.network/tokyo/address/0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8) | Safe Smart Account proxy holding 1,000 USDso margin |
| **Signer / Owner EOA** | [`0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`](https://explorer.testnet.somnia.network/tokyo/address/0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF) | Authenticated EOA wallet controller |
| **Tokyo MarginBank** | [`0x478769E1177C0773c43A593DCCc4Ad15F15F1394`](https://explorer.testnet.somnia.network/tokyo/address/0x478769E1177C0773c43A593DCCc4Ad15F15F1394) | Tokyo Testnet central collateral settlement contract |
| **BTC/USDso Perp Pool** | [`0x4181dd08E73BbCdd1Ba3E615A18f6abD941b94C0`](https://explorer.testnet.somnia.network/tokyo/address/0x4181dd08E73BbCdd1Ba3E615A18f6abD941b94C0) | CLOB trading pool contract for Bitcoin perpetuals |

---

## 🔬 The `feedback/` Directory & Defect Audit Harness

The [`feedback/`](feedback/) folder houses our complete submission for the **Feedback Track**. Rather than providing ad-hoc observations, our team engineered an automated quality assurance and parameter-fuzzing harness that systematically tested all layers of the dreamDEX perps stack:
1. **Client SDK Layer (`@somnia-chain/markets-sdk`):** Input sanitation, type boundaries, default network presets, and exception propagation.
2. **Off-Chain / Indexer Tier:** Real-time WebSocket subscriptions, GraphQL snapshot hydration, and fallback handling.
3. **On-Chain Settlement Tier (`MarginBank` & Safe):** Accounting invariants, equity solvency, collateral locking, and smart account transaction execution.
4. **Developer Experience & Documentation:** Precision standards, CCXT compatibility, and code snippet accuracy.

### Standardized Report Format
Every defect report in [`feedback/`](feedback/) strictly conforms to the hackathon specification:
- Title, Severity (`critical` / `major` / `normal`), and Area (`API` / `SDK` / `docs` / `app` / `contracts`).
- Step-by-step reproduction code (< 20 lines) that executes standalone.
- Precise Expected vs. Actual behavior breakdown.
- Concrete evidence (stack traces, JSON payloads, or on-chain transaction hashes).
- Exact environment specifications (SDK version, Somnia Tokyo testnet, wallet address).

---

## 📋 Comprehensive Defect Catalog

Our automated testing harness discovered and isolated **10 reproducible defects** across the SDK, documentation, and contract integration surfaces:

| Issue ID | Defect Title | Severity | Area | Reproduction Status |
|:---|:---|:---:|:---:|:---:|
| **[ISSUE-01](feedback/issue-01-loadmarkets-empty-addresses.md)** | `loadMarkets()` returns empty array `[]` on Somnia Testnet unless contract addresses are manually passed | **Critical** | SDK | ✅ 100% Reproducible |
| **[ISSUE-02](feedback/issue-02-createorder-missing-client-validation.md)** | `createOrder()` bypasses client validation for `type` & `side`, causing silent opposite-side trades or on-chain reverts | **Major** | SDK | ✅ 100% Reproducible |
| **[ISSUE-03](feedback/issue-03-watchorderbook-notconfigured-error.md)** | `watchOrderBook()` throws unhandled `NotConfiguredError` without on-chain polling fallback | **Major** | SDK | ✅ 100% Reproducible |
| **[ISSUE-04](feedback/issue-04-watchprice-pricefeed-notconfigured.md)** | `watchPrice()` throws `NotConfiguredError` requiring GraphQL price-feed without on-chain oracle fallback | **Major** | SDK | ✅ 100% Reproducible |
| **[ISSUE-05](feedback/issue-05-fetchorderbook-unbounded-depth-revert.md)** | `fetchOrderBook()` with large depth triggers unhandled on-chain `ContractRevertError` instead of client boundary check | **Normal** | SDK | ✅ 100% Reproducible |
| **[ISSUE-06](feedback/issue-06-fetchticker-unhandled-typeerror.md)** | `fetchTicker()` crashes with unhandled JavaScript `TypeError` on non-string inputs | **Normal** | SDK | ✅ 100% Reproducible |
| **[ISSUE-07](feedback/issue-07-cancelorder-syntaxerror-invalid-id.md)** | `cancelOrder()` crashes with unhandled `SyntaxError: Cannot convert to BigInt` on alphanumeric IDs | **Normal** | SDK | ✅ 100% Reproducible |
| **[ISSUE-08](feedback/issue-08-smart-account-undocumented.md)** | Undocumented Safe Smart Account architecture creates balance desync & order execution failure in SDK | **Major** | Docs / SDK | ✅ 100% Reproducible |
| **[ISSUE-09](feedback/issue-09-fetchfundingratehistory-notconfigured.md)** | `fetchFundingRateHistory()` throws unhandled `NotConfiguredError` without on-chain fallback | **Normal** | SDK | ✅ 100% Reproducible |
| **[ISSUE-10](feedback/issue-10-market-missing-limits-precision.md)** | `exchange.market()` omits `limits` and `precision` metadata violating CCXT standard interface | **Normal** | SDK | ✅ 100% Reproducible |

### Running the Automated Defect Verification Suite

You can execute all 10 reproduction proofs sequentially with a single command against the live testnet:

```bash
node feedback/reproduce_all.js
```

Additional dedicated test suites in `feedback/`:
```bash
# Verify live Safe Smart Account state & MarginBank equity on Tokyo Testnet
node feedback/phase2_smart_account.js

# Audit on-chain financial invariants (equity balance, funding cadence, liquidation formula)
node feedback/phase2_margin_invariants.js

# Execute 15-call concurrent burst testing CLOB matching engine stability
node feedback/phase2_concurrency_race.js

# Run input boundary fuzzing (zero price, negative amount, unknown symbols)
node feedback/phase2_quick_wins.js

# Audit official documentation code snippets & type contracts
node feedback/phase2_docs_audit.js
```

---

## 📢 X Posts

Links to our official posts on X documenting project development, testnet order execution, and technical findings (tagging `@DreamDEXSomnia`):

- **Post 1 (Architecture & Strategy Showcase):** [Link to X Post 1](https://x.com/your_handle/status/...)
- **Post 2 (Live Tokyo Testnet Execution & Explorer Proof):** [Link to X Post 2](https://x.com/your_handle/status/...)
- **Post 3 (SDK Stress-Testing & Technical Findings):** [Link to X Post 3](https://x.com/your_handle/status/...)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
