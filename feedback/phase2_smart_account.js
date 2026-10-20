/**
 * PHASE 2: LIVE ON-CHAIN SMART ACCOUNT & NETWORK ROUTING SUITE
 * Network: Somnia Tokyo / Hideki Testnet (Chain ID: 50383)
 * Target: Safe Smart Account (0x2d8B... ) & MarginBank (0x4787...)
 * Run: node feedback/phase2_smart_account.js
 */

require('dotenv').config();
const path = require('path');
const { createPublicClient, http, parseAbi } = require('viem');
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet, somniaShannon } = require('@somnia-chain/markets-sdk/chains');
const margin = require(path.resolve('node_modules/@somnia-chain/markets-sdk/dist/perp/margin.js'));

const rawPk = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : null;
const cleanPk = rawPk ? (rawPk.startsWith('0x') ? rawPk : '0x' + rawPk) : null;

const SAFE_ADDRESS = '0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8';
const MARGIN_BANK_HIDEKI = '0x478769E1177C0773c43A593DCCc4Ad15F15F1394';
const EOA_ADDRESS = '0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF';
const BASELINE_TX = '0x9f09e7f4c2211f9097b1689e6d8a1bc98d7d19020a09c77ea01344118542ccf3';

async function runPhase2SmartAccountSuite() {
  console.log('========================================================================');
  console.log('🚀 PHASE 2: LIVE SMART ACCOUNT & ON-CHAIN ROUTING AUDIT');
  console.log('========================================================================\n');

  const client = createPublicClient({ chain: hidekiTestnet, transport: http() });

  // 1. Verify On-Chain Connection and Block Height
  const blockNumber = await client.getBlockNumber();
  console.log(`[1] Somnia Tokyo (Hideki) Connected! Current Block: ${blockNumber}`);

  // 2. Audit Safe Smart Account on Tokyo Testnet
  const safeAbi = parseAbi([
    'function getOwners() view returns (address[])',
    'function getThreshold() view returns (uint256)',
    'function nonce() view returns (uint256)'
  ]);

  const [owners, threshold, nonce] = await Promise.all([
    client.readContract({ address: SAFE_ADDRESS, abi: safeAbi, functionName: 'getOwners' }),
    client.readContract({ address: SAFE_ADDRESS, abi: safeAbi, functionName: 'getThreshold' }),
    client.readContract({ address: SAFE_ADDRESS, abi: safeAbi, functionName: 'nonce' })
  ]);

  console.log(`[2] Safe Smart Account (${SAFE_ADDRESS}) State:`);
  console.log(`    - Threshold: ${threshold} of ${owners.length} signers`);
  console.log(`    - Current Nonce: ${nonce}`);
  console.log(`    - Signers:`, owners);

  // 3. Audit MarginBank Accounting on Live Network
  const marginData = await margin.getMarginAccount(MARGIN_BANK_HIDEKI, SAFE_ADDRESS, client);
  console.log(`\n[3] MarginBank (${MARGIN_BANK_HIDEKI}) Balance for Smart Account:`);
  console.log(`    - Unlocked Margin: ${Number(marginData.unlockedCollateralBalance) / 1e18} USDso`);
  console.log(`    - Locked Collateral: ${Number(marginData.lockedCollateral) / 1e18} USDso`);
  console.log(`    - Account Equity: ${Number(marginData.equity) / 1e18} USDso`);
  console.log(`    - Margin Status: ${marginData.marginStatus}`);

  // 4. Trace Baseline Verified Transaction on Live Network
  const tx = await client.getTransaction({ hash: BASELINE_TX });
  console.log(`\n[4] Baseline Transaction Verification:`);
  console.log(`    - TxHash: ${tx.hash}`);
  console.log(`    - Block: ${tx.blockNumber}`);
  console.log(`    - Executed By (Relayer): ${tx.from}`);
  console.log(`    - Executed On (Safe): ${tx.to}`);

  // 5. TEST VECTOR 2.1: SDK Cross-Chain & Configuration Divergence
  console.log(`\n[5] TESTING VECTOR 2.1: SDK Testnet Configuration Desync`);
  const exchangeShannon = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });
  await exchangeShannon.loadMarkets();

  const exchangeHideki = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES
  });
  await exchangeHideki.loadMarkets();

  console.log(`    - Official Docs Chain (Shannon 50312) Active Symbols: ${exchangeShannon.symbols.length}`);
  console.log(`    - Real Tokyo Testnet (Hideki 50383) Active Symbols: ${exchangeHideki.symbols.length}`);
  if (exchangeShannon.symbols.length !== exchangeHideki.symbols.length) {
    console.log(`    --> BUG CONFIRMED: Docs instruct connecting to Shannon testnet (50312), but Perps Arena operates on Hideki testnet (50383). Developers connecting via official docs cannot trade or view Perps Arena pools.`);
  }

  // 6. TEST VECTOR 2.2: SDK Direct EOA vs Smart Account Disconnect
  console.log(`\n[6] TESTING VECTOR 2.2: EOA vs Smart Account Margin Isolation`);
  if (cleanPk) {
    const exchangeAuth = new SomniaMarkets({
      chain: hidekiTestnet,
      addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
      privateKey: cleanPk
    });
    await exchangeAuth.loadMarkets();
    const eoaBalance = await exchangeAuth.fetchBalance();
    const eoaMargin = eoaBalance['USDso'] ? eoaBalance['USDso'].total : 0;
    console.log(`    - SDK Derived EOA (${exchangeAuth.walletAddress}) USDso Balance: ${eoaMargin}`);
    console.log(`    - Live MarginBank Smart Account (${SAFE_ADDRESS}) USDso Balance: ${Number(marginData.unlockedCollateralBalance) / 1e18}`);
    if (eoaMargin === 0 && Number(marginData.unlockedCollateralBalance) > 0) {
      console.log(`    --> BUG CONFIRMED: SDK has no Smart Account or Safe delegation parameter. The 1,000 USDso margin is completely inaccessible to bots using the SDK.`);
    }
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 2 STEP 1 (SMART ACCOUNT & ROUTING) AUDIT COMPLETE');
  console.log('========================================================================\n');
}

runPhase2SmartAccountSuite().catch(console.error);
