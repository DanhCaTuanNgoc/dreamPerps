import chalk from "chalk";

export const logger = {
  info: (msg: string, ...args: any[]) => {
    console.log(chalk.blue(`[INFO]  `), msg, ...args);
  },
  success: (msg: string, ...args: any[]) => {
    console.log(chalk.green(`[SUCCESS]`), msg, ...args);
  },
  warn: (msg: string, ...args: any[]) => {
    console.log(chalk.yellow(`[WARN]  `), msg, ...args);
  },
  error: (msg: string, ...args: any[]) => {
    console.error(chalk.red(`[ERROR] `), msg, ...args);
  },
  trade: (msg: string, ...args: any[]) => {
    console.log(chalk.magentaBright(`[TRADE] `), msg, ...args);
  },
  sentinel: (msg: string, ...args: any[]) => {
    console.log(chalk.cyanBright(`[SENTINEL]`), msg, ...args);
  }
};
