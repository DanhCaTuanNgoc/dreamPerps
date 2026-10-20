/**
 * PHASE 2: DOCUMENTATION SNIPPETS & ERROR CODE GRANULARITY AUDIT
 * Network: Somnia Tokyo / Hideki Testnet (Chain ID: 50383)
 * Target: Official Documentation code snippets, TypeScript type contracts & Error handling
 * Run: node feedback/scripts/phase2_docs_audit.js
 */

require('dotenv').config();
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet, somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function runDocsAuditSuite() {
  console.log('========================================================================');
  console.log('📚 PHASE 2: DOCUMENTATION CODE SNIPPETS & DX GRANULARITY AUDIT');
  console.log('========================================================================\n');

  // SNIPPET 1: Official Getting Started snippet from README
  console.log('[1] AUDITING SNIPPET 1: Official Default Constructor from SDK README');
  console.log('    Snippet: const exchange = new SomniaMarkets({ chain: somniaShannon });');
  try {
    const exchangeDefault = new SomniaMarkets({ chain: somniaShannon });
    await exchangeDefault.loadMarkets();
    if (exchangeDefault.symbols.length === 0) {
      console.log('    --> RESULT: Snippet fails silently. exchange.symbols is empty []. New developers cannot start without unwritten config.');
    }
  } catch (err) {
    console.log(`    --> Snippet crashed: ${err.message}`);
  }

  // SNIPPET 2: Standard CCXT exchange.market() call
  console.log('\n[2] AUDITING SNIPPET 2: CCXT market(symbol) Data Contract');
  console.log('    Snippet: const market = exchange.market("BTC/USDso:USDso");');
  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES
  });
  await exchange.loadMarkets();
  const market = exchange.market('BTC/USDso:USDso');
  if (!market.limits || !market.precision) {
    console.log(`    --> RESULT: Contract Broken! market.limits is ${market.limits}, market.precision is ${market.precision}.`);
    console.log(`        Developers porting standard CCXT trading bots will crash on precision/limit calculations.`);
  }

  // SNIPPET 3: Documented Real-time watchOrderBook stream
  console.log('\n[3] AUDITING SNIPPET 3: Documented watchOrderBook Stream');
  console.log('    Snippet: await exchange.watchOrderBook("BTC/USDso:USDso");');
  try {
    await exchange.watchOrderBook('BTC/USDso:USDso');
  } catch (err) {
    console.log(`    --> RESULT: Crashed with ${err.name} - ${err.message}`);
    console.log(`        Documentation fails to state that WebSocket streams are disabled without private indexerUrl.`);
  }

  // SNIPPET 4: Documented Historical Funding Rate fetch
  console.log('\n[4] AUDITING SNIPPET 4: Documented fetchFundingRateHistory API');
  console.log('    Snippet: await exchange.fetchFundingRateHistory("BTC/USDso:USDso");');
  try {
    await exchange.fetchFundingRateHistory('BTC/USDso:USDso');
  } catch (err) {
    console.log(`    --> RESULT: Crashed with ${err.name} - ${err.message}`);
    console.log(`        Missing fallback to on-chain events when indexerUrl is not provided.`);
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 2 STEP 5 (DOCS & DX AUDIT) COMPLETE');
  console.log('========================================================================\n');
}

runDocsAuditSuite().catch(console.error);
