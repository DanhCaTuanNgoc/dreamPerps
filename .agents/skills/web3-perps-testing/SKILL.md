---
name: web3-perps-testing
description: >-
  Elite Web3 & Blockchain testing methodology and automated runbook for Perpetual DEXes
  (dreamDEX CLOB, Somnia Tokyo Testnet). Specializes in SDK/API parameter fuzzing,
  race condition testing, financial invariant verification (margin, liquidation, funding),
  WebSocket-REST desync detection, and generating reproducible bug reports for the dreamDEX Perps Builder Bounty.
---

# Web3 Perps Testing: Elite QA, Fuzzing & Bug Hunting Runbook

This skill equips autonomous agents and developers with institutional-grade Web3 testing methodologies tailored specifically for decentralized perpetual exchanges (Perp DEXes), Central Limit Order Books (CLOB), and EVM smart contracts.

It is purpose-built to dominate the **dreamDEX Perps Builder Bounty** on **Somnia Tokyo Testnet (Chain ID: 50312)**:
1. **Feedback Track ($1,500 Pool - First-Come First-Served):** Rapidly uncover and generate self-contained, reproducible reports for Critical/Major bugs ($40) and Normal/Docs bugs ($15) in `feedback/issue-*.md`.
2. **MVP Track (3 x $500):** Harden trading bots and reactive agents against network latency, liquidation cascades, RPC failures, and order state desynchronization.

---

## 1. The 5-Layer Web3 Testing Architecture

Unlike traditional Web2 API testing, Web3 Perp testing requires navigating three distinct state layers:
- **Client Tier:** TypeScript/Node.js SDK (`@somnia-chain/markets-sdk`), input sanitization, Type definitions vs runtime behavior.
- **Engine Tier (Off-chain / Sub-10ms CLOB):** Matching engine, WebSocket feeds, REST order gateways, rate limits, and sequencers.
- **Settlement Tier (On-chain EVM):** `MarginBank` contract, Pyth/EMA oracles, collateral solvency, and liquidation keepers.

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Client SDK Fuzzing (Boundary values, NaN, Type drift)    │
└──────────────────────────────┬──────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Off-chain Engine Stress (CLOB Concurrency, Race, WS vs REST)│
└──────────────────────────────┬──────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Financial Invariant Testing (Margin, Leverage, Funding)  │
└──────────────────────────────┬──────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. EVM & Network Idiosyncrasies (Somnia TPS, Gas, Reorgs)   │
└──────────────────────────────┬──────────────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Automated Bug Capture & Standardized Markdown Reporting   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Testing Runbooks & High-Yield Vectors

### Vector A: SDK Parameter Fuzzing & Type Drift (Target: $15 - $40 Bugs)
Developers often trust TypeScript definitions and assume the SDK validates inputs before hitting the network or contracts. Fuzzing boundary values exposes unhandled exceptions and silent crashes.

#### 1. Fuzzing Matrix
Test every public method of `SomniaMarkets` with the following edge cases:
- **Numbers (Amount, Price, Leverage, Limit):**
  - Negative values: `-1`, `-0.000000001`
  - Zero: `0`, `0.0`
  - Non-numbers: `NaN`, `Infinity`, `-Infinity`, `"five"` (type casting bugs)
  - Sub-lot sizes: Below market lot size (e.g. `< 0.00001` for WBTC)
  - Extreme precision: `1e-18`, `1e-28`, `Number.MAX_SAFE_INTEGER + 1`, `2^256 - 1`
  - Tick-size violations: Non-multiples of `tickSize` (e.g., placing price with 5 decimals when tick is 2)
- **Strings (Symbols, Order Types, Sides):**
  - Malformed symbols: `""`, `"INVALID"`, `"BTC/USD"` (missing collateral suffix), `123 as any`, `null`, `undefined`
  - Illegal enums: `side: "long"` (should be `"buy"`), `type: "market_order"` (should be `"market"`)
- **Depth & Pagination:**
  - `fetchOrderBook(symbol, depth)`: Test depth with `-1`, `0`, `99999999` (triggers unhandled `ContractRevertError` instead of client error), `NaN`.

