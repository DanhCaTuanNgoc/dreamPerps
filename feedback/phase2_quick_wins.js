/**
 * PHASE 2: QUICK-WIN BOUNDARY FUZZING SUITE
 * Network: Somnia Tokyo / Hideki Testnet (Chain ID: 50383)
 * Target: Lot size, Tick size, Zero boundary, Symbol fuzzing
 * Run: node feedback/phase2_quick_wins.js
 */

require('dotenv').config();
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet } = require('@somnia-chain/markets-sdk/chains');

const rawPk = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : null;
const cleanPk = rawPk ? (rawPk.startsWith('0x') ? rawPk : '0x' + rawPk) : '0x0123456789012345678901234567890123456789012345678901234567890123';

async function runQuickWinsSuite() {
  console.log('========================================================================');
  console.log('🎯 PHASE 2: QUICK-WIN BOUNDARY FUZZING & VALIDATION AUDIT');
  console.log('========================================================================\n');

  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
    privateKey: cleanPk
  });
  await exchange.loadMarkets();

  const btcMarket = exchange.market('BTC/USDso:USDso');
  console.log(`[1] Market Metadata for BTC/USDso:USDso:`);
  console.log(`    - Keys present on market object:`, Object.keys(btcMarket));
  console.log(`    - market.limits:`, btcMarket.limits);
  console.log(`    - market.precision:`, btcMarket.precision);
  if (btcMarket.limits === undefined || btcMarket.precision === undefined) {
    console.log(`    --> DEFECT DETECTED: exchange.market() violates CCXT standard by omitting 'limits' and 'precision' dictionaries, breaking automated algorithmic bot sizing calculation.`);
  }

  // TEST 1: Zero Amount on createOrder
  console.log(`\n[2] FUZZING CASE 1: Zero Amount (amount = 0) on createOrder`);
  try {
    await exchange.createOrder('BTC/USDso:USDso', 'limit', 'buy', 0, 80000);
  } catch (err) {
    console.log(`    - Caught: ${err.name} - ${err.message}`);
    if (err.name === 'ContractRevertError') {
      console.log(`    --> DEFECT DETECTED: amount=0 was not intercepted on client, resulting in an EVM contract revert!`);
    } else {
      console.log(`    - Handled as: ${err.name} ✅`);
    }
  }

  // TEST 2: Zero Price on Limit Order
  console.log(`\n[3] FUZZING CASE 2: Zero Price (price = 0) on Limit Order`);
  try {
    await exchange.createOrder('BTC/USDso:USDso', 'limit', 'buy', 0.001, 0);
  } catch (err) {
    console.log(`    - Caught: ${err.name} - ${err.message}`);
    if (err.name === 'ContractRevertError') {
      console.log(`    --> DEFECT DETECTED: price=0 on limit order bypassed client check and triggered EVM contract revert!`);
    } else {
      console.log(`    - Handled as: ${err.name} ✅`);
    }
  }

  // TEST 3: Negative Price on createOrder
  console.log(`\n[4] FUZZING CASE 3: Negative Price (price = -50000)`);
  try {
    await exchange.createOrder('BTC/USDso:USDso', 'limit', 'buy', 0.001, -50000);
  } catch (err) {
    console.log(`    - Caught: ${err.name} - ${err.message}`);
    if (err.name === 'ContractRevertError') {
      console.log(`    --> DEFECT DETECTED: Negative price was broadcast to EVM contract instead of client-side validation!`);
    } else {
      console.log(`    - Handled as: ${err.name} ✅`);
    }
  }

  // TEST 4: Non-existent symbol query
  console.log(`\n[5] FUZZING CASE 4: Querying Non-existent Symbol 'NONEXISTENT/USDso:USDso'`);
  try {
    await exchange.fetchOrderBook('NONEXISTENT/USDso:USDso');
  } catch (err) {
    console.log(`    - Caught: ${err.name} - ${err.message}`);
    console.log(`    - Handled with clean error ✅`);
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 2 STEP 4 (QUICK-WIN FUZZING) COMPLETE');
  console.log('========================================================================\n');
}

runQuickWinsSuite().catch(console.error);
