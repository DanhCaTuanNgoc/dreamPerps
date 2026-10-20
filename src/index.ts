import { Command } from "commander";
import { config } from "./config/index.js";
import { MarketService } from "./services/marketService.js";
import { GridStrategy } from "./strategies/gridStrategy.js";
import { SentinelStrategy } from "./strategies/sentinelStrategy.js";
import { logger } from "./utils/logger.js";

const program = new Command();

program
  .name("dreamdex-perps-agent")
  .description("dreamDEX Perps Sentinel & Algorithmic Trading Agent on Somnia Tokyo Testnet")
  .version("1.0.0")
  .option("-d, --dry-run", "Run in dry-run mode without placing on-chain transactions", false)
  .option("-s, --strategy <type>", "Strategy to execute (grid, sentinel, all)", "all")
  .parse(process.argv);

const options = program.opts();

if (options.dryRun) {
  config.trading.dryRun = true;
}

async function startAgent() {
  console.log(`
  ======================================================
     🚀 dreamDEX Perps Sentinel & Grid Agent
     🌐 Network: Somnia Tokyo Testnet (Chain ID 50312)
     ⚙️ Mode: ${config.trading.dryRun ? "DRY-RUN (Simulated)" : "LIVE TESTNET"}
  ======================================================
  `);

  const marketService = new MarketService();
  const sentinel = new SentinelStrategy(marketService);
  const grid = new GridStrategy(marketService);

  if (options.strategy === "sentinel" || options.strategy === "all") {
    sentinel.start(10000);
  }

  if (options.strategy === "grid" || options.strategy === "all") {
    await grid.start();
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    logger.warn("\nShutting down Agent gracefully...");
    sentinel.stop();
    grid.stop();
    process.exit(0);
  });
}

startAgent().catch((err) => {
  logger.error("Fatal Agent error:", err);
  process.exit(1);
});
