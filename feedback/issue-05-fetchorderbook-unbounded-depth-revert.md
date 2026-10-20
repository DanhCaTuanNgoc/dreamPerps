# fetchOrderBook() with large limit triggers unhandled on-chain ContractRevertError instead of client validation

Severity: normal
Area: SDK

## Steps to reproduce
1. Run the following code requesting a large orderbook depth:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  await exchange.fetchOrderBook('WBTC/USDso:USDso', 99999999);
}
reproduce();
```

## Expected
The SDK should validate the upper limit bounds of `depth` and throw an `InvalidInputError` (e.g., `depth exceeds maximum allowed depth of 100`).

## Actual
The large limit value is passed directly into the smart contract read call, causing an unhandled EVM revert error:
```text
ContractRevertError: @somnia-chain/markets-sdk: getBookLevels reverted: The contract function "getBookLevels" reverted.
```

## Evidence
- Stack trace:
```text
ContractRevertError: @somnia-chain/markets-sdk: getBookLevels reverted: The contract function "getBookLevels" reverted.
    at decodeRevert (node_modules/@somnia-chain/markets-sdk/dist/revert.js:230:12)
    at Module.toSdkError (node_modules/@somnia-chain/markets-sdk/dist/revert.js:256:20)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: Public contract read (no signer required)
- Node.js version: v20.x
