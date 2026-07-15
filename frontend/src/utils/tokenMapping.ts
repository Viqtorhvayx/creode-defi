export const TOKEN_MAPPINGS: Record<string, string> = {
  HBAR: '0.0.1456986', // WHBAR is typically used for HBAR pricing
  USDC: '0.0.456858',
  USDT: '0.0.105548',
  SAUCE: '0.0.731861',
  DOVU: '0.0.3716059',
  PACK: '0.0.4794920',
  WETH: '0.0.859814',
  WBTC: '0.0.1050630',
  JAM: '0.0.1278772',
  BONZO: '0.0.1456986' // Fallback to WHBAR if unknown, or use specific ID
};

export interface SaucerSwapToken {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
}
