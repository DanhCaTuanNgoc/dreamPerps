/**
 * PHASE 3: BOT DELEGATION & PERP LEVERAGE VERIFICATION SUITE
 * Network: Somnia Shannon / Tokyo Testnet (Chain ID: 50312)
 * Targets: LinkedWalletRegistry (0xe125...) & MarginBank (0xdd4a...)
 * Run: node feedback/scripts/phase3_bot_delegation_leverage.js
 */

require('dotenv').config();
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

const rawPk = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : null;
const cleanPk = rawPk ? (rawPk.startsWith('0x') ? rawPk : '0x' + rawPk) : '0x0123456789012345678901234567890123456789012345678901234567890123';

async function runSuite() {
  console.log('========================================================================');
  console.log('🤖 PHASE 3: BOT DELEGATION (LINKED WALLET) & LEVERAGE SUITE');
  console.log('========================================================================\n');

  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES,
    privateKey: cleanPk
  });
  await exchange.loadMarkets();
  const m = exchange.market('WBTC/USDso:USDso');

  // TEST 1: setLeverage CCXT Facade check
  console.log('[1] CCXT Conformance: exchange.setLeverage exists?');
  console.log('    - typeof exchange.setLeverage:', typeof exchange.setLeverage);
  if (typeof exchange.setLeverage === 'undefined') {
    console.log('    --> DEFECT DETECTED: Missing setLeverage on SomniaMarkets facade!');
  }

  // TEST 2: setPerpLeverage boundary fuzzing
  console.log('\n[2] Fuzzing setPerpLeverage boundary inputs:');
  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: 0
    });
  } catch (err) {
    console.log('    - leverageX=0:', err.name, '-', err.message);
  }

  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: 100
    });
  } catch (err) {
    console.log('    - leverageX=100:', err.name, '-', err.message);
  }

  try {
    await exchange.trader.setPerpLeverage({
      marginBank: m.market.marginBank,
      pool: m.pool,
      leverageX: NaN
    });
  } catch (err) {
    console.log('    - leverageX=NaN:', err.name, '-', err.message);
  }

  // TEST 3: LinkedWalletRegistry proposePerpWalletLink fuzzing
  console.log('\n[3] Fuzzing proposePerpWalletLink inputs:');
  try {
    await exchange.trader.proposePerpWalletLink({
      pool: m.pool,
      child: exchange.walletAddress
    });
  } catch (err) {
    console.log('    - child=self:', err.name, '-', err.message);
  }

  try {
    await exchange.trader.proposePerpWalletLink({
      pool: m.pool,
      child: '0x0000000000000000000000000000000000000000'
    });
  } catch (err) {
    console.log('    - child=zero:', err.name, '-', err.message);
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 3 SUITE FINISHED');
  console.log('========================================================================\n');
}

runSuite().catch(console.error);
