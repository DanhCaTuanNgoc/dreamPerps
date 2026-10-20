# Undocumented Safe Smart Account architecture creates balance desync and order execution failure in SDK

Severity: major
Area: docs

## Steps to reproduce
1. Log in to DreamDEX Perps Arena (`https://app.testnet.dreamdex.io`) using MetaMask EOA (e.g., `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`).
2. Observe in the Perps Arena UI Portfolio tab:
   - The user account shows 1,000 USDso paper trading collateral.
   - The UI shows an Area / Account address (e.g., `0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8`), which is a deployed Safe Smart Account.
3. Place a Long BTC order via the Perps Arena UI. The order executes on Somnia Tokyo Testnet successfully:
   - Transaction Hash: `0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3`
   - Contract called: Smart Account `0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8` via `execTransaction()` targeting `MarginBank` (`0x478769E1177C0773c43A593DCCc4Ad15F15F1394`).
4. Now, attempt to connect to the DEX programmatically following the official SDK documentation and `dreamdex-bot-kit`:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function testSDK() {
  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: process.env.PRIVATE_KEY // EOA private key for 0xE50d...
  });
  await exchange.loadMarkets();

  // Query balances or place order
  const balance = await exchange.fetchBalance();
  console.log("USDso Balance for EOA:", balance.total['USDso']); // Reports: 0

  await exchange.createOrder('WBTC/USDso:USDso', 'limit', 'buy', 0.05, 50000);
}
testSDK();
```
5. Observe that the SDK fails with:
`ContractRevertError: placeOrder reverted: ERC20InsufficientBalance(0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF, 0, ...)`

## Expected
1. The SDK documentation should clearly explain the architectural relationship between the EOA signer, the Perps Arena Safe Smart Account, and the `OperatorPermissionsRegistry` (`0x6B2FbfeD328FF5F20C0BE7D3C3437613aFFE8D3a`) as outlined in [Link a Bot](https://app.testnet.dreamdex.io/docs/trading/common/link-a-bot).
2. The SDK should either:
   - Provide first-class support for configuring a Smart Account delegate or operator (`owner` or `smartAccountAddress` parameter in `SomniaMarkets` constructor, similar to `dreamdex-bot-kit`'s `ChainContext.owner` using `placeOrderFor`), OR
   - Document clearly in [Perps on Testnet for Developers](https://app.testnet.dreamdex.io/docs/developers/perps-testnet) that Perps Arena paper margin is locked inside the Safe Smart Account, and bots must independently claim EOA test funds via `markets.trader.claimPerpVoucher()` rather than expecting to trade on the UI balance.

## Actual
- The SDK documentation only mentions supplying `privateKey` of the EOA.
- The SDK derives `exchange.walletAddress` strictly from the EOA private key, querying only EOA balances and submitting transactions directly from the EOA.
- Because the Perps Arena 1,000 USDso margin is locked inside `MarginBank` under the Smart Account address (`0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8`), bots using the official SDK cannot access the funds displayed in their Perps Arena UI dashboard.
- Any attempt to trade via the SDK results in immediate reversion due to 0 margin balance on the EOA.
- Relevant documentation references:
  - [Link a Bot Guide](https://app.testnet.dreamdex.io/docs/trading/common/link-a-bot)
  - [Perps on Testnet for Developers](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)
  - [dreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit)

## Evidence
- **Perps Arena UI Account:** `0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8` (Safe Smart Account Proxy)
- **Signer MetaMask EOA:** `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- **Successful Live Web UI Transaction:**
  - Tx Hash: `0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3`
  - Explorer Link: [https://explorer.testnet.somnia.network/tokyo/tx/0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3](https://explorer.testnet.somnia.network/tokyo/tx/0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3)
  - Block: `28555324`
  - Function: `execTransaction(...)`
- **SDK On-Chain Revert Output (when trading with EOA):**
```text
ContractRevertError: @somnia-chain/markets-sdk: placeOrder reverted: ERC20InsufficientBalance(0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF, 0, 2500000000000000000000)
```

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo Testnet (Chain ID: `50383` / `hidekiTestnet`)
- Signer EOA: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Safe Smart Account: `0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8`
- MarginBank: `0x478769E1177C0773c43A593DCCc4Ad15F15F1394`
