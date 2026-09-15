// Hotstuff's 7 live crypto perp markets, each mapped to both Hotstuff's own
// oracle symbol and the fastest direct source Creode can read independently.
//
// Hotstuff also lists 20 non-crypto perps (equities, commodities, FX, and a
// SpaceX pre-IPO market) — those are out of scope here for the same reason
// as the Bullbit tab: there's no equivalent fast public source to read them
// from directly, so Creode couldn't show anything ahead of Hotstuff's own
// number for them.
//
// Measured against Hotstuff's live API before shipping (2026-09-15, BTC/USDC,
// ~2.5min sample):
//   - Their oracle refreshes every ~2.16s (69 value changes over 149s)
//   - Cross-correlation vs raw Binance peaks at ~3.2-3.5s lag, stable across
//     200ms/100ms/400ms resampling grids
//   - BUT the actual price gap is small: median 0.0127% (~$9.74 on BTC at
//     $77k), p95 0.0441%, max 0.0894%
// The lead is real and the largest measured across any venue checked, but see
// the disclaimer in HotstuffFastPriceTab.tsx for why a slow *oracle* is not
// the same thing as a slow *tradable price*.
export type FastPriceSource = 'binance' | 'pyth';

export interface HotstuffMarket {
  sym: string;
  name: string;
  oracleSymbol: string; // Hotstuff's own symbol, for POST /info method:"oracle"
  source: FastPriceSource;
  pythFeedId?: string; // only when source === 'pyth'
}

export const HOTSTUFF_API = 'https://api.hotstuff.trade/info';

export const HOTSTUFF_MARKETS: HotstuffMarket[] = [
  { sym: 'BTC', name: 'Bitcoin', oracleSymbol: 'BTC/USDC', source: 'binance' },
  { sym: 'ETH', name: 'Ethereum', oracleSymbol: 'ETH/USDC', source: 'binance' },
  { sym: 'SOL', name: 'Solana', oracleSymbol: 'SOL/USDC', source: 'binance' },
  { sym: 'XRP', name: 'XRP', oracleSymbol: 'XRP/USDC', source: 'binance' },
  { sym: 'BNB', name: 'BNB', oracleSymbol: 'BNB/USDC', source: 'binance' },
  { sym: 'ZEC', name: 'Zcash', oracleSymbol: 'ZEC/USDC', source: 'binance' },
  // Binance does not spot-list HYPE (confirmed live: "Invalid symbol"), so
  // this one uses the same verified Pyth feed the rest of the app already
  // trusts for HYPE — see VAULT_WATCH_TOKENS in market.ts.
  {
    sym: 'HYPE',
    name: 'Hyperliquid',
    oracleSymbol: 'HYPE/USDC',
    source: 'pyth',
    pythFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b',
  },
];

export interface HotstuffOracleTick {
  indexPrice: number;
  extMarkPrice: number;
  updatedAt: number; // unix seconds, Hotstuff's own timestamp
}

/** Reads Hotstuff's published oracle for one symbol. Their API sends
 *  `access-control-allow-origin: *`, so this is called straight from the
 *  browser — no relay or proxy route in the path, which matters for a
 *  latency-focused readout. */
export async function fetchHotstuffOracle(oracleSymbol: string): Promise<HotstuffOracleTick | null> {
  try {
    const res = await fetch(HOTSTUFF_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'oracle', params: { symbol: oracleSymbol } }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    const indexPrice = Number(d.index_price);
    const extMarkPrice = Number(d.ext_mark_price);
    const updatedAt = Number(d.updated_at);
    if (!Number.isFinite(indexPrice)) return null;
    return { indexPrice, extMarkPrice, updatedAt };
  } catch {
    return null;
  }
}
