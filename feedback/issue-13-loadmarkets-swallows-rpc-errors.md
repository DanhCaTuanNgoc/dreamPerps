# loadMarkets() swallows RPC errors and network timeouts, silently returning success while leaving markets empty

Severity: major
Area: SDK

## Steps to reproduce
1. Initialize `SomniaMarkets` with valid addresses on Somnia testnet (`somniaShannon`).
2. Simulate a network drop, socket timeout, or rate-limited RPC endpoint by directing `rpcUrls` to an unreachable transport or experiencing micro-latency during high concurrency.
3. Execute the following minimal reproduction script:
```javascript
const { SomniaMarkets, SOMNIA_TESTNET_ADDRESSES } = require('@somnia-chain/markets-sdk');
const { somniaShannon } = require('@somnia-chain/markets-sdk/chains');

async function reproduce() {
  // Simulate an RPC outage / network timeout
  const brokenChain = {
    ...somniaShannon,
    rpcUrls: {
      default: { http: ['http://127.0.0.1:19999'], webSocket: ['ws://127.0.0.1:19999'] },
      public: { http: ['http://127.0.0.1:19999'], webSocket: ['ws://127.0.0.1:19999'] }
    }
  };

  const exchange = new SomniaMarkets({
    chain: brokenChain,
    addresses: SOMNIA_TESTNET_ADDRESSES
  });

  // Step 1: Call loadMarkets() during RPC failure
  console.log("Calling loadMarkets()...");
  await exchange.loadMarkets(); // Resolves successfully without throwing!
  console.log("exchange.symbols length:", exchange.symbols.length); // 0

  // Step 2: Attempt standard market lookup
  exchange.market('WBTC/USDso:USDso');
}
reproduce();
```
4. Run with `node reproduce.js`.

## Expected
1. In accordance with CCXT standard and robust SDK error handling, if `loadMarkets()` encounters an RPC disconnect, socket failure, or request timeout, it **MUST reject/throw a network error** (such as `RpcError`, `NetworkError`, or `RequestTimeout`).
2. The developer's `try/catch` block around `await exchange.loadMarkets()` should catch the failure so automated bots can trigger connection retries or failover to backup RPC endpoints.
3. The SDK should never falsely resolve `loadMarkets()` with an empty dataset when underlying RPC queries fail.

## Actual
1. `loadEngineMarkets` in `node_modules/@somnia-chain/markets-sdk/dist/unified/exchange.js` catches all discovery errors inside `this.discoverPerpPools(...).catch(...)` and **silently returns an empty array `[]`**:
```javascript
const discovery = track(this.discoverPerpPools(engine, indexerRows, early, closed).catch((err) => {
    if (!closed.aborted)
        this.perpDiscoveryFailures.set(chainId, asDiscoveryFailure(err));
    return []; // <-- Silently swallows RPC error and returns empty array
}));
```
2. `await exchange.loadMarkets()` resolves with `Promise.resolve()` as if market discovery succeeded, leaving `exchange.symbols = []`.
3. When the developer subsequently accesses `exchange.market('WBTC/USDso:USDso')`, the SDK throws:
```text
InvalidInputError: @somnia-chain/markets-sdk: unknown symbol WBTC/USDso:USDso — call loadMarkets() first
```
4. This misleading error incorrectly blames the developer for not calling `loadMarkets()`, when the developer called it on the preceding line.

## Evidence
- Terminal Execution Output:
```text
Calling loadMarkets()...
exchange.symbols length: 0
Downstream error: InvalidInputError - @somnia-chain/markets-sdk: unknown symbol WBTC/USDso:USDso — call loadMarkets() first
```
- Internal Hidden SDK Error (`exchange.perpDiscoveryError`):
```text
RpcError: @somnia-chain/markets-sdk: rpc readContract getBlockNumber failed: An unknown RPC error occurred.
  Details: connect ECONNREFUSED 127.0.0.1:19999
  Internal failedChains: [ 50312 ]
```
- The internal error was captured in `exchange.perpDiscoveryFailures` but intentionally swallowed by `loadEngineMarkets`, preventing the caller from handling the failure.

## Environment
- SDK version: `@somnia-chain/markets-sdk@0.32.1`
- Network: Somnia Tokyo / Shannon Testnet (Chain ID: 50312)
- Wallet address: `0xE50dD8e4aE1b1Dd46334eA22C10129Ee4d6736eF`
- Node.js version: v20.19.0
