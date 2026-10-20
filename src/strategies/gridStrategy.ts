import { MarketService } from "../services/marketService.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export class GridStrategy {
  private marketService: MarketService;
  private activeOrders: any[] = [];
  private isRunning: boolean = false;

  constructor(marketService: MarketService) {
    this.marketService = marketService;
  }

  /**
   * Calculate grid levels based on upper/lower bounds and level count
   */
  calculateGridLevels(): number[] {
    const { lowerPrice, upperPrice, levels } = config.grid;
    const step = (upperPrice - lowerPrice) / levels;
    const pricePoints: number[] = [];

    for (let i = 0; i <= levels; i++) {
      pricePoints.push(Number((lowerPrice + i * step).toFixed(2)));
    }
    return pricePoints;
  }

  /**
   * Start executing the grid strategy
   */
  async start() {
    this.isRunning = true;
    logger.sentinel(`--- Starting dreamDEX Perps Grid Engine ---`);
    logger.info(`Trading Pair: ${config.trading.tradingPair}`);
    logger.info(`Grid Range: $${config.grid.lowerPrice} - $${config.grid.upperPrice} across ${config.grid.levels} levels`);
    logger.info(`Order Size: ${config.grid.orderSize} per grid level`);
    logger.info(`Mode: ${config.trading.dryRun ? "DRY-RUN (Simulated)" : "LIVE TESTNET EXECUTION"}`);

    const levels = this.calculateGridLevels();
    logger.info(`Calculated Grid Levels: ${levels.join(", ")}`);

    // Fetch current price or use mid price
    const currentPrice = await this.marketService.getLivePrice(config.trading.tradingPair) || 67500;
    logger.info(`Reference Market Price: $${currentPrice}`);

    for (const levelPrice of levels) {
      if (!this.isRunning) break;

      if (levelPrice < currentPrice) {
        // Buy limit order below current market price
        logger.trade(`Setting Buy Grid Limit @ $${levelPrice}`);
        await this.marketService.placeOrder({
          symbol: config.trading.tradingPair,
          type: "limit",
          side: "buy",
          amount: config.grid.orderSize,
          price: levelPrice
        });
      } else if (levelPrice > currentPrice) {
        // Sell limit order above current market price
        logger.trade(`Setting Sell Grid Limit @ $${levelPrice}`);
        await this.marketService.placeOrder({
          symbol: config.trading.tradingPair,
          type: "limit",
          side: "sell",
          amount: config.grid.orderSize,
          price: levelPrice
        });
      }
    }

    logger.success(`All grid orders positioned. Listening to market movements...`);
  }

  stop() {
    this.isRunning = false;
    logger.warn(`Grid strategy stopped.`);
  }
}
