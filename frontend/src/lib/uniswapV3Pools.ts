// Config for reading live prices directly off SaucerSwap V2 (Uniswap V3-fork)
// pool contracts on Hedera mainnet, for the pairs GeckoTerminal has no push
// feed for. Every address/decimals/direction below was verified against real
// on-chain data: token0()/token1()/decimals() via eth_call, and the resulting
// price cross-checked against SaucerSwap's own reported USD prices (matched
// within ~1%). See lib/market.ts for the matching GeckoTerminal pool ids.
export interface PoolTickConfig {
  address: string;
  token0Decimals: number;
  token1Decimals: number;
  /** token1PerToken0 is the human-unit ratio decoded from the pool's own
   *  sqrtPriceX96; hbarUsd is only needed for pools quoted in HBAR. Returns
   *  the pair's quote-per-base price (same convention as the rest of the app). */
  toQuotePerBase: (token1PerToken0: number, hbarUsd?: number) => number;
}

export const POOL_TICK_CONFIG: Record<string, PoolTickConfig> = {
  // Pool token0=USDC(6dp), token1=SAUCE(6dp) -> ratio is SAUCE per USDC.
  // Pair is base=SAUCE, quote=USDC, so quote/base = 1/ratio.
  'SAUCE-USDC': {
    address: '0x36acdfe1cbf9098bdb7a3c62b8eaa1016c111e31',
    token0Decimals: 6,
    token1Decimals: 6,
    toQuotePerBase: (t1t0) => (t1t0 > 0 ? 1 / t1t0 : 0),
  },
  // Pool token0=SAUCE(6dp), token1=HBAR(8dp) -> ratio is HBAR per SAUCE.
  // Pair is base=HBAR, quote=SAUCE, so quote/base = 1/ratio.
  'HBAR-SAUCE': {
    address: '0x5fc19c944f1bccf5159e6ae92dc3bf2ff2576b98',
    token0Decimals: 6,
    token1Decimals: 8,
    toQuotePerBase: (t1t0) => (t1t0 > 0 ? 1 / t1t0 : 0),
  },
  // Pool token0=HBAR(8dp), token1=DOVU(8dp) -> ratio is DOVU per HBAR.
  // Pair is base=DOVU, quote=USDC, so USDC/DOVU = HBAR_USD / (DOVU per HBAR).
  'DOVU-USDC': {
    address: '0x6a1ab8ed2e95c14843be797129936a7b40e39d8b',
    token0Decimals: 8,
    token1Decimals: 8,
    toQuotePerBase: (t1t0, hbarUsd) => (t1t0 > 0 ? (hbarUsd ?? 0) / t1t0 : 0),
  },
};

// Verified Uniswap V3 Swap event topic hash — keccak256 of
// "Swap(address,address,int256,int256,uint160,uint128,int24)" — matched
// against real Swap logs on all three pools above (decoded price agreed
// with SaucerSwap's own reported price within ~1%).
export const SWAP_TOPIC = '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67';
