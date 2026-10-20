# exchange.market() omits 'limits' and 'precision' metadata violating CCXT standard interface

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

  const market = exchange.market('BTC/USDso:USDso');
  console.log("market.limits:", market.limits);       // undefined
  console.log("market.precision:", market.precision); // undefined

  // Attempting standard CCXT precision conversions
  console.log(market.limits.amount.min); // Crashes with TypeError
}
reproduce();
```

## Expected
`exchange.market(symbol)` must conform to the CCXT Market unified structure, providing:
- `market.limits`: `{ amount: { min, max }, price: { min, max }, cost: { min } }`
- `market.precision`: `{ amount, price }`

## Actual
Both `market.limits` and `market.precision` are `undefined`. Any trading bot or automated algorithm relying on standard CCXT precision formatting (or checking minimum lot sizes before placing orders) crashes with an unhandled `TypeError: Cannot read properties of undefined (reading 'amount')`.

## Evidence
- Terminal execution output:
```text
market.limits: undefined
market.precision: undefined
TypeError: Cannot read properties of undefined (reading 'amount')
```
- Market keys populated by SDK:
```json
["market", "chainId", "marketSymbol", "symbol", "pool"]
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo Testnet (Chain ID: `50383` / `50312`)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
