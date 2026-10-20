# fetchTicker() crashes with raw JavaScript TypeError on non-string inputs

Severity: normal
Area: SDK

## Steps to reproduce
1. Run the following code passing non-string inputs to `fetchTicker`:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  await exchange.fetchTicker(123);
  // or await exchange.fetchTicker(null);
  // or await exchange.fetchTicker(undefined);
}
reproduce();
```

## Expected
The SDK should validate input types and throw a standardized `InvalidInputError`:
`InvalidInputError: symbol must be a string`

## Actual
The call crashes with unhandled JavaScript runtime exceptions:
```text
TypeError: symbol.indexOf is not a function (when passing number)
TypeError: Cannot read properties of null (reading 'indexOf') (when passing null)
```

## Evidence
- Reproduction log:
```text
fetchTicker(123) threw: TypeError: symbol.indexOf is not a function
fetchTicker(null) threw: TypeError: Cannot read properties of null (reading 'indexOf')
fetchTicker(undefined) threw: TypeError: Cannot read properties of undefined (reading 'indexOf')
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: Public ticker read (no signer required)
- Node.js version: v20.x
