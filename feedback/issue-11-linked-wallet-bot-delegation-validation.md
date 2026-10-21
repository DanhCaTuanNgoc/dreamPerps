# proposePerpWalletLink fails client validation on self/zero addresses and lacks high-level facade on SomniaMarkets

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
    privateKey: process.env.PRIVATE_KEY
  });
  await exchange.loadMarkets();
  const m = exchange.market('WBTC/USDso:USDso');

  // Case 1: Proposing self as bot child (should be caught on client)
  try {
    await exchange.trader.proposePerpWalletLink({
      pool: m.pool,
      child: exchange.walletAddress
    });
  } catch (err) {
    console.log("Self link result:", err.name, err.message);
  }

  // Case 2: Proposing ZERO_ADDRESS (should be caught on client)
  try {
    await exchange.trader.proposePerpWalletLink({
      pool: m.pool,
      child: "0x0000000000000000000000000000000000000000"
    });
  } catch (err) {
    console.log("Zero address result:", err.name, err.message);
  }
}
reproduce();
```
3. Run with `node reproduce.js`.

## Expected
1. The SDK should validate `child` parameter locally before signing and broadcasting transactions:
   - If `child === exchange.walletAddress`, throw `InvalidInputError("child cannot be the caller's own address")`.
   - If `child === ZERO_ADDRESS` or malformed address, throw `InvalidInputError("child must be a valid non-zero address")`.
2. The `SomniaMarkets` exchange facade should expose a first-class `linkBot(child, pool)` / `unlinkBot(child, pool)` method matching the core "Link a Bot" feature highlighted in DreamDEX documentation.
3. The error hint in `resolveMarginBank` (`pass marginBank or pool (PerpMarket.marginBank has it)`) should accurately reflect that `exchange.market(symbol)` encapsulates `marginBank` inside `.market.marginBank`, avoiding developer runtime confusion.

## Actual
1. The SDK performs zero client validation on `child`.
2. It signs and broadcasts an on-chain transaction calling `LinkedWalletRegistry.proposeLink(...)` on Somnia Testnet, burning gas and causing an on-chain EVM contract revert:
   - For self: `ContractRevertError @somnia-chain/markets-sdk: proposeLink reverted: CannotLinkSelf()`
   - For zero address: `ContractRevertError @somnia-chain/markets-sdk: proposeLink reverted: ZeroAddress()`
3. Developers using DreamDEX's official "Link a Bot" guide are forced to dig into low-level internals (`exchange.trader.proposePerpWalletLink`) rather than using a unified facade method.

## Evidence
- Live On-Chain Verified Transactions on Somnia Shannon Testnet:
  - Valid Propose Link Tx: [`0xb2d644789db3929cb5f485f2894624dbf7da5dcdc5bc2f752b98c0beb52f6c0e`](https://shannon-explorer.somnia.network/tx/0xb2d644789db3929cb5f485f2894624dbf7da5dcdc5bc2f752b98c0beb52f6c0e) (Block: `520126543`)
  - Valid Cancel Proposal Tx: [`0xffe9e181b1fe8d6e79f5c9cfecc847a7e7eff8d096de0ac3e31333b809ceff2e`](https://shannon-explorer.somnia.network/tx/0xffe9e181b1fe8d6e79f5c9cfecc847a7e7eff8d096de0ac3e31333b809ceff2e) (Block: `520127000`)
- Terminal Revert Output:
```text
Testing proposePerpWalletLink with self:
Caught self: ContractRevertError @somnia-chain/markets-sdk: proposeLink reverted: CannotLinkSelf()

Testing proposePerpWalletLink with ZERO_ADDRESS:
Caught zero: ContractRevertError @somnia-chain/markets-sdk: proposeLink reverted: ZeroAddress()
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- MarginBank: `0xdd4A14A2763FDa39b9759D2D4150DB0e0f085C4E`
- LinkedWalletRegistry: `0xe125E91c3404046e748A43A1a36B5D514DAD8E70`
- Signer Wallet Address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.19.0
