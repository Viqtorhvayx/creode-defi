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
// QUOTE CURRENCY — checked, because it is the obvious thing to get wrong.
// Bullbit names its markets BTCUSD, so the natural assumption is that they are
// USD-quoted and that a USDT read needs converting, the way the Gains tab does
// it. Measured against their live index, that assumption is FALSE:
//
//   symbol   bullbit index   our raw USDT read   gap raw   gap if converted
//   BTC         78240.515           78243.735     +0.4bp        -7.9bp
//   ETH           2513.03             2513.175    +0.6bp        -7.8bp
//   SOL           106.105             106.095     -0.9bp        -9.3bp
//   BNB           753.235             753.275     +0.5bp        -7.8bp
//
// Their "USD" prices track the USDT book. Applying a USDT/USD conversion here
// would introduce an 8bp error rather than remove one, so the raw read is
// correct and is deliberately left alone. Confirmed 2026-09-18 at
// USDT/USD = 0.999165.
export type FastPriceSource = 'binance' | 'pyth';

export interface BullbitFastMarket {
  sym: string;
  name: string;
  source: FastPriceSource;
  pythFeedId?: string; // only set when source === 'pyth'
  /** Bullbit lists some meme tokens per 1000 units. Our source is per single
   *  token, so the displayed number is multiplied by this to match what the
   *  venue actually shows. Absent means 1. */
  displayScale?: number;
  /** How Bullbit names the market, when that differs from `sym`. */
  venueSymbol?: string;
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
  // A CORRECTION. This previously read "no /1000 scale correction is needed
  // here", on the reasoning that Binance's PEPEUSDT is already per-single-token.
  // That reasoning was right about Binance and wrong about the conclusion:
  // Bullbit LISTS these per 1000 units, so a per-token number is what the
  // venue shows divided by a thousand, and the tab was displaying a price
  // 1000x away from the one on their screen.
  //
  // Measured against their live index on 2026-09-18:
  //   bullbit 1000PEPEUSD = 0.00370120   our per-token read = 0.000003705
  //   bullbit 1000BONKUSD = 0.00281400   our per-token read = 0.000002815
  // Exactly 1000x in both cases.
  { sym: 'PEPE', name: 'Pepe', source: 'binance', displayScale: 1000, venueSymbol: '1000PEPE' },
  { sym: 'BONK', name: 'Bonk', source: 'binance', displayScale: 1000, venueSymbol: '1000BONK' },
];
