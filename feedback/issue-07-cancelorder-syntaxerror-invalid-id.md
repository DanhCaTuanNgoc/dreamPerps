# cancelOrder() crashes with unhandled JavaScript SyntaxError/TypeError instead of client validation on non-numeric order IDs

Severity: normal
Area: SDK

## Steps to reproduce
1. Run the following code passing an alphanumeric or invalid order ID to `cancelOrder`:
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

  // Passing non-numeric string ID or null
  await exchange.cancelOrder('order_abc_123', 'WBTC/USDso:USDso');
}
reproduce();
```
2. Observe the unhandled exception.

## Expected
The SDK should validate the `id` argument before attempting a BigInt conversion or broadcasting, throwing a standardized `InvalidInputError`:
`InvalidInputError: invalid order id 'order_abc_123', expected a valid numeric order id`

## Actual
The SDK directly calls `BigInt(id)` without input validation or type casting checks.
When passed a string like `'order_abc_123'`, it throws an unhandled Node.js `SyntaxError: Cannot convert order_abc_123 to a BigInt`.
When passed `null` or `undefined`, it crashes with `TypeError: Cannot convert null to a BigInt`.

## Evidence
- Reproduction output:
```text
cancelOrder('order_abc_123') threw: SyntaxError: Cannot convert order_abc_123 to a BigInt
cancelOrder(null) threw: TypeError: Cannot convert null to a BigInt
cancelOrder(undefined) threw: TypeError: Cannot convert undefined to a BigInt
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
