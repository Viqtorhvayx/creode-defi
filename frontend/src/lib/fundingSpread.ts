// Funding spreads across perp DEXes — venue metadata, the 30-day baselines
// measured in research/funding-spreads/, and the pair maths.
//
// THE TRADE. Short the venue paying high funding, long the venue paying low,
// same asset, same size. Price risk cancels; you collect the difference for as
// long as you hold.
//
// WHY THERE IS A SPREAD AT ALL. Most venues compute funding as premium PLUS an
// interest-rate baseline, conventionally 0.01% per 8 hours — worth 10.95%/yr.
// dYdX v4 and ApeX do not use it; their funding is premium-only, so they sit
// roughly 11%/yr below everyone who carries it. That is a difference in formula,
// not a dislocation: arbitrage can push the premium components around, it cannot
// delete a constant from someone's equation. The measured Hyperliquid-dYdX BTC
// spread is 10.54%/yr against a predicted 10.95%.
//
// You can see the mechanism in the raw numbers: median hourly funding on
// Hyperliquid, Backpack, Extended and Lighter sits at exactly 12.5e-6/hr, which
// is 0.01%/8h expressed hourly. dYdX's median is 0.00.
//
// WHAT THIS IS NOT. It is not risk-free. Delta is hedged but the funding regime
// is not; both legs need live collateral through a violent move; size is capped
// by the thinner book; and the whole study is 30 days of one regime. See the
// disclaimer in FundingMonitorTab.tsx and the caveats in the research note.

export type Asset = 'BTC' | 'ETH' | 'SOL';

export interface Venue {
  id: string;
  name: string;
  /** Settlement period, confirmed from the venue's own timestamp spacing. */
  intervalH: 1 | 8;
  /** Whether the venue's funding carries the ~0.01%/8h interest baseline. */
  baseline: 'yes' | 'no' | 'unknown';
  /** Top-of-book depth within 10bp, measured once on BTC. Null where untested. */
  depth10bp?: { bid: number; ask: number };
  note?: string;
}

export const VENUES: Venue[] = [
  { id: 'hyperliquid', name: 'Hyperliquid', intervalH: 1, baseline: 'yes',
    depth10bp: { bid: 3_535_548, ask: 7_122_510 } },
  { id: 'backpack', name: 'Backpack', intervalH: 1, baseline: 'yes',
    depth10bp: { bid: 2_543_329, ask: 2_722_423 } },
  { id: 'extended', name: 'Extended', intervalH: 1, baseline: 'yes' },
  { id: 'lighter', name: 'Lighter', intervalH: 1, baseline: 'yes',
    note: 'Publishes funding in percent with a separate direction field.' },
  { id: 'hibachi', name: 'Hibachi', intervalH: 1, baseline: 'unknown',
    note: 'Only ~2 days of history available, so its baseline here is thin.' },
  { id: 'dydx', name: 'dYdX v4', intervalH: 1, baseline: 'no',
    depth10bp: { bid: 30_055, ask: 834_820 },
    note: 'Premium-only funding — no interest baseline. This is what makes it the long leg. Also by far the thinnest book of the venues tested.' },
  { id: 'apex', name: 'ApeX Omni', intervalH: 1, baseline: 'no',
    note: 'Premium-only funding, like dYdX. Frequently negative on ETH and SOL.' },
  { id: 'orderly', name: 'Orderly', intervalH: 8, baseline: 'yes',
    note: 'Swings hard by asset — richest on ETH, negative on SOL over the study window.' },
  { id: 'binance', name: 'Binance', intervalH: 8, baseline: 'yes' },
  { id: 'aster', name: 'Aster', intervalH: 8, baseline: 'yes' },
  { id: 'okx', name: 'OKX', intervalH: 8, baseline: 'yes' },
  { id: 'paradex', name: 'Paradex', intervalH: 8, baseline: 'unknown',
    note: 'Republishes every ~5s rather than settling on a schedule; only a short window of history is reachable.' },
  { id: 'grvt', name: 'GRVT', intervalH: 8, baseline: 'yes',
    note: 'Publishes funding in percent, and states its interval inline.' },
];

