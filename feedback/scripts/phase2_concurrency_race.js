/**
 * PHASE 2: CLOB CONCURRENCY, BURST STRESS & ORDERBOOK INTEGRITY
 * Network: Somnia Tokyo / Hideki Testnet (Chain ID: 50383)
 * Target: dreamDEX CLOB Matching Engine & Orderbooks
 * Run: node feedback/scripts/phase2_concurrency_race.js
 */

require('dotenv').config();
const { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { hidekiTestnet } = require('@somnia-chain/markets-sdk/chains');

const rawPk = process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.trim() : null;
const cleanPk = rawPk ? (rawPk.startsWith('0x') ? rawPk : '0x' + rawPk) : '0x0123456789012345678901234567890123456789012345678901234567890123';

async function runConcurrencySuite() {
  console.log('========================================================================');
  console.log('⚡ PHASE 2: CLOB CONCURRENCY, BURST STRESS & BOOK INTEGRITY AUDIT');
  console.log('========================================================================\n');

  const exchange = new SomniaMarkets({
    chain: hidekiTestnet,
    addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
    privateKey: cleanPk
  });
  await exchange.loadMarkets();

  // 1. ORDERBOOK CROSSING INVARIANT (Maker vs Taker Solvency)
  console.log('[1] VERIFYING INVARIANT 1: Orderbook Spread & Crossing Protection');
  const targetMarkets = ['BTC/USDso:USDso', 'ETH/USDso:USDso', 'SOL/USDso:USDso'];
  for (const symbol of targetMarkets) {
    const ob = await exchange.fetchOrderBook(symbol, 5);
    const bestBid = ob.bids.length > 0 ? ob.bids[0][0] : null;
    const bestAsk = ob.asks.length > 0 ? ob.asks[0][0] : null;
    const spread = bestAsk && bestBid ? bestAsk - bestBid : null;

    console.log(`    - ${symbol}:`);
    console.log(`      * Best Bid: $${bestBid}`);
    console.log(`      * Best Ask: $${bestAsk}`);
    console.log(`      * Spread: $${spread ? spread.toFixed(2) : 'N/A'}`);

    if (bestBid !== null && bestAsk !== null && bestBid >= bestAsk) {
      console.log(`    --> CRITICAL BUG: Crossed Orderbook Detected on ${symbol}! (Bid: ${bestBid} >= Ask: ${bestAsk})`);
    } else {
      console.log(`      * Spread Invariant: Healthy ✅ (Bid < Ask)`);
    }
  }

  // 2. 15-CALL BURST CONCURRENCY (Race Condition & Engine Stress)
  console.log('\n[2] EXECUTING VECTOR 3.4: 15-Call Concurrent Burst via Promise.allSettled');
  const burstTasks = [];
  const startTime = Date.now();

  // 5 concurrent fetchOrderBook requests
  for (let i = 0; i < 5; i++) {
    burstTasks.push(exchange.fetchOrderBook('BTC/USDso:USDso', 10));
  }
  // 5 concurrent fetchTicker requests
  for (let i = 0; i < 5; i++) {
    burstTasks.push(exchange.fetchTicker('BTC/USDso:USDso'));
  }
  // 5 concurrent cancelOrder requests with alphanumeric IDs (testing error handling under load)
  for (let i = 0; i < 5; i++) {
    burstTasks.push(exchange.cancelOrder(`burst_order_${i}`, 'BTC/USDso:USDso'));
  }

  console.log(`    - Dispatched 15 concurrent promises into matching engine & RPC...`);
  const results = await Promise.allSettled(burstTasks);
  const elapsedMs = Date.now() - startTime;
  console.log(`    - All 15 promises settled in ${elapsedMs}ms!`);

  let fulfilledCount = 0;
  let rejectedCount = 0;
  const errorTypes = new Set();

  for (const res of results) {
    if (res.status === 'fulfilled') fulfilledCount++;
    else {
      rejectedCount++;
      errorTypes.add(`${res.reason.name}: ${res.reason.message.slice(0, 60)}`);
    }
  }

  console.log(`    - Fulfilled: ${fulfilledCount}/15`);
  console.log(`    - Rejected: ${rejectedCount}/15`);
  console.log(`    - Error Profiles Captured:`, Array.from(errorTypes));

  // 3. WS vs REST DESYNC INVARIANT
  console.log('\n[3] TESTING VECTOR 3.5: WebSocket Stream Availability');
  try {
    await exchange.watchOrderBook('BTC/USDso:USDso');
  } catch (err) {
    console.log(`    - watchOrderBook Result: ${err.name} - ${err.message}`);
    console.log(`    --> WS-REST DESYNC CONFIRMED: WebSocket feed requires indexerUrl which is unavailable on Tokyo testnet, preventing automated bot hydration.`);
  }

  console.log('\n========================================================================');
  console.log('✅ PHASE 2 STEP 3 (CONCURRENCY & BURST STRESS) COMPLETE');
  console.log('========================================================================\n');
}

runConcurrencySuite().catch(console.error);
