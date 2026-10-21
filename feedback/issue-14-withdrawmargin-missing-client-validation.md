# withdrawMargin() fails to validate amount on client, broadcasting invalid calls that cause on-chain EVM reverts

Severity: major
Area: SDK

## Steps to reproduce
1. Initialize `SomniaMarkets` with testnet credentials on Somnia Shannon Testnet (Chain ID 50312).
2. Execute the following minimal reproduction script:
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

  // withdrawMargin(0) bypasses client validation and broadcasts on-chain transaction
  try {
    await exchange.withdrawMargin('WBTC/USDso:USDso', 0);
  } catch (err) {
    console.log("Caught:", err.name, "-", err.message);
  }
  await exchange.close();
}
reproduce();
```
3. Run with `node reproduce.js`.

## Expected
1. Symmetrically with `depositMargin()`, which strictly checks `assertDepositAmount(p) { if (p.amount <= 0n) throw new InvalidInputError("amount must be > 0"); }`, `withdrawMargin()` should validate on the client that `amount > 0`.
2. Bad numeric inputs (`0`) should be intercepted immediately before resolving contract addresses or signing transactions, avoiding unnecessary network latency and wasted RPC calls.
3. If `amount <= 0`, throw `InvalidInputError("amount must be > 0")`.

## Actual
1. `withdrawMargin()` in `node_modules/@somnia-chain/markets-sdk/dist/perp/margin.js` completely omits an `assertWithdrawAmount` guard:
```javascript
export async function withdrawMargin(w, p) {
    const bank = await w.resolveMarginBank(p);
    return w.execute(withdrawCall(w, bank, p));
}
```
2. The SDK performs an unnecessary contract read to resolve `MarginBank`, constructs a raw calldata payload calling `MarginBank.withdraw(0)` (`0x2e1a7d4d0000000000000000000000000000000000000000000000000000000000000000`), and broadcasts it to the Somnia RPC node.
3. The on-chain contract execution reverts with error `0x2c5211c6` (`InvalidAmount()`), causing the SDK to throw an unhandled `ContractRevertError`:
```text
ContractRevertError: @somnia-chain/markets-sdk: withdraw reverted: InvalidAmount()
```

## Evidence
- Terminal Execution Output:
```text
Caught: ContractRevertError - @somnia-chain/markets-sdk: withdraw reverted: InvalidAmount()
```
- Raw Call Data Dispatched to Somnia RPC Node:
```text
to:   0xdd4a14a2763fda39b9759d2d4150db0e0f085c4e (MarginBank)
data: 0x2e1a7d4d0000000000000000000000000000000000000000000000000000000000000000 (withdraw(0))
revert selector: 0x2c5211c6 (keccak256("InvalidAmount()"))
```
- Contrast with `depositMargin('WBTC/USDso:USDso', 0)` which correctly throws on client:
```text
InvalidInputError: @somnia-chain/markets-sdk: amount must be > 0
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Target Contract: `MarginBank` (`0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E`)
- Node.js version: v20.19.0