export const VENUE_BY_ID: Record<string, Venue> = Object.fromEntries(VENUES.map((v) => [v.id, v]));

/** 30-day mean funding, annualised %, from research/funding-spreads/.
 *  `days` is how much history backed it — anything under a week is a hint, not
 *  a baseline, and the UI says so. */
export const BASELINE: Record<Asset, Record<string, { annual: number; days: number }>> = {
  BTC: {
    hibachi: { annual: 24.21, days: 2 }, hyperliquid: { annual: 10.19, days: 20.8 },
    orderly: { annual: 9.83, days: 19.7 }, extended: { annual: 9.48, days: 30 },
    lighter: { annual: 9.28, days: 30 }, backpack: { annual: 9.23, days: 30 },
    binance: { annual: 7.30, days: 29.7 }, grvt: { annual: 6.97, days: 29.7 },
    aster: { annual: 6.41, days: 29.7 }, okx: { annual: 6.31, days: 29.7 },
    apex: { annual: 3.61, days: 30 }, dydx: { annual: -0.09, days: 30 },
    paradex: { annual: 9.58, days: 0.5 },
  },
  ETH: {
    orderly: { annual: 15.05, days: 19.7 }, hyperliquid: { annual: 10.22, days: 20.8 },
    backpack: { annual: 8.98, days: 30 }, lighter: { annual: 8.47, days: 30 },
    aster: { annual: 6.77, days: 29.7 }, okx: { annual: 6.27, days: 29.7 },
    extended: { annual: 6.03, days: 30 }, binance: { annual: 5.22, days: 29.7 },
    grvt: { annual: 3.55, days: 29.7 }, dydx: { annual: -0.45, days: 30 },
    apex: { annual: -2.65, days: 30 }, hibachi: { annual: -21.41, days: 2 },
    paradex: { annual: 5.87, days: 0.5 },
  },
  SOL: {
    grvt: { annual: 9.92, days: 29.7 }, hyperliquid: { annual: 9.75, days: 20.8 },
    lighter: { annual: 7.47, days: 30 }, backpack: { annual: 6.85, days: 30 },
    aster: { annual: 4.05, days: 29.7 }, extended: { annual: 3.93, days: 30 },
    binance: { annual: 3.46, days: 29.7 }, okx: { annual: 2.51, days: 29.7 },
    dydx: { annual: -1.44, days: 30 }, orderly: { annual: -2.71, days: 19.7 },
    apex: { annual: -5.83, days: 30 }, hibachi: { annual: -12.07, days: 2 },
    paradex: { annual: 5.40, days: 0.5 },
  },
};

/** Pairs whose persistence was actually measured, with the independent-
 *  observation count. `sameSign` is the share of independent settlements where
 *  the spread pointed the way its mean says — counted on the coarser of the two
 *  venues' periods, NOT on an expanded hourly grid, because expanding an
 *  8-hourly venue turns 60 real observations into 480 and makes agreement look
 *  eight times more convincing than it is. */
