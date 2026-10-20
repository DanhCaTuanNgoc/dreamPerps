import { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { logger } from "../utils/logger.js";

async function runFuzz() {
  console.log("=== STARTING SDK FUZZING & STRESS TEST ===");

  const exchange = new SomniaMarkets({
    chain: somniaShannon,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });

  await exchange.loadMarkets();
  console.log(`Markets count: ${exchange.symbols.length}`);

  // Test 1: fetchTicker with malformed symbols
  console.log("\n--- TEST 1: fetchTicker with malformed symbols ---");
  for (const sym of ["INVALID", "", "BTC/USD", "BTC/USDso:USDso", 123 as any, null as any, undefined as any]) {
    try {
      const res = await (exchange as any).fetchTicker(sym);
      console.log(`fetchTicker(${sym}) returned:`, res);
    } catch (e: any) {
      console.log(`fetchTicker(${sym}) threw:`, e.name, e.message);
    }
  }

  // Test 2: fetchOrderBook with malformed symbols & negative limits
  console.log("\n--- TEST 2: fetchOrderBook parameters ---");
  for (const lim of [-1, 0, 99999999, NaN, "five" as any]) {
    try {
      const res = await (exchange as any).fetchOrderBook("WBTC/USDso:USDso", lim);
      console.log(`fetchOrderBook(WBTC, ${lim}) returned:`, res ? "ok" : "empty");
    } catch (e: any) {
      console.log(`fetchOrderBook(WBTC, ${lim}) threw:`, e.name, e.message);
    }
  }

  // Test 3: fetchFundingRate on non-perp or invalid symbol
  console.log("\n--- TEST 3: fetchFundingRate ---");
  for (const sym of ["WBTC/USDso:USDso", "INVALID/PAIR", ""]) {
    try {
      const res = await (exchange as any).fetchFundingRate(sym);
      console.log(`fetchFundingRate(${sym}) returned:`, res);
    } catch (e: any) {
      console.log(`fetchFundingRate(${sym}) threw:`, e.name, e.message);
    }
  }

  // Test 4: depositMargin with invalid params
  console.log("\n--- TEST 4: depositMargin parameter validation ---");
  for (const amt of [-1, 0, NaN, Infinity, "abc", "0.000000000000000000000000001", null as any]) {
    try {
      const res = await (exchange as any).depositMargin("WBTC/USDso:USDso", amt);
      console.log(`depositMargin(WBTC, ${amt}) returned:`, res);
    } catch (e: any) {
      console.log(`depositMargin(WBTC, ${amt}) threw:`, e.name, e.message);
    }
  }

  // Test 5: createOrder validation without signer
  console.log("\n--- TEST 5: createOrder parameter validation ---");
  const testCases = [
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "buy", amount: -1, price: 50000 },
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "buy", amount: 0, price: 50000 },
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "buy", amount: NaN, price: 50000 },
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "buy", amount: 1, price: -500 },
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "buy", amount: 1, price: 0 },
    { symbol: "WBTC/USDso:USDso", type: "invalid_type", side: "buy", amount: 1, price: 50000 },
    { symbol: "WBTC/USDso:USDso", type: "limit", side: "invalid_side", amount: 1, price: 50000 },
    { symbol: "NOT_A_MARKET", type: "limit", side: "buy", amount: 1, price: 50000 },
  ];

  for (const tc of testCases) {
    try {
      const res = await (exchange as any).createOrder(tc.symbol, tc.type, tc.side, tc.amount, tc.price);
      console.log(`createOrder(${JSON.stringify(tc)}) returned:`, res);
    } catch (e: any) {
      console.log(`createOrder(${tc.type}, ${tc.side}, amt=${tc.amount}, prc=${tc.price}) threw:`, e.name, e.message);
    }
  }

  // Test 6: createStopOrder validation
  console.log("\n--- TEST 6: createStopOrder parameter validation ---");
  try {
    const res = await (exchange as any).createStopOrder("WBTC/USDso:USDso", "stop", "buy", 1, 50000, 49000);
    console.log("createStopOrder returned:", res);
  } catch (e: any) {
    console.log("createStopOrder threw:", e.name, e.message);
  }

  console.log("\n=== FUZZING COMPLETED ===");
}

runFuzz().catch(console.error);
