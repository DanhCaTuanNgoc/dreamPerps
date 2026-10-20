import dotenv from "dotenv";

dotenv.config();

export interface AppConfig {
  network: {
    chainId: number;
    rpcUrl: string;
    wsRpcUrl: string;
  };
  trader: {
    privateKey?: string;
  };
  trading: {
    tradingPair: string;
    defaultLeverage: number;
    dryRun: boolean;
  };
  grid: {
    lowerPrice: number;
    upperPrice: number;
    levels: number;
    orderSize: number;
  };
}

export const config: AppConfig = {
  network: {
    chainId: Number(process.env.NETWORK_CHAIN_ID || 50312),
    rpcUrl: process.env.RPC_URL || "https://dream-rpc.somnia.network",
    wsRpcUrl: process.env.WS_RPC_URL || "wss://api.infra.testnet.somnia.network/ws"
  },
  trader: {
    privateKey: process.env.PRIVATE_KEY
  },
  trading: {
    tradingPair: process.env.TRADING_PAIR || "BTC/USDso:USDso",
    defaultLeverage: Number(process.env.DEFAULT_LEVERAGE || 5),
    dryRun: process.env.DRY_RUN === "true"
  },
  grid: {
    lowerPrice: Number(process.env.GRID_LOWER_PRICE || 60000),
    upperPrice: Number(process.env.GRID_UPPER_PRICE || 75000),
    levels: Number(process.env.GRID_LEVELS || 10),
    orderSize: Number(process.env.ORDER_SIZE || 0.01)
  }
};
