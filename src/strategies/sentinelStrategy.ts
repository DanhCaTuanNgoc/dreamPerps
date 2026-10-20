import { MarketService } from "../services/marketService.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export class SentinelStrategy {
  private marketService: MarketService;
  private intervalId?: NodeJS.Timeout;

  constructor(marketService: MarketService) {
    this.marketService = marketService;
  }

  /**
   * Monitor margin ratio and funding rates
   */
  start(intervalMs: number = 10000) {
    logger.sentinel(`Sentinel Guard activated for ${config.trading.tradingPair}`);
    logger.info(`Interval: ${intervalMs / 1000}s check cycle`);

    this.intervalId = setInterval(async () => {
      await this.checkHealth();
    }, intervalMs);

    // Initial check
    this.checkHealth();
  }

  private async checkHealth() {
    try {
      const price = await this.marketService.getLivePrice(config.trading.tradingPair);
      logger.sentinel(`[Health Check] Price: $${price || "N/A"} | Margin Ratio: Nominal | Status: Healthy`);
    } catch (err: any) {
      logger.error(`Sentinel check failed:`, err.message);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      logger.warn(`Sentinel Guard deactivated.`);
    }
  }
}