export interface MeasuredPair {
  short: string; long: string; obs: number; annual: number; sameSign: number; worstWeekPct: number;
}
export const MEASURED: Record<Asset, MeasuredPair[]> = {
  BTC: [
    { short: 'hyperliquid', long: 'dydx', obs: 500, annual: 10.54, sameSign: 0.89, worstWeekPct: 0.180 },
    { short: 'extended', long: 'dydx', obs: 720, annual: 9.57, sameSign: 0.90, worstWeekPct: 0.123 },
    { short: 'lighter', long: 'dydx', obs: 720, annual: 9.37, sameSign: 0.91, worstWeekPct: 0.126 },
    { short: 'backpack', long: 'dydx', obs: 720, annual: 9.33, sameSign: 0.89, worstWeekPct: 0.098 },
    { short: 'orderly', long: 'dydx', obs: 60, annual: 9.67, sameSign: 1.00, worstWeekPct: 0.151 },
  ],
  ETH: [
    { short: 'hyperliquid', long: 'apex', obs: 500, annual: 13.43, sameSign: 0.89, worstWeekPct: 0.157 },
    { short: 'backpack', long: 'apex', obs: 720, annual: 11.63, sameSign: 0.89, worstWeekPct: 0.111 },
    { short: 'orderly', long: 'apex', obs: 60, annual: 18.56, sameSign: 1.00, worstWeekPct: 0.265 },
    { short: 'orderly', long: 'grvt', obs: 60, annual: 14.45, sameSign: 0.98, worstWeekPct: 0.123 },
    { short: 'orderly', long: 'dydx', obs: 60, annual: 14.08, sameSign: 0.83, worstWeekPct: 0.081 },
  ],
  SOL: [
    { short: 'lighter', long: 'apex', obs: 720, annual: 13.31, sameSign: 0.71, worstWeekPct: 0.167 },
    { short: 'hyperliquid', long: 'apex', obs: 500, annual: 13.37, sameSign: 0.68, worstWeekPct: 0.093 },
    { short: 'grvt', long: 'apex', obs: 90, annual: 15.85, sameSign: 0.72, worstWeekPct: 0.057 },
    { short: 'grvt', long: 'orderly', obs: 60, annual: 12.28, sameSign: 0.98, worstWeekPct: 0.134 },
  ],
};

export const ANNUALISE = 24 * 365 * 100;   // hourly fraction -> % per year

export interface LiveFunding {
  symbol: string;
  venues: Record<string, number>;   // hourly signed fraction
  missing: string[];
  time: number;
}

export async function fetchFunding(symbol: Asset): Promise<LiveFunding | null> {
  try {
    const r = await fetch(`/api/market/funding?symbol=${symbol}`, { cache: 'no-store' });
    if (!r.ok) return null;
    return (await r.json()) as LiveFunding;
  } catch {
    return null;
  }
}

export interface Pair {
  short: string; long: string;
  annual: number;            // current carry, % per year
  baselineAnnual: number | null;
  measured: MeasuredPair | null;
  breakevenDays: number;     // at the given round-trip cost
  widenedBy: number | null;  // current / baseline
}

/** Every venue pair, oriented so the carry is positive, richest first.
 *  `costBp` is the total round trip across both legs, in and out. */
export function buildPairs(live: LiveFunding, asset: Asset, costBp: number): Pair[] {
  const ids = Object.keys(live.venues);
  const base = BASELINE[asset] ?? {};
  const measured = MEASURED[asset] ?? [];
  const out: Pair[] = [];
  for (const a of ids) {
    for (const b of ids) {
      if (a === b) continue;
      const spread = live.venues[a] - live.venues[b];   // short a, long b
      if (spread <= 0) continue;
      const annual = spread * ANNUALISE;
      const ba = base[a]?.annual, bb = base[b]?.annual;
      const baselineAnnual = ba != null && bb != null ? ba - bb : null;
      out.push({
        short: a, long: b, annual, baselineAnnual,
        measured: measured.find((m) => m.short === a && m.long === b) ?? null,
        // fees are paid once, carry accrues hourly
        breakevenDays: spread > 0 ? (costBp / 1e4) / (spread * 24) : Infinity,
        widenedBy: baselineAnnual && baselineAnnual > 0 ? annual / baselineAnnual : null,
      });
    }
  }
  return out.sort((x, y) => y.annual - x.annual);
}

/** The smaller of a pair's two measured book depths, which is what actually
 *  caps the position. Undefined where either leg was not measured. */
export function pairDepth(p: Pair): number | null {
  const s = VENUE_BY_ID[p.short]?.depth10bp;
  const l = VENUE_BY_ID[p.long]?.depth10bp;
  if (!s || !l) return null;
  // enter: sell on short leg (hits bids), buy on long leg (hits asks)
  // exit is the mirror, and the exit side is usually the binding one
  return Math.min(s.bid, s.ask, l.bid, l.ask);
}
