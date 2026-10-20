# watchPrice() throws NotConfiguredError requiring price-feed indexer without on-chain oracle fallback

Severity: major
Area: SDK

## Steps to reproduce
1. Run the following code on Somnia testnet:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  await exchange.watchPrice('WBTC/USDso:USDso');
}
reproduce();
```

## Expected
`watchPrice()` should either automatically bind default testnet price-feed endpoints (`SOMNIA_TESTNET_PRICE_FEED`) for known testnet chains or stream price updates by leveraging the on-chain oracle hub (`oracleHub: 0xe40db387cC98601Dd11bd634fF2f3AD5686dE32b`) as a fallback if `config.priceFeed` is omitted.

## Actual
The function crashes with `NotConfiguredError`:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this price-feed read — needs config.priceFeed = { url } — the price-feed indexer's GraphQL endpoint
```
Because `SomniaMarkets` does not bind the price feed configuration by default, developer scripts following basic initialization fail to receive price feeds without extra configuration boilerplate.

## Evidence
- Stack trace:
```text
NotConfiguredError: @somnia-chain/markets-sdk: this price-feed read — needs config.priceFeed = { url }
    at Module.resolvePriceFeed (node_modules/@somnia-chain/markets-sdk/dist/config.js:156:15)
    at PriceFeed.hydrate (node_modules/@somnia-chain/markets-sdk/dist/priceFeed/priceFeed.js:185:29)
    at SomniaMarkets.watchPrice (node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js:4235:20)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