#### 2. Detection Criteria
- **Bug (Major):** Method crashes the Node.js runtime with raw uncaught `TypeError` (e.g. `symbol.indexOf is not a function` when passed a number/null) instead of throwing `InvalidInputError`.
- **Bug (Major):** Method bypasses client validation and sends invalid parameters to smart contract, causing an uninformative `ContractRevertError` (e.g. `getBookLevels reverted`).
- **Bug (Critical):** Method returns empty array or success silently when discovery/initialization fails (e.g., `loadMarkets()` returning `[]` without error when `addresses` is omitted).

---

### Vector B: CLOB Concurrency & Race Condition Stress (Target: $40 Bugs)
The dreamDEX matching engine provides sub-10ms matching. High-frequency race conditions frequently reveal race bugs in state synchronizers.

#### 1. The Burst Concurrency Test Pattern
Send $N$ concurrent actions in the exact same millisecond:
```typescript
// Pattern: Simultaneous Cancel + Place Burst
async function stressRaceCondition(exchange: SomniaMarkets, symbol: string) {
  const activeOrders = await exchange.fetchOpenOrders(symbol);
  
  // Fire concurrent cancels and new limit orders simultaneously
  const burst = [
    ...activeOrders.map(o => exchange.cancelOrder(o.id, symbol)),
    exchange.createOrder(symbol, 'limit', 'buy', 0.001, 80000),
    exchange.createOrder(symbol, 'limit', 'sell', 0.001, 82000),
    exchange.createOrder(symbol, 'limit', 'buy', 0.001, 80100)
  ];

  const results = await Promise.allSettled(burst);
  // Analyze for:
  // 1. HTTP 500 / Internal Engine Crash
  // 2. Orphan orders (Order confirmed on-chain but dropped from engine cache)
  // 3. Double-spent free margin
}
```

#### 2. Key Anomalies to Flag
- **Double Margin Allocation:** If two simultaneous orders succeed when available margin only supports one.
- **Orphan Order State:** Order canceled on contract but still streamed as active over WebSocket.
- **Nonce Gaps:** When concurrent transaction dispatch causes `Nonce too low` or EVM transaction stalls.

---

### Vector C: WebSocket vs REST State Desynchronization (Target: $15 - $40 Bugs)
Real-time trading agents rely on WebSocket streams (`watchOrderBook`, `watchPositions`, `watchPrice`). Any latency gap or data inconsistency creates arbitrage exploitation or liquidation failures.

#### 1. Verification Protocol
1. Subscribe to `watchOrderBook(symbol)` and stream live bids/asks.
2. In parallel, poll `fetchOrderBook(symbol)` via REST every 500ms.
3. Compare:
   - **Sequence Numbers:** Are messages monotonically increasing? Are ticks skipped?
   - **Spread & Mid-Price:** Does REST return a newer or older snapshot than WS?
   - **Reconnection Hydration:** Kill the WebSocket connection abruptly (simulate network disconnect). Verify if re-subscription drops orderbook state or duplicates fills.

---

### Vector D: On-chain Financial Invariants & Margin Math (Target: $40 Bugs)
Perpetuals rely on deterministic accounting invariants. Any violation of these formulas indicates a vulnerability.

#### Core Financial Invariants
1. **Collateral Balance Invariant:**
   $$\text{Total Margin} = \text{Free Margin} + \text{Initial Margin (Used)} + \text{Unrealized PnL}$$
   - Verify that $\text{Free Margin}$ never becomes negative.
   - Verify that closing a position immediately unlocks $\text{Initial Margin} \pm \text{Realized PnL} - \text{Trading Fees}$.

2. **Liquidation Boundary Invariant:**
   $$\text{Margin Ratio} = \frac{\text{Equity}}{\text{Position Value}} \ge \text{Maintenance Margin Ratio (MMR)}$$
   - Open a position with maximum leverage ($20\times$).
   - Monitor the precise price tick where liquidation or margin call event emits.
   - Does liquidation trigger early (unfair to trader) or late (bad debt for the protocol)?

3. **Funding Rate Settlement Invariant:**
   - Verify that funding paid by longs strictly equals funding received by shorts (minus protocol fee haircut).
   - Check timestamp alignment: Are funding payments processed exactly at the 1-hour / 8-hour intervals?

---

