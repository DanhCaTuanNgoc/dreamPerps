# watchPrice() throws NotConfiguredError even with official docs setup, lacking priceFeed config & on-chain oracle fallback

Severity: major
Area: SDK

## Steps to reproduce
1. Follow the official DreamDEX developer documentation (`https://app.testnet.dreamdex.io/docs/developers/perps-testnet`) to instantiate `SomniaMarkets`:
```javascript
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  // Exact constructor recommended in official developer docs:
  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
    indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql"
  });
  await exchange.loadMarkets();

  // Attempting to watch price stream
  await exchange.watchPrice('BTC/USDso:USDso');
}
reproduce();
```
2. Run the script against Somnia Tokyo Testnet.

## Expected
`watchPrice()` should stream price updates out of the box, either by automatically binding default testnet price-feed endpoints (`SOMNIA_TESTNET_PRICE_FEED`), or by leveraging the on-chain oracle hub (`oracleHub: 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b`) as a fallback if `config.priceFeed` is omitted.

## Actual
The function crashes with an unhandled `NotConfiguredError`:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this price-feed read — needs config.priceFeed = { url } — the price-feed indexer's GraphQL endpoint
```
The official DreamDEX developer guide provides the connection snippet with `chain`, `addresses`, and `indexerUrl`, but completely omits `priceFeed`. As a result, every developer following the official documentation crashes when attempting real-time price streaming.

## Evidence
- Reproduction Output & Stack trace:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this price-feed read — needs config.priceFeed = { url }
    at Module.resolvePriceFeed (node_modules/@somnia-chain/markets-sdk/dist/config.js:156:15)
    at PriceFeed.hydrate (node_modules/@somnia-chain/markets-sdk/dist/priceFeed/priceFeed.js:185:29)
    at SomniaMarkets.watchPrice (node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js:4235:20)
```
- Reference: [Perps on Testnet for Developers](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo Testnet (Chain ID: `50383` / `50312`)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
