// The 23 crypto markets Bullbit lists (out of its 38 total — the other 15
// are stock/RWA tickers with no equivalent fast public source to read
// directly, so they're out of scope for this feature), each mapped to its
// fastest available direct source. Cross-checked live against Binance's
// own ticker for every symbol before shipping — same discipline that
// caught the earlier LIT/Litentry ticker collision: a wrong-coin match
// here would show a real, confidently-wrong price, not an error.
//
// 'binance' is the direct source for every symbol confirmed live against
// https://data-api.binance.vision/api/v3/ticker/price?symbol=<SYM>USDT on
// 2026-08-30 (22 of 23). The one exception is HYPE: Binance does not spot-
// list it at all (confirmed: "Invalid symbol"), so it uses Pyth's existing
// verified feed instead (see VAULT_WATCH_TOKENS in market.ts) — the same
// feed the rest of the app already trusts for HYPE.
export type FastPriceSource = 'binance' | 'pyth';

export interface BullbitFastMarket {
  sym: string;
  name: string;
  source: FastPriceSource;
  pythFeedId?: string; // only set when source === 'pyth'
}

export const BULLBIT_FAST_MARKETS: BullbitFastMarket[] = [
  { sym: 'BTC', name: 'Bitcoin', source: 'binance' },
  { sym: 'ETH', name: 'Ethereum', source: 'binance' },
  { sym: 'SOL', name: 'Solana', source: 'binance' },
  { sym: 'XRP', name: 'XRP', source: 'binance' },
  { sym: 'BNB', name: 'BNB', source: 'binance' },
  { sym: 'DOGE', name: 'Dogecoin', source: 'binance' },
  { sym: 'SUI', name: 'Sui', source: 'binance' },
  { sym: 'STX', name: 'Stacks', source: 'binance' },
  { sym: 'AAVE', name: 'Aave', source: 'binance' },
  { sym: 'APT', name: 'Aptos', source: 'binance' },
  // Binance does not spot-list HYPE — confirmed live, "Invalid symbol".
  { sym: 'HYPE', name: 'Hyperliquid', source: 'pyth', pythFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b' },
  { sym: 'TAO', name: 'Bittensor', source: 'binance' },
  { sym: 'LINK', name: 'Chainlink', source: 'binance' },
  { sym: 'SAND', name: 'The Sandbox', source: 'binance' },
  { sym: 'NEAR', name: 'NEAR Protocol', source: 'binance' },
  { sym: 'ZEC', name: 'Zcash', source: 'binance' },
  { sym: 'LTC', name: 'Litecoin', source: 'binance' },
  { sym: 'DOT', name: 'Polkadot', source: 'binance' },
  { sym: 'AVAX', name: 'Avalanche', source: 'binance' },
  { sym: 'ADA', name: 'Cardano', source: 'binance' },
  { sym: 'PUMP', name: 'Pump.fun', source: 'binance' },
  // Binance's own PEPEUSD/BONKUSD tickers are already per-single-token —
  // unlike Bullbit's "1000PEPE"/"1000BONK" naming, no /1000 scale
  // correction is needed here. Confirmed live: Binance PEPEUSDT read
  // 0.0000037, matching real per-token PEPE price directly.
  { sym: 'PEPE', name: 'Pepe', source: 'binance' },
  { sym: 'BONK', name: 'Bonk', source: 'binance' },
];
