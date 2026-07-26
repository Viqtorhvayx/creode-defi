// Hedera MAINNET token IDs used only to look up a live USD reference price
// from SaucerSwap's mainnet API (api.saucerswap.finance) for the testnet
// mock tokens the Vault actually deposits/withdraws (see TOKEN_EVM_ADDRESSES
// in VaultTab.tsx, which is unrelated and unaffected by this file). Every ID
// below is verified against Hedera Mirror Node's mainnet API (name/symbol
// match) as of 2026-07-25.
export const TOKEN_MAPPINGS: Record<string, string> = {
  HBAR: '0.0.1456986', // WHBAR is typically used for HBAR pricing
  USDC: '0.0.456858',
  USDT: '0.0.1055472', // USDT[hts] "Tether USD" (was a non-existent ID)
  SAUCE: '0.0.731861',
  DOVU: '0.0.3716059',
  PACK: '0.0.4794920',
  WETH: '0.0.541564', // WETH[hts] "Wrapped Ether[hts]" (was Calaxy's CLXY id)
  WBTC: '0.0.1055483', // WBTC[hts] "Wrapped BTC" (was a non-existent ID)
  JAM: '0.0.127877', // Tune.FM (previous id had a stray trailing digit)
  BONZO: '0.0.8279134', // Bonzo Finance (previously fell back to HBAR's id)
};

export interface SaucerSwapToken {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
}
