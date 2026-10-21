# SomniaMarkets.createStopOrder() hardcodes block against PERP markets despite active on-chain stopRegistry contracts

Severity: major
Area: SDK

## Steps to reproduce
1. Initialize `SomniaMarkets` with testnet credentials on Somnia Shannon Testnet (Chain ID 50312).
2. Execute the following minimal reproduction script:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: process.env.PRIVATE_KEY || "0x0123456789012345678901234567890123456789012345678901234567890123"
  });
  await exchange.loadMarkets();

  // Attempt to place a stop-loss order on perpetual market
  try {
    await exchange.createStopOrder('WBTC/USDso:USDso', 'limit', 'sell', 0.001, 70000, 69000);
  } catch (err) {
    console.log("Caught:", err.name, "-", err.message);
  }
  await exchange.close();
}
reproduce();
```
3. Run with `node reproduce.js`.

## Expected
1. According to DreamDEX documentation, stop-loss and take-profit orders are core risk management mechanisms for perpetual futures trading.
2. Because the on-chain perpetual pool on Somnia Testnet (`WBTC/USDso:USDso`) has an active and initialized `stopRegistry` (`0x8e81a111b9347ef1f775a570c802c78fda9a4793`), and the lower-level SDK provides full perp stop functionality in `node_modules/@somnia-chain/markets-sdk/dist/perp/stops.js` (`createPerpStopOrder`), the unified `SomniaMarkets.prototype.createStopOrder` facade should route perpetual stop orders to the deployed perp stop registry.

## Actual
1. `requireStopVenue(ref)` in `node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js` hardcodes an explicit rejection for any market that is not `SPOT`:
```javascript
requireStopVenue(ref) {
    const t = this.market(ref);
    if (t.market.marketType !== "SPOT") {
        throw new InvalidInputError(`stop orders are not available on ${t.market.marketType} markets yet`);
    }
    const registry = t.market.stopRegistry;
    if (!registry) {
        throw new InvalidInputError(`${t.symbol} has no stop-order registry`);
    }
    return { t, registry };
}
```
2. Any call to `exchange.createStopOrder` on a perpetual market immediately throws:
```text
InvalidInputError: @somnia-chain/markets-sdk: stop orders are not available on PERP markets yet
```
3. This completely prevents algorithmic bots and CCXT traders from utilizing native stop-loss / take-profit risk management on perpetual positions through the unified SDK facade, despite the underlying smart contracts and lower-level perp modules being fully deployed and available.

## Evidence
- Terminal Execution Output:
```text
Caught: InvalidInputError - @somnia-chain/markets-sdk: stop orders are not available on PERP markets yet
```
- On-Chain Deployed Stop Registry for `WBTC/USDso:USDso`:
```text
Market Type: PERP
Pool Address: 0x3892a5179f8ea0c810c45d1630546c0317b0e5b6
stopRegistry: 0x8e81a111b9347ef1f775a570c802c78fda9a4793
```
- Source Code Reference: `node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js` line ~4400.

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Target Market: `WBTC/USDso:USDso` (PERP)
- Stop Registry Address: `0x8e81a111b9347ef1f775a570c802c78fda9a4793`
- Node.js version: v20.19.0
