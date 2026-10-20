/**
 * PHASE 2: FINANCIAL INVARIANTS, MARGIN MATH & FUNDING SUITE
 * Network: Somnia Tokyo / Hideki Testnet (Chain ID: 50383)
 * Target: MarginBank (0x4787...) & BTC/USDso Perp Pool (0x4181...)
 * Run: node feedback/scripts/phase2_margin_invariants.js
 */

require('dotenv').config();
const path = require('path');
const { createPublicClient, http } = require('viem');
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet } = require('@somnia-chain/markets-sdk/chains');
const margin = require(path.resolve('node_modules/@somnia-chain/markets-sdk/dist/perp/margin.js'));
const { marginBankReadAbi } = require(path.resolve('node_modules/@somnia-chain/markets-sdk/dist/readsAbi.js'));

const SAFE_ADDRESS = '0x2d8B07bbfC92cF3A606b331D1c9385d46E7acAe8';
const MARGIN_BANK = '0x478769E1177C0773c43A593DCCc4Ad15F15F1394';
const BTC_POOL = '0x4181dd08E73BbCdd1Ba3E615A18f6abD941b94C0';

async function runMarginInvariantsSuite() {
  console.log('========================================================================');
  console.log('🔬 PHASE 2: FINANCIAL INVARIANTS, MARGIN MATH & FUNDING AUDIT');
  console.log('========================================================================\n');

  const client = createPublicClient({ chain: hidekiTestnet, transport: http() });
  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();

  // 1. INVARIANT 1: Total Margin Solvency & Precision Invariant
  console.log('[1] VERIFYING INVARIANT 1: Margin Solvency & Zero-Dust Equation');
  const accountState = await margin.getMarginAccount(MARGIN_BANK, SAFE_ADDRESS, client);
  const healthFn = marginBankReadAbi.find(x => x.name === 'getAccountHealth');
  const health = await client.readContract({
    address: MARGIN_BANK,
    abi: [healthFn],
    functionName: 'getAccountHealth',
    args: [SAFE_ADDRESS]
  });

  const [equity, imReq, mmReq, cmReq] = health;
  console.log(`    - On-Chain Equity: ${equity.toString()} wei (${Number(equity) / 1e18} USDso)`);
  console.log(`    - Unlocked Balance: ${accountState.unlockedCollateralBalance.toString()} wei`);
  console.log(`    - Locked Collateral: ${accountState.lockedCollateral.toString()} wei`);
  console.log(`    - Initial Margin Req (IM): ${imReq.toString()}`);
  console.log(`    - Maintenance Margin Req (MM): ${mmReq.toString()}`);

  const invariant1Holds = (accountState.unlockedCollateralBalance + accountState.lockedCollateral) === equity;
  console.log(`    - Solvency Invariant Check (Unlocked + Locked == Equity): ${invariant1Holds ? 'PASSED ✅' : 'VIOLATED ❌'}`);

  // 2. INVARIANT 2: Funding Rate Mechanics & Cadence Invariant
  console.log('\n[2] VERIFYING INVARIANT 2: Funding Rate Engine & Cadence Alignment');
  const fundingInfo = await exchange.fetchFundingRate('BTC/USDso:USDso');
  console.log(`    - Mark Price: $${fundingInfo.markPrice.toFixed(2)}`);
  console.log(`    - Index Price: $${fundingInfo.indexPrice.toFixed(2)}`);
  console.log(`    - Current Funding Rate: ${(fundingInfo.fundingRate * 100).toFixed(6)}%`);
  console.log(`    - Funding Interval: ${fundingInfo.info.fundingIntervalSec} seconds (${fundingInfo.info.fundingIntervalSec / 3600} hr)`);
  console.log(`    - Next Funding At: ${new Date(Number(fundingInfo.info.nextFundingAt) * 1000).toISOString()}`);

  const nowSec = Math.floor(Date.now() / 1000);
  const timeToFunding = Number(fundingInfo.info.nextFundingAt) - nowSec;
  console.log(`    - Time to Next Funding Settlement: ${timeToFunding}s`);

  if (fundingInfo.info.fundingIntervalSec !== 3600 && fundingInfo.info.fundingIntervalSec !== 28800) {
    console.log(`    --> UNEXPECTED BEHAVIOR: Funding interval ${fundingInfo.info.fundingIntervalSec}s diverges from standard 1h/8h perp specifications.`);
  }

  // 3. INVARIANT 3: fetchFundingRateHistory API Audit
  console.log('\n[3] TESTING API VECTOR: fetchFundingRateHistory() on Live Network');
  try {
    const history = await exchange.fetchFundingRateHistory('BTC/USDso:USDso');
    console.log(`    - Funding Rate History Items: ${history ? history.length : 0}`);
  } catch (err) {
    console.log(`    - Caught Error: ${err.name} - ${err.message}`);
    console.log(`    --> DEFECT DETECTED: fetchFundingRateHistory is not implemented or fails without fallback indexer on Somnia Tokyo Testnet.`);
  }

  // 4. INVARIANT 4: 20x Leverage Liquidation Boundary Simulation
  console.log('\n[4] VERIFYING INVARIANT 4: 20x Max Leverage Liquidation Formula Bounds');
  const simMarkPrice = BigInt(Math.floor(fundingInfo.markPrice * 1e18));
  const simSize = 1000000000000000n; // 0.001 BTC
  const simEquity = 100000000000000000000n; // 100 USDso margin
  const mmBps = 500n; // 5% MMR (0.05)
  const oneBase = 1000000000000000000n;

  try {
    const liqPrice = margin.perpLiquidationPrice({
      equity: simEquity,
      mmReq: (simEquity * mmBps) / 10000n,
      size: simSize,
      markPrice: simMarkPrice,
      maintenanceMarginBps: mmBps,
      oneBase: oneBase
    });
    console.log(`    - Simulated Long Liquidation Price for 0.001 BTC with 100 USDso margin: $${Number(liqPrice) / 1e18}`);
    console.log(`    - Liquidation Math Executed Without Underflow ✅`);
  } catch (err) {
    console.log(`    - Liquidation Formula Error: ${err.message}`);
  }

  // 5. INVARIANT 5: Zero Lot & Fractional Size Fuzzing on Math Library
  console.log('\n[5] TESTING VECTOR: Zero Lot & NaN Boundary on perpLiquidationPrice');
  try {
    const zeroLotLiq = margin.perpLiquidationPrice({
      equity: simEquity,
      mmReq: 0n,
      size: 0n,
      markPrice: simMarkPrice,
      maintenanceMarginBps: mmBps,
      oneBase: oneBase
    });
    console.log(`    - Zero Lot Liq Result:`, zeroLotLiq);
  } catch (err) {
    console.log(`    - Caught Error on Zero Size: ${err.name} - ${err.message}`);
    console.log(`    --> BUG CONFIRMED: perpLiquidationPrice throws unhandled exception on size=0 instead of returning null or safe boundary.`);
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 2 STEP 2 (MARGIN MATH & INVARIANTS) COMPLETE');
  console.log('========================================================================\n');
}

runMarginInvariantsSuite().catch(console.error);
