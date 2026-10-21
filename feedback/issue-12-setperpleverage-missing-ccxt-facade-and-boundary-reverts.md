# SomniaMarkets omits CCXT setLeverage() and underlying setPerpLeverage() causes on-chain EVM reverts on boundary inputs

Severity: major
Area: SDK

## Steps to reproduce
1. Initialize `SomniaMarkets` on Somnia Shannon Testnet (Chain ID 50312).
2. Execute the following minimal reproduction script:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: process.env.PRIVATE_KEY
  });
  await exchange.loadMarkets();

  // Test 1: Standard CCXT method does not exist on SomniaMarkets facade
  console.log("exchange.setLeverage:", typeof exchange.setLeverage); // undefined

  const m = exchange.market('WBTC/USDso:USDso');

  // Test 2: leverageX = 0 bypasses client validation and reverts on-chain
  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: 0
    });
  } catch (err) {
    console.log("leverageX 0 caught:", err.name, err.message);
  }

  // Test 3: leverageX = 100 (exceeding 20x maximum leverage)
  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: 100
    });
  } catch (err) {
    console.log("leverageX 100 caught:", err.name, err.message);
  }

  // Test 4: leverageX = NaN causes raw JavaScript RangeError
  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: NaN
    });
  } catch (err) {
    console.log("leverageX NaN caught:", err.name, err.message);
  }
}
reproduce();
```
3. Run with `node reproduce.js`.

## Expected
1. In accordance with CCXT standard and perpetual DEX bot conventions, `SomniaMarkets` should provide `exchange.setLeverage(leverage, symbol)` directly on the facade instance.
2. `setPerpLeverage` should perform client-side input validation before building transactions:
   - Check `1 <= leverageX <= maxLeverage` (20 on Somnia perps).
   - Reject non-integer or `NaN` inputs with `InvalidInputError("leverage must be a positive integer between 1 and 20")`.

## Actual
1. `exchange.setLeverage` is `undefined` on `SomniaMarkets.prototype`, breaking CCXT interoperability for perpetual algorithmic trading bots.
2. `setPerpLeverage` has zero client-side checks:
   - Setting leverage to `0` or `100` signs an EVM transaction calling `MarginBank.setMaxLeverage(pool, leverageX)`, broadcasting to Somnia RPC and burning STT gas on an EVM revert (`InvalidLeverage()`).
   - Setting leverage to `NaN` crashes the Node.js runtime with raw uncaught `RangeError: The number NaN cannot be converted to a BigInt because it is not an integer`.
   - Setting leverage to `-1` throws raw `IntegerOutOfRangeError`.

## Evidence
- Live On-Chain Valid Leverage Transaction on Somnia Shannon Testnet:
  - Tx Hash: [`0xcc7a891262e5bcc1098be1ac7fb725d2f3ff37323e5f018a4f4c02ff4abb3309`](https://shannon-explorer.somnia.network/tx/0xcc7a891262e5bcc1098be1ac7fb725d2f3ff37323e5f018a4f4c02ff4abb3309)
  - Block: `520125533`
  - Function: `MarginBank.setMaxLeverage(pool: 0x3892a5179f8ea0c810c45d1630546c0317b0e5b6, leverageX: 5)`
  - Status: `success`
- Terminal Error Output on Invalid Inputs:
```text
exchange.setLeverage: undefined
leverageX 0 caught: ContractRevertError @somnia-chain/markets-sdk: setMaxLeverage reverted: InvalidLeverage()
leverageX 100 caught: ContractRevertError @somnia-chain/markets-sdk: setMaxLeverage reverted: InvalidLeverage()
leverageX NaN caught: RangeError The number NaN cannot be converted to a BigInt because it is not an integer
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- MarginBank: `0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E`
- Signer Wallet Address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.19.0
