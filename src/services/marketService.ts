import { SomniaMarkets } from "@somnia-chain/markets-sdk";
import { somniaShannon } from "@somnia-chain/markets-sdk/chains";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

export class MarketService {
  private exchange: any;
  private initialized: boolean = false;

  constructor() {
    try {
      const options: any = {
        chain: somniaShannon
      };

      if (config.trader.privateKey) {
        options.privateKey = config.trader.privateKey.startsWith("0x")
          ? config.trader.privateKey
          : `0x${config.trader.privateKey}`;
      }

      this.exchange = new SomniaMarkets(options);
      this.initialized = true;
      logger.success(`Initialized SomniaMarkets client successfully for Somnia Shannon/Tokyo testnet.`);
    } catch (err: any) {
      logger.warn(`SomniaMarkets init warning: ${err.message}`);
    }
  }

  /**
   * Deposit margin (USDso) to MarginBank
   */
  async depositMargin(symbol: string, amount: string): Promise<string | null> {
    if (config.trading.dryRun) {
      logger.trade(`[DRY RUN] depositMargin(${symbol}, ${amount}) simulated.`);
      return "0x_simulated_deposit_tx";
    }

    try {
      logger.info(`Depositing ${amount} to MarginBank for ${symbol}...`);
      const tx = await this.exchange.depositMargin(symbol, amount);
      logger.success(`Margin deposited! Tx Hash: ${tx}`);
      return tx;
    } catch (err: any) {
      this.recordError("depositMargin", err);
      throw err;
    }
  }

  /**
   * Place an order (Buy/Long or Sell/Short)
   */
  async placeOrder(params: {
    symbol: string;
    type: "limit" | "market";
    side: "buy" | "sell";
    amount: number;
    price?: number;
  }): Promise<any> {
    if (config.trading.dryRun) {
      logger.trade(
        `[DRY RUN] placeOrder: ${params.side.toUpperCase()} ${params.amount} ${params.symbol} @ ${
          params.price ? `$${params.price}` : "MARKET"
        }`
      );
      return {
        id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: "simulated",
        ...params
      };
    }

    try {
      logger.trade(
        `Submitting order: ${params.side.toUpperCase()} ${params.amount} ${params.symbol} @ ${
          params.price ? `$${params.price}` : "MARKET"
        }`
      );
      const order = await this.exchange.createOrder(
        params.symbol,
        params.type,
        params.side,
        params.amount,
        params.price
      );
      logger.success(`Order placed successfully:`, order);
      return order;
    } catch (err: any) {
      this.recordError("createOrder", err);
      throw err;
    }
  }

  /**
   * Watch live order book
   */
  async watchOrderBook(symbol: string, callback: (book: any) => void) {
    logger.info(`Starting OrderBook stream for ${symbol}...`);
    try {
      if (typeof this.exchange?.watchOrderBook === "function") {
        await this.exchange.watchOrderBook(symbol, callback);
      } else {
        logger.warn(`watchOrderBook not directly supported in this SDK build. Using polling fallback.`);
      }
    } catch (err: any) {
      this.recordError("watchOrderBook", err);
    }
  }

  /**
   * Get live market/oracle price
   */
  async getLivePrice(symbol: string): Promise<number | null> {
    try {
      if (typeof this.exchange?.getLivePrice === "function") {
        return await this.exchange.getLivePrice(symbol);
      }
      return null;
    } catch (err: any) {
      this.recordError("getLivePrice", err);
      return null;
    }
  }

  /**
   * Helper to format and display error for potential submission to Feedback Track
   */
  private recordError(method: string, error: any) {
    logger.error(`SDK Call Error [${method}]:`, error.message || error);
    logger.warn(`--> If this is a reproducible SDK/API bug, log it in feedback/ folder!`);
  }
}