### Vector E: Automated Documentation & DX Snippet Verification (Target: $15 Bugs)
Documentation bugs are the fastest way to claim $15 rewards.

#### Verification Protocol
1. Extract all code examples from:
   - `https://app.testnet.dreamdex.io/docs/developers/perps-testnet`
   - `https://github.com/somnia-chain/dreamdex-bot-kit`
   - Somnia Markets SDK README and TypeScript docs.
2. Run each snippet in a sandbox script (`test-snippet-XX.ts`).
3. Flag:
   - Outdated imports (e.g. importing a function that was moved or removed).
   - Missing required parameters in constructors or function calls.
   - Broken links or undocumented error codes.
   - Inaccurate return types (e.g. docs state returns `Promise<string>`, but runtime returns `Promise<object>`).

---

## 3. Real On-Chain & Live Data Testing Runbook (End-to-End Workflow)

To produce feedback reports that are **100% concrete, unambiguous, and undeniable to bounty judges**, testing must progress from offline script assertions to **real testnet execution with live transactions**.

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Real Wallet Setup & Live Funding                              │
│ • Faucet STT (Gas) via Somnia Faucet                                   │
│ • Faucet USDso (Margin) via Perps Arena / Discord Bounty Ticket        │
│ • Bind real PRIVATE_KEY in .env (never dummy 0x0123...)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Live Lifecycle Execution & TxHash Capture                     │
│ 1. depositMargin()   → Capture on-chain TxHash & verify MarginBank     │
│ 2. createOrder()     → Capture on-chain TxHash & verify OrderBook      │
│ 3. cancelOrder()     → Capture on-chain TxHash & verify Margin release │
│ 4. withdrawMargin()  → Capture on-chain TxHash & verify wallet balance │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Cross-Layer Verification (SDK vs Web UI vs Explorer)          │
│ • Compare SDK fetchBalance() vs Web UI app.testnet.dreamdex.io         │
│ • Compare SDK fetchPositions() vs On-chain Position Struct             │
│ • Detect state desync, cache lag, or balance freezing                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Compiling Zero-Ambiguity Feedback Reports                     │
│ • Attach live TxHash link on Somnia Explorer                           │
│ • Attach exact wallet address & full JSON payload                      │
│ • Include standalone <20-line reproduce.js script                      │
└────────────────────────────────────────────────────────────────────────┘
```

### Detailed Execution Steps with Real Data

#### Step 1: On-Chain Margin Lifecycle Verification
1. Call `exchange.depositMargin(symbol, amount)` with real `USDso`.
2. Inspect the returned transaction hash on [Somnia Explorer](https://shannon-explorer.somnia.network/tx/`0x...`).
3. Verify event `MarginDeposited(trader, token, amount)` emitted by `MarginBank` contract (`0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E`).
4. Immediately query `exchange.fetchBalance()` and compare with `app.testnet.dreamdex.io`.
   - **Flag as Bug:** If the deposit succeeds on-chain but `fetchBalance()` remains 0 or takes > 30 seconds to reflect.
5. Attempt partial withdrawal `exchange.withdrawMargin(symbol, partialAmount)` and verify `Free Margin` recalculation.

#### Step 2: Live Order Placement, OrderBook Sync & Cancellation
1. Fetch live market price via `exchange.fetchTicker(symbol)`.
2. Place a deep Limit Order (e.g. 10% below market price):
   ```typescript
   const order = await exchange.createOrder(symbol, 'limit', 'buy', 0.001, limitPrice);
   console.log("Placed TxHash:", order.id || order.txHash);
   ```
3. Query `exchange.fetchOpenOrders(symbol)` and `exchange.fetchOrderBook(symbol)`.
   - **Flag as Bug:** If the transaction confirmed on-chain but the order does not appear in `fetchOpenOrders` within 3 blocks.
4. Call `exchange.cancelOrder(order.id, symbol)`.
   - **Flag as Bug:** If the cancel transaction succeeds, but `lockedMargin` is not immediately restored to `freeMargin`, preventing subsequent orders.

#### Step 3: High-Leverage Solvency & Liquidation Boundaries
1. Open a position using high leverage ($10\times - 20\times$) using testnet funds.
2. Query `exchange.fetchPositions([symbol])` and extract:
   - `entryPrice`, `liquidationPrice`, `leverage`, `marginRatio`, `unrealizedPnL`.
3. Compare the SDK's calculated `liquidationPrice` against the on-chain margin formula in `Perps on testnet for traders`:
   $$\text{Liquidation Price (Long)} = \text{Entry Price} \times \left(1 - \frac{1}{\text{Leverage}} + \text{Maintenance Margin Ratio}\right)$$
   - **Flag as Bug ($40 Major/Critical):** Any discrepancy between SDK local calculation and on-chain liquidation trigger price.

#### Step 4: Real Funding Rate Settlement Verification
1. Keep a live perpetual position open across a funding epoch boundary (hourly / 8-hour cycle).
2. Call `exchange.fetchFundingRate(symbol)` and record `fundingRate`, `nextFundingAt`, `cumulativeFundingPerUnit`.
3. Check the trader's on-chain balance after funding settlement:
   - **Flag as Bug:** If funding deduction/credit does not match `Position Size * Funding Rate`, or if settlement timestamps drift from the documented cadence.

---

## 4. Bug Reporting Protocol (Format Required by Bounty Judges)

Every reported issue must strictly follow the hackathon specification in `feedback/issue-<id>-<slug>.md`:

```markdown
# [Short Title Describing the Defect]

