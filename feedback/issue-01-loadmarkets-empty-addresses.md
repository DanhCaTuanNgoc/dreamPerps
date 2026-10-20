# Silent market discovery failure: loadMarkets() returns empty array on Somnia testnet unless addresses are manually supplied

Severity: critical
Area: SDK

## Steps to reproduce
1. Initialize `SomniaMarkets` using `somniaShannon` from `@somnia-chain/markets-sdk/chains` as documented:
```javascript
const { SomniaMarkets } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({ chain: somniaShannon });
  await exchange.loadMarkets();
  console.log("Loaded symbols:", exchange.symbols); // Returns []
}
reproduce();
```
2. Run the script.
3. Observe that `exchange.symbols` is empty `[]` and no error is thrown to the developer.

## Expected
`SomniaMarkets` should automatically bind `SOMNIA_TESTNET_ADDRESSES` for `somniaShannon` (Chain ID 50312), discover the 24 available perpetual pools on-chain, and populate `exchange.symbols` with markets like `WBTC/USDso:USDso`, `WETH/USDso:USDso`, etc.

## Actual
`exchange.loadMarkets()` completes with no errors or warnings, but `exchange.symbols` remains empty `[]`.
Internally, `engine.config.addresses` is `undefined`, causing perp discovery to abort silently.

## Evidence
- Reproduction script output:
```text
Loaded symbols: []
```
- When inspected internally:
```javascript
console.log(exchange.engineFor(50312).config.addresses); // undefined
```
- Workaround required:
```javascript
const { SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const exchange = new SomniaMarkets({ chain: somniaShannon, addresses: SOMNIA_TESTNET_ADDRESSES });
// Now exchange.symbols has 24 markets!
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: Public discovery read (tested with and without wallet, e.g. `0x0123456789012345678901234567890123456789`)
- Node.js version: v20.x
