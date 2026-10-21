# 🛡️ dreamDEX Perps: QA, Fuzzing & SDK Defect Audit Suite

> Institutional-grade Security, Reliability & Developer Experience (DX) Audit Suite for **dreamDEX Perpetuals** on **Somnia Tokyo / Shannon Testnet** (Chain ID: `50312`).  
> Purpose-built for the **dreamDEX Perps Builder Bounty — Feedback Track**.

[![Somnia Network](https://img.shields.io/badge/Network-Somnia_Tokyo_Testnet_(50312)-blue.svg)](https://shannon-explorer.somnia.network)
[![dreamDEX](https://img.shields.io/badge/DEX-dreamDEX_Perps-purple.svg)](https://app.testnet.dreamdex.io)
[![Bounty Track](https://img.shields.io/badge/Bounty-Feedback_Track_($1,500)-gold.svg)](hackathon_details.md)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_5.x-blue.svg)](https://www.typescriptlang.org)
[![Core SDK](https://img.shields.io/badge/SDK-%40somnia--chain%2Fmarkets--sdk@0.32.1-orange.svg)](https://www.npmjs.com/package/@somnia-chain/markets-sdk)
[![Verification Status](https://img.shields.io/badge/Reproducibility-15%2F15_Verified_(100%25)-brightgreen.svg)](#-quick-start-for-bounty-judges)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Executive Summary

This repository contains the comprehensive defect audit and fuzzing suite for the **dreamDEX Perps Builder Bounty (Feedback Track)**.

Rather than submitting superficial documentation feedback or speculative notes, our team engineered an end-to-end testing harness that systematically attacks all tiers of the decentralized perpetual exchange stack:
1. **Client SDK Tier (`@somnia-chain/markets-sdk`):** Type coercion, boundary values, silent exceptions, CCXT standard adherence, and input sanitization.
2. **Matching Engine & Indexer Tier:** WebSocket connectivity, Hasura GraphQL feeds, and network drop recovery.
3. **On-Chain Settlement Tier (`MarginBank` & `LinkedWalletRegistry`):** Collateral math, non-custodial bot delegation ("Link a Bot"), margin isolation, and leverage boundary reverts.

Every issue reported is backed by **100% deterministic reproduction code (< 20 lines)**, exact error callstacks, root-cause source code analysis, and **live on-chain transaction hashes** confirmed on the Somnia Shannon Testnet explorer.

> [!TIP]
> **For Lead Architects & Core Reviewers:**  
> In addition to the individual issue files below, we have compiled the [**Master Defect & Architectural Synthesis Report (AUDIT_SYNTHESIS_REPORT.md)**](feedback/AUDIT_SYNTHESIS_REPORT.md). It groups all 15 findings into 4 foundational root-cause categories (Client Guardrail Vacuum, CCXT Divergence, Off-Chain Stream Outages, and Protocol Boundaries) and outlines actionable architectural recommendations for the dreamDEX and Somnia engineering teams.

---

## ⚖️ Bounty Evaluation Alignment

According to the official [hackathon_details.md](hackathon_details.md), submissions are evaluated strictly on four criteria:

| Evaluation Criterion | Implementation in this Repository |
|:---|:---|
| **Severity** | Clear categorization into **Critical** ($40), **Major** ($40), and **Normal** ($15), prioritizing issues that crash runtimes, burn trader gas, or lock margin. |
| **Clarity** | Standardized bug report structure with concise titles, step-by-step reproduction instructions, and clear Expected vs. Actual behavior comparisons. |
| **Reproducibility** | Every issue can be reproduced with a single command or by copy-pasting its minimal script into a blank `reproduce.js` without private credentials. |
| **Product & DX Usefulness** | High-impact feedback directly resolving architectural barriers for algorithmic bots, CCXT developers, and traders on dreamDEX. |

---

## ⚡ Quick Start for Bounty Judges

Judges can verify all 15 issues on a clean machine without any prior setup or `.env` configuration.

### 1. Clone & Install
```bash
git clone <repo-url>
cd "dreamDEX Perps"
npm install
```

### 2. Verify All Issues via Judge Simulator (Zero Configuration Required)
This command runs each issue's markdown reproduction script in an **isolated Node.js sub-process**, exactly simulating a judge copy-pasting the snippets from `feedback/issue-*.md`:
```bash
npm run test:judge
```
*Expected Output:*
```text
========================================================================
⚖️  DREAMDEX BOUNTY: JUDGE CLONE & REPRODUCTION SIMULATION
    Verifying copy-paste reproducibility for all issues in feedback/
========================================================================

Evaluating issue-01-loadmarkets-empty-addresses.md                           ... ✅ REPRODUCED
Evaluating issue-02-createorder-missing-client-validation.md                 ... ✅ REPRODUCED
Evaluating issue-03-watchorderbook-notconfigured-error.md                    ... ✅ REPRODUCED
Evaluating issue-04-watchprice-pricefeed-notconfigured.md                    ... ✅ REPRODUCED
Evaluating issue-05-fetchorderbook-unbounded-depth-revert.md                 ... ✅ REPRODUCED
Evaluating issue-06-fetchticker-unhandled-typeerror.md                       ... ✅ REPRODUCED
Evaluating issue-07-cancelorder-syntaxerror-invalid-id.md                    ... ✅ REPRODUCED
Evaluating issue-08-smart-account-undocumented.md                            ... ✅ REPRODUCED
Evaluating issue-09-fetchfundingratehistory-notconfigured.md                 ... ✅ REPRODUCED
Evaluating issue-10-market-missing-limits-precision.md                       ... ✅ REPRODUCED
Evaluating issue-11-linked-wallet-bot-delegation-validation.md               ... ✅ REPRODUCED
Evaluating issue-12-setperpleverage-missing-ccxt-facade-and-boundary-reverts.md ... ✅ REPRODUCED
Evaluating issue-13-loadmarkets-swallows-rpc-errors.md                       ... ✅ REPRODUCED
Evaluating issue-14-withdrawmargin-missing-client-validation.md              ... ✅ REPRODUCED
Evaluating issue-15-createstoporder-blocks-perp-markets.md                   ... ✅ REPRODUCED

========================================================================
🎯 SIMULATION RESULT: 15 / 15 ISSUES VERIFIED 100% REPRODUCIBLE!
========================================================================
```

### 3. Run Live Testnet Suite
To execute the live verification suite connecting to Somnia Tokyo / Shannon Testnet:
```bash
npm run test:feedback
```

---

## 📋 Complete Defect Catalog (15 Verified Issues)

All individual markdown reports are stored in [`feedback/`](feedback/) adhering to the official bounty template:

| Issue ID | Defect Title | Severity | Area | Live Reproduction Status |
|:---:|:---|:---:|:---:|:---:|
| **[ISSUE-01](feedback/issue-01-loadmarkets-empty-addresses.md)** | `loadMarkets()` returns empty array `[]` on Somnia Testnet unless addresses are manually supplied | **Critical** | SDK | [Verify Code](feedback/issue-01-loadmarkets-empty-addresses.md#steps-to-reproduce) |
| **[ISSUE-02](feedback/issue-02-createorder-missing-client-validation.md)** | `createOrder()` fails to validate `type` and `side`, silently coercing Long to Short or burning gas on revert | **Major** | SDK | [Verify Code](feedback/issue-02-createorder-missing-client-validation.md#steps-to-reproduce) |
| **[ISSUE-03](feedback/issue-03-watchorderbook-notconfigured-error.md)** | `watchOrderBook()` throws unhandled `NotConfiguredError` without on-chain polling fallback | **Major** | SDK | [Verify Code](feedback/issue-03-watchorderbook-notconfigured-error.md#steps-to-reproduce) |
| **[ISSUE-04](feedback/issue-04-watchprice-pricefeed-notconfigured.md)** | `watchPrice()` throws `NotConfiguredError` even with docs setup, lacking on-chain oracle fallback | **Major** | SDK | [Verify Code](feedback/issue-04-watchprice-pricefeed-notconfigured.md#steps-to-reproduce) |
| **[ISSUE-05](feedback/issue-05-fetchorderbook-unbounded-depth-revert.md)** | `fetchOrderBook()` with large depth triggers unhandled on-chain `ContractRevertError` | **Normal** | SDK | [Verify Code](feedback/issue-05-fetchorderbook-unbounded-depth-revert.md#steps-to-reproduce) |
| **[ISSUE-06](feedback/issue-06-fetchticker-unhandled-typeerror.md)** | `fetchTicker()` crashes runtime with raw JavaScript `TypeError` on non-string inputs | **Normal** | SDK | [Verify Code](feedback/issue-06-fetchticker-unhandled-typeerror.md#steps-to-reproduce) |
| **[ISSUE-07](feedback/issue-07-cancelorder-syntaxerror-invalid-id.md)** | `cancelOrder()` crashes with unhandled `SyntaxError` on alphanumeric order IDs | **Normal** | SDK | [Verify Code](feedback/issue-07-cancelorder-syntaxerror-invalid-id.md#steps-to-reproduce) |
| **[ISSUE-08](feedback/issue-08-smart-account-undocumented.md)** | Undocumented Safe Smart Account architecture creates balance desync & order execution failure | **Major** | Docs / SDK | [Verify Code](feedback/issue-08-smart-account-undocumented.md#steps-to-reproduce) |
| **[ISSUE-09](feedback/issue-09-fetchfundingratehistory-notconfigured.md)** | `fetchFundingRateHistory()` throws unhandled `NotConfiguredError` without on-chain fallback | **Normal** | SDK | [Verify Code](feedback/issue-09-fetchfundingratehistory-notconfigured.md#steps-to-reproduce) |
| **[ISSUE-10](feedback/issue-10-market-missing-limits-precision.md)** | `exchange.market()` omits `limits` and `precision` metadata violating CCXT standard interface | **Normal** | SDK | [Verify Code](feedback/issue-10-market-missing-limits-precision.md#steps-to-reproduce) |
| **[ISSUE-11](feedback/issue-11-linked-wallet-bot-delegation-validation.md)** | `proposePerpWalletLink` bypasses client validation on self/zero addresses, burning gas on EVM revert | **Major** | SDK | [Verify Code](feedback/issue-11-linked-wallet-bot-delegation-validation.md#steps-to-reproduce) |
| **[ISSUE-12](feedback/issue-12-setperpleverage-missing-ccxt-facade-and-boundary-reverts.md)** | `SomniaMarkets` omits CCXT `setLeverage()`, and `setPerpLeverage()` causes on-chain EVM reverts on boundary inputs | **Major** | SDK | [Verify Code](feedback/issue-12-setperpleverage-missing-ccxt-facade-and-boundary-reverts.md#steps-to-reproduce) |
| **[ISSUE-13](feedback/issue-13-loadmarkets-swallows-rpc-errors.md)** | `loadMarkets()` swallows RPC network errors & timeouts, falsely returning success and crashing downstream | **Major** | SDK | [Verify Code](feedback/issue-13-loadmarkets-swallows-rpc-errors.md#steps-to-reproduce) |
| **[ISSUE-14](feedback/issue-14-withdrawmargin-missing-client-validation.md)** | `withdrawMargin()` fails to validate amount on client, broadcasting invalid calls that cause on-chain EVM reverts | **Major** | SDK | [Verify Code](feedback/issue-14-withdrawmargin-missing-client-validation.md#steps-to-reproduce) |
| **[ISSUE-15](feedback/issue-15-createstoporder-blocks-perp-markets.md)** | `SomniaMarkets.createStopOrder()` hardcodes block against PERP markets despite active on-chain stopRegistry contracts | **Major** | SDK | [Verify Code](feedback/issue-15-createstoporder-blocks-perp-markets.md#steps-to-reproduce) |

---

## 🔗 Live On-Chain Verification & Transaction Evidence

All on-chain findings were executed and confirmed on **Somnia Tokyo / Shannon Testnet (Chain ID: 50312)**. You can view the live receipts directly on the block explorer:

| Action / Verification | Target Contract | Transaction Hash | Block | Status |
|:---|:---|:---|:---:|:---:|
| **Live Leverage Configuration** | `MarginBank` (`0xdd4A...5C4E`) | [`0xcc7a891262e5bcc1098be1ac7fb725d2f3ff37323e5f018a4f4c02ff4abb3309`](https://shannon-explorer.somnia.network/tx/0xcc7a891262e5bcc1098be1ac7fb725d2f3ff37323e5f018a4f4c02ff4abb3309) | `520125533` | Confirmed |
| **Bot Link Delegation Proposal** | `LinkedWalletRegistry` (`0xe125...8E70`) | [`0xb2d644789db3929cb5f485f2894624dbf7da5dcdc5bc2f752b98c0beb52f6c0e`](https://shannon-explorer.somnia.network/tx/0xb2d644789db3929cb5f485f2894624dbf7da5dcdc5bc2f752b98c0beb52f6c0e) | `520126543` | Confirmed |
| **Cancel Bot Link Proposal** | `LinkedWalletRegistry` (`0xe125...8E70`) | [`0xffe9e181b1fe8d6e79f5c9cfecc847a7e7eff8d096de0ac3e31333b809ceff2e`](https://shannon-explorer.somnia.network/tx/0xffe9e181b1fe8d6e79f5c9cfecc847a7e7eff8d096de0ac3e31333b809ceff2e) | `520127000` | Confirmed |
| **Safe Smart Account Order** | `Safe Proxy` (`0x2d8B...cAe8`) | [`0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3`](https://shannon-explorer.somnia.network/tx/0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3) | `28555324` | Confirmed |

---

## 🔬 Specialized Audit Suites in `feedback/scripts/`

In addition to individual reproduction scripts, we provide automated test suites targeting specific architectural layers:

```bash
# 1. End-to-End Judge Simulation (Process-isolated copy-paste verification)
npm run test:judge

# 2. Complete 13-Issue Suite on Live Testnet
npm run test:feedback

# 3. Non-Custodial Bot Delegation & Perpetual Leverage Audit
node feedback/scripts/phase3_bot_delegation_leverage.js

# 4. Financial Invariant Verification (Margin Solvency, Cadence & Liquidation Math)
node feedback/scripts/phase2_margin_invariants.js

# 5. Safe Smart Account Architecture & MarginBank Routing Verification
node feedback/scripts/phase2_smart_account.js

# 6. CLOB Engine 15-Call Concurrency & Race-Condition Burst Stress Test
node feedback/scripts/phase2_concurrency_race.js

# 7. Documentation Snippet & TypeScript Type Contract Verification
node feedback/scripts/phase2_docs_audit.js

# 8. Boundary Fuzzing (Zero Price, Negative Amounts, Lot/Tick Sizes)
node feedback/scripts/phase2_quick_wins.js
```

---

## 🛠️ Environment & References

| Parameter | Value |
|:---|:---|
| **EVM Chain ID** | `50312` (Somnia Tokyo / Shannon Testnet) |
| **HTTP RPC** | `https://dream-rpc.somnia.network` |
| **WebSocket RPC** | `wss://api.infra.testnet.somnia.network/ws` |
| **Block Explorer** | [`https://shannon-explorer.somnia.network`](https://shannon-explorer.somnia.network) |
| **SDK Version** | `@somnia-chain/markets-sdk@0.32.1` |
| **Node.js Target** | `>= 18.x` (v20.x verified) |
| **MarginBank Contract** | `0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E` |
| **LinkedWalletRegistry** | `0xe125E91c3404046e748A43A1a36B5D514DAD8E70` |

---

## 📄 License

This audit harness and defect report catalog are released under the [MIT License](LICENSE).
