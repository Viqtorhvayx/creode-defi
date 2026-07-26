// Real market data for the P2P tab — Pyth Network (majors) + GeckoTerminal
// (Hedera/SaucerSwap DEX) for the small-caps. No mock data. Shared by the
// client components and the /api/market/* server routes (which do the actual
// upstream fetch to sidestep CORS and add caching).

export type Timeframe = '15m' | '1H' | '4H' | '1D' | '1W';

export interface Candle { time: number; open: number; high: number; low: number; close: number }

export interface PairIcon { label: string; bg: string; fg: string }

export interface MarketPair {
  id: string;            // 'HBAR-USDC'
  base: string;
  quote: string;
  source: 'pyth' | 'gecko' | 'derived';
  pythSymbol?: string;   // for source === 'pyth' (and derived numerator)
  geckoPool?: string;    // for source === 'gecko' (and derived denominator, priced in USD)
  volumePool: string;    // GeckoTerminal Hedera pool used for the real 24h volume badge
  baseIcon: PairIcon;
  quoteIcon: PairIcon;
  tradeable: boolean;
}

const USDC: PairIcon = { label: '$', bg: '#2775CA', fg: '#fff' };
const USDT: PairIcon = { label: '₮', bg: '#26A17B', fg: '#fff' };
const HBAR: PairIcon = { label: 'ℏ', bg: '#000', fg: '#fff' };
const WBTC: PairIcon = { label: '₿', bg: '#F7931A', fg: '#fff' };
const WETH: PairIcon = { label: 'Ξ', bg: '#627EEA', fg: '#fff' };
const SAUCE: PairIcon = { label: 'S', bg: '#E1274B', fg: '#fff' };
const DOVU: PairIcon = { label: 'D', bg: '#11A67A', fg: '#fff' };

// Hedera pools verified live on GeckoTerminal (real 24h volume / OHLCV).
const POOL_HBAR_USDC = '0xc5b707348da504e9be1bd4e21525459830e7b11d'; // WHBAR/USDC
const POOL_USDT_USDC = '0x017ee56b8a9098f5a9bde20075deb0c5a6906ef1'; // USDT0/USDC
const POOL_WBTC_USDC = '0x3c8dbcb8475450569091f8c311b558d62cc39cf7'; // WBTC/USDC
const POOL_WETH_USDC = '0xca10a83f75df85c2796023bb6b52473302d6f63a'; // WETH/USDC
const POOL_SAUCE_USDC = '0x36acdfe1cbf9098bdb7a3c62b8eaa1016c111e31'; // SAUCE/USDC
const POOL_DOVU_HBAR = '0x6a1ab8ed2e95c14843be797129936a7b40e39d8b'; // DOVU/WHBAR (USD-denominated)
const POOL_SAUCE_HBAR = '0x5fc19c944f1bccf5159e6ae92dc3bf2ff2576b98'; // SAUCE/WHBAR

export const PAIRS: MarketPair[] = [
  { id: 'HBAR-USDC', base: 'HBAR', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.HBAR/USD', volumePool: POOL_HBAR_USDC, baseIcon: HBAR, quoteIcon: USDC, tradeable: true },
  { id: 'USDT-USDC', base: 'USDT', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.USDT/USD', volumePool: POOL_USDT_USDC, baseIcon: USDT, quoteIcon: USDC, tradeable: true },
  { id: 'WBTC-USDC', base: 'WBTC', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.WBTC/USD', volumePool: POOL_WBTC_USDC, baseIcon: WBTC, quoteIcon: USDC, tradeable: true },
  { id: 'WETH-USDC', base: 'WETH', quote: 'USDC', source: 'pyth', pythSymbol: 'Crypto.WETH/USD', volumePool: POOL_WETH_USDC, baseIcon: WETH, quoteIcon: USDC, tradeable: true },
  { id: 'SAUCE-USDC', base: 'SAUCE', quote: 'USDC', source: 'gecko', geckoPool: POOL_SAUCE_USDC, volumePool: POOL_SAUCE_USDC, baseIcon: SAUCE, quoteIcon: USDC, tradeable: true },
  { id: 'DOVU-USDC', base: 'DOVU', quote: 'USDC', source: 'gecko', geckoPool: POOL_DOVU_HBAR, volumePool: POOL_DOVU_HBAR, baseIcon: DOVU, quoteIcon: USDC, tradeable: true },
  { id: 'HBAR-SAUCE', base: 'HBAR', quote: 'SAUCE', source: 'derived', pythSymbol: 'Crypto.HBAR/USD', geckoPool: POOL_SAUCE_USDC, volumePool: POOL_SAUCE_HBAR, baseIcon: HBAR, quoteIcon: SAUCE, tradeable: true },
];

export const getPair = (id: string): MarketPair => PAIRS.find((p) => p.id === id) || PAIRS[0];

// Pyth Hermes price-feed ids (verified against https://hermes.pyth.network/v2/price_feeds)
// for the "majors" pairs, keyed by the same pythSymbol string already on each
// pair. Used to open a live price stream instead of polling for a snapshot.
export const PYTH_FEED_IDS: Record<string, string> = {
  'Crypto.HBAR/USD': '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd',
  'Crypto.USDT/USD': '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'Crypto.WBTC/USD': 'c9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
  'Crypto.WETH/USD': '9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a2b85399db8d5000960f6',
};

// Timeframe → upstream resolution. secs = candle width in seconds.
export const RESOLUTIONS: Record<Timeframe, { pyth: string; geckoTf: 'minute' | 'hour' | 'day'; geckoAgg: number; secs: number }> = {
  '15m': { pyth: '15', geckoTf: 'minute', geckoAgg: 15, secs: 900 },
  '1H': { pyth: '60', geckoTf: 'hour', geckoAgg: 1, secs: 3600 },
  '4H': { pyth: '240', geckoTf: 'hour', geckoAgg: 4, secs: 14400 },
  '1D': { pyth: '1D', geckoTf: 'day', geckoAgg: 1, secs: 86400 },
  '1W': { pyth: '1W', geckoTf: 'day', geckoAgg: 1, secs: 604800 },
};

// ── Display helpers ──────────────────────────────────────────────────────
export const formatVolume = (v: number): string => {
  if (!v || v <= 0) return '$0';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

// Sensible price precision for both $60k and $0.0012 assets.
export const formatPrice = (v: number): string => {
  if (!v || v <= 0) return '0';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (v >= 0.01) return v.toLocaleString(undefined, { maximumFractionDigits: 5 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 7 });
};

// ── Client fetchers (call our own API routes) ──────────────────────────────
export async function fetchCandles(pairId: string, tf: Timeframe): Promise<Candle[]> {
  const res = await fetch(`/api/market/candles?pair=${encodeURIComponent(pairId)}&tf=${tf}`);
  if (!res.ok) throw new Error(`candles ${res.status}`);
  const data = await res.json();
  return data.candles as Candle[];
}

export interface PairStat { volume24h: number; change24h: number; price: number }

export async function fetchPairStats(): Promise<Record<string, PairStat>> {
  const res = await fetch('/api/market/stats');
  if (!res.ok) throw new Error(`stats ${res.status}`);
  return (await res.json()).stats as Record<string, PairStat>;
}
