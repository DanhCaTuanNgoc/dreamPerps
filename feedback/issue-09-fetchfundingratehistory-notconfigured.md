# fetchFundingRateHistory() throws unhandled NotConfiguredError without on-chain fallback

Severity: normal
Area: SDK

## Steps to reproduce
1. Run the following script against Somnia Tokyo Testnet:
```javascript
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  // Attempt to fetch historical funding rates
  await exchange.fetchFundingRateHistory('BTC/USDso:USDso');
}
reproduce();
```

## Expected
The SDK should either:
1. Provide an on-chain fallback reading past funding update events from the perp pool contract, OR
2. Clearly catch missing indexer configuration and throw `NotSupported` / `ExchangeError` with actionable developer instructions rather than crashing with an unhandled `NotConfiguredError`.

## Actual
Node.js throws an unhandled `NotConfiguredError`:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this indexer read (FundingRateHistory) — needs config.indexerUrl — the graph indexer endpoint for chain 50383
```

## Evidence
- Stack trace:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this indexer read (FundingRateHistory) — needs config.indexerUrl
    at SomniaMarkets.requireIndexer (node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js:745:15)
    at SomniaMarkets.fetchFundingRateHistory (node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js:2032:12)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Hideki Testnet (Chain ID: `50383`)
- Node.js version: v20.x
