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
`watchOrderBook()` should either automatically bind default testnet indexer endpoints for pre-configured chain presets (`somniaShannon` / `hidekiTestnet`) or gracefully fallback to polling on-chain orderbook levels (`getLiveSpotOrderBook` / `getBookLevels`) when `indexerUrl` is not explicitly provided.

## Actual
The function crashes with `NotConfiguredError`:
```text
NotConfiguredError: @somnia-chain/markets-sdk: a live watch (indexer snapshot hydration) — needs config.indexerUrl
```
Because `SomniaMarkets` does not configure default indexer endpoints for testnet chains and lacks an on-chain polling fallback mechanism, developers initializing standard chain instances encounter immediate runtime crashes when trying to stream live orderbooks.

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
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
