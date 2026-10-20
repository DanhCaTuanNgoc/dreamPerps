# createOrder() fails to validate 'type' and 'side' on client, broadcasting invalid transactions that burn gas via contract revert

Severity: major
Area: SDK

## Steps to reproduce
1. Run the following reproduction script with an authenticated `SomniaMarkets` instance:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: "0x0123456789012345678901234567890123456789012345678901234567890123"
  });
  await exchange.loadMarkets();

  // Passing invalid type 'invalid_type' or invalid side 'invalid_side'
  await exchange.createOrder('WBTC/USDso:USDso', 'invalid_type', 'buy', 1, 50000);
}
reproduce();
```
2. Observe that the SDK does not validate `type` or `side` before signing and broadcasting.

## Expected
The SDK should validate parameters locally before network transmission and throw an `InvalidInputError`:
`InvalidInputError: invalid order type 'invalid_type', must be 'limit' or 'market'`

## Actual
The SDK signs and broadcasts the invalid order payload directly to the Somnia RPC node. The EVM contract execution reverts on-chain, wasting developer gas and throwing:
```text
ContractRevertError: @somnia-chain/markets-sdk: placeOrder reverted: Missing or invalid parameters. Double check you have provided the correct parameters.
```

## Evidence
- Live Terminal Execution with Real Testnet Wallet (`0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`):
```text
Authenticated Wallet Address: 0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF
Caught Error: ContractRevertError - @somnia-chain/markets-sdk: placeOrder reverted: ERC20InsufficientBalance(0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF, 0, 2500000000000000000000)
--> Note: Because 'invalid_type' was NOT validated on the client, the SDK proceeded to assemble an on-chain transaction calling placeOrder() on Somnia testnet contracts, which attempted collateral deduction and reverted.
```
- Stack trace:
```text
ContractRevertError: @somnia-chain/markets-sdk: placeOrder reverted: Missing or invalid parameters.
    at decodeRevert (node_modules/@somnia-chain/markets-sdk/dist/revert.js:230:12)
    at Module.toSdkError (node_modules/@somnia-chain/markets-sdk/dist/revert.js:256:20)
    at Module.broadcastSigned (node_modules/@somnia-chain/markets-sdk/dist/txSend.js:204:15)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.x