Severity: critical | major | normal
Area: API | SDK | docs | app | contracts

## Steps to reproduce
1. Initialize the SDK with...
2. Execute the following reproduction code:
```javascript
// Minimal reproducible example (< 20 lines)
```
3. Run with `node reproduce.js`

## Expected
[Clear description of the compliant behavior according to specifications/standards]

## Actual
[Exact observed behavior, error stack trace, or silent failure]

## Evidence
- Terminal output / Logs:
```text
[Paste exact error logs / stack traces]
```
- Transaction hash (if on-chain): `0x...`
- Request/Response payload (if API/WS): `{ ... }`

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo Testnet (Chain ID: 50312)
- Node.js version: v20.x
- Wallet address: `0x...`
```

> [!CAUTION]
> **Found a critical security vulnerability or direct fund-draining exploit?**
> DO NOT commit it to the public repository. Send it privately to `security@dreamdex.io` as specified in hackathon rules.

---

## 5. Somnia Tokyo Testnet Environment Specifications

| Parameter | Value |
|---|---|
| **Chain ID** | `50312` |
| **Network Name** | Somnia Tokyo / Shannon Testnet |
| **Native Gas Token** | `STT` (Somnia Test Token) |
| **Collateral Token** | `USDso` (Paper USD on testnet) |
| **HTTP RPC 1** | `https://dream-rpc.somnia.network` |
| **HTTP RPC 2** | `https://api.infra.testnet.somnia.network` |
| **WebSocket RPC** | `wss://api.infra.testnet.somnia.network/ws` |
| **Block Explorer** | `https://shannon-explorer.somnia.network` |
| **SDK Package** | `@somnia-chain/markets-sdk` |
| **Max Leverage** | `20x` |

---

## 6. Dual-Wallet Architecture for Testing

To optimize performance across both bounty tracks without account contamination:

1. **Wallet 1: Arena MVP Wallet (`0x...`)**
   - Linked to Perps Arena (`app.testnet.dreamdex.io`).
   - Receives weekly testnet `USDso`.
   - Used **only** for disciplined algorithmic trading (Grid / Sentinel) to build a clean PnL record, demo transactions, and evidence for MVP Track.
2. **Wallet 2: Stress-Test & Fuzzing Wallet (`0x...`)**
   - Funded by requesting extra `USDso` in the dreamDEX Discord / Telegram.
   - Used for aggressive parameter fuzzing, high-frequency bursts, edge-case leverage, and liquidation tests.
   - **Strict Rule:** Never transfer bounty `USDso` into the Arena wallet (strictly monitored and forbidden by hackathon rules).

---

## 7. Testing Automation Commands

Run the existing testing suites in the workspace:

```bash
# Run SDK parameter fuzzing & boundary test
npx tsx src/scripts/fuzzTest.ts

# Test network connectivity & address discovery
npm run test:connection

# Run trading bot in dry-run mode (zero capital risk)
npm run dry-run

# Run full project build to catch TypeScript type errors
npm run build
```
