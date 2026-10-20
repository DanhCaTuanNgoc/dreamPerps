import { createPublicClient, http } from "viem";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";
import { MarketService } from "../services/marketService.js";

async function main() {
  logger.info(`=== Testing Connection to Somnia Network ===`);
  logger.info(`Chain ID: ${config.network.chainId}`);
  logger.info(`RPC URL:  ${config.network.rpcUrl}`);

  try {
    const client = createPublicClient({
      transport: http(config.network.rpcUrl)
    });

    const blockNumber = await client.getBlockNumber();
    logger.success(`Connected to Somnia Testnet! Current Block Number: ${blockNumber}`);

    logger.info(`Initializing MarketService...`);
    const service = new MarketService();
    logger.success(`MarketService instantiated successfully!`);
    
    if (!config.trader.privateKey) {
      logger.warn(`No PRIVATE_KEY set in .env. Remember to add it once you faucet your testnet wallet!`);
    } else {
      logger.success(`Private key detected in .env`);
    }

  } catch (error: any) {
    logger.error(`Connection failed:`, error.message);
  }
}

main();
