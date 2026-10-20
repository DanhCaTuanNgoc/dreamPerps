# watchOrderBook() throws NotConfiguredError on testnet without on-chain polling fallback

Severity: major
Area: SDK

## Steps to reproduce
1. Run the following code attempting to stream the orderbook on testnet:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  await exchange.watchOrderBook('WBTC/USDso:USDso', 10);
}
reproduce();
```
2. Observe the unhandled error.

## Expected
`watchOrderBook()` should either connect to a bundled testnet indexer or gracefully fallback to polling on-chain orderbook levels (`getLiveSpotOrderBook` / `getBookLevels`) when an indexer URL is not configured.

## Actual
The function crashes with `NotConfiguredError`:
```text
NotConfiguredError: @somnia-chain/markets-sdk: a live watch (indexer snapshot hydration) — needs config.indexerUrl
```
Because no testnet GraphQL indexer endpoint is configured or documented for chain 50312, real-time orderbook streaming fails completely out of the box.

## Evidence
- Stack trace:
```text
NotConfiguredError: @somnia-chain/markets-sdk: a live watch (indexer snapshot hydration) — needs config.indexerUrl
    at requireIndexerUrl (node_modules/@somnia-chain/markets-sdk/dist/liveTail.js:52:15)
    at LiveTail.hydratePools (node_modules/@somnia-chain/markets-sdk/dist/liveTail.js:907:32)
    at LiveTail.watchMarket (node_modules/@somnia-chain/markets-sdk/dist/liveTail.js:467:28)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
