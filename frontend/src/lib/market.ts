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

// Vault tab's "Market" chart — a fast, multi-pair price watch (display only,
// not tied to what's depositable in the Vault). Every feed id below was
// verified live against https://hermes.pyth.network/v2/price_feeds. CoinGecko
// ids drive the market-cap/rank/volume footer stats (best-effort — if a
// CoinGecko call fails, those stats just fall back to blanks, same tolerance
// pattern already used for token logos elsewhere in the app).
export interface VaultWatchToken { sym: string; name: string; pythFeedId: string; coingeckoId: string }
export const VAULT_WATCH_TOKENS: VaultWatchToken[] = [
  { sym: 'HBAR', name: 'Hedera', pythFeedId: '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd', coingeckoId: 'hedera-hashgraph' },
  { sym: 'BTC', name: 'Bitcoin', pythFeedId: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43', coingeckoId: 'bitcoin' },
  { sym: 'ETH', name: 'Ethereum', pythFeedId: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', coingeckoId: 'ethereum' },
  { sym: 'SOL', name: 'Solana', pythFeedId: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d', coingeckoId: 'solana' },
  { sym: 'HYPE', name: 'Hyperliquid', pythFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b', coingeckoId: 'hyperliquid' },
  { sym: 'XRP', name: 'XRP', pythFeedId: 'ec5d399846a9209f3fe5881d70aae9268c94339ff9817e8d18ff19fa05eea1c8', coingeckoId: 'ripple' },
  { sym: 'BNB', name: 'BNB', pythFeedId: '2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f', coingeckoId: 'binancecoin' },
  { sym: 'DOGE', name: 'Dogecoin', pythFeedId: 'dcef50dd0a4cd2dcc17e45df1676dcb336a11a61c69df7a0299b0150c672d25c', coingeckoId: 'dogecoin' },
  { sym: 'SUI', name: 'Sui', pythFeedId: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744', coingeckoId: 'sui' },
  { sym: 'AVAX', name: 'Avalanche', pythFeedId: '93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7', coingeckoId: 'avalanche-2' },
  { sym: 'LINK', name: 'Chainlink', pythFeedId: '8ac0c70fff57e9aefdf5edf44b51d62c2d433653cbb2cf5cc06bb115af04d221', coingeckoId: 'chainlink' },
  { sym: 'AAVE', name: 'Aave', pythFeedId: '2b9ab1e972a281585084148ba1389800799bd4be63b957507db1349314e47445', coingeckoId: 'aave' },
  { sym: 'TON', name: 'Toncoin', pythFeedId: '8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026', coingeckoId: 'the-open-network' },
  { sym: 'NEAR', name: 'NEAR Protocol', pythFeedId: 'c415de8d2eba7db216527dff4b60e8f3a5311c740dadb233e13e12547e226750', coingeckoId: 'near' },
  { sym: 'TAO', name: 'Bittensor', pythFeedId: '410f41de235f2db824e562ea7ab2d3d3d4ff048316c61d629c0b93f58584e1af', coingeckoId: 'bittensor' },
  { sym: 'ZEC', name: 'Zcash', pythFeedId: 'be9b59d178f0d6a97ab4c343bff2aa69caa1eaae3e9048a65788c529b125bb24', coingeckoId: 'zcash' },
  { sym: 'PENGU', name: 'Pudgy Penguins', pythFeedId: 'bed3097008b9b5e3c93bec20be79cb43986b85a996475589351a21e67bae9b61', coingeckoId: 'pudgy-penguins' },
  { sym: 'PEPE', name: 'Pepe', pythFeedId: 'd69731a2e74ac1ce884fc3890f7ee324b6deb66147055249568869ed700882e4', coingeckoId: 'pepe' },
  { sym: 'ASTER', name: 'Aster', pythFeedId: 'a903b5a82cb572397e3d47595d2889cf80513f5b4cf7a36b513ae10cc8b1e338', coingeckoId: 'aster-2' },
  { sym: 'WLFI', name: 'World Liberty Financial', pythFeedId: 'd41369178d64f41d51ca95465c144a2c74d2fff30be69164835911943fa64c3e', coingeckoId: 'world-liberty-financial' },
  { sym: 'FARTCOIN', name: 'Fartcoin', pythFeedId: '58cd29ef0e714c5affc44f269b2c1899a52da4169d7acc147b9da692e6953608', coingeckoId: 'fartcoin' },
];

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
