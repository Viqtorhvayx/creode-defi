// Replicating a perp DEX's index/oracle price, and getting there first.
//
// THE IDEA, and why this one actually works where the earlier hunt failed.
//
// research/lead-lag/ asked whether any venue's price ARRIVES before Binance's.
// The answer was no, across twenty-odd venues — and it was never going to be
// yes, because a venue that led the deepest book in the market would be
// arbitraged into line within milliseconds.
//
// This is a different question with a different answer. A perp DEX's index
// price is not an independent observation of the market. It is a published
// FUNCTION of CEX spot prices, and the venue recomputes it on a fixed
// drumbeat — Hyperliquid every 3 seconds, most others every 1-2. Between
// publishes their number is frozen while the inputs keep moving.
//
// So we read the same inputs continuously, apply the same published formula,
// and we have their next value before they publish it. We are not beating
// Binance. We are beating a slow function of Binance, using its own recipe.
// That lead is arithmetic, not alpha: it is bounded by their publish interval
// and it is exactly as real as their documentation is accurate.
//
// WHAT THIS IS NOT. It is not a trading edge. On every venue here the index
// governs funding, margin and liquidation — you still fill against the order
// book, and the book does not wait for the oracle. See the disclaimer in
// IndexRaceTab.tsx, and research/lead-lag/README.md for what happened when
// that distinction was tested with money in mind.
//
// MEASURED, two captures of 10.4 and 9.0 minutes on BTC:
//
//   Hyperliquid oracle trails this replication by +2450ms and +2250ms.
//   Our value lands within $0.05 and $0.01 of theirs — the formula is right,
//   not merely close. Well-depth 58% and 71% against a ~7% placebo, with a
//   self-control that reads exactly 0ms.
//
// One honest qualification. The LEAD comes from their publish cadence, not
// from the formula: reading Binance spot alone and calling it the index also
// lands ~2.45s ahead. What the formula buys is being RIGHT — Binance alone
// carries a $3.01 systematic offset against their oracle, where the weighted
// median carries $0.01. Early and wrong is not worth anything.

export type SpotSource = 'binance' | 'okx' | 'bybit' | 'kraken' | 'kucoin' | 'gate' | 'mexc';

export interface IndexVenue {
  id: string;
  name: string;
  /** How much of their formula we actually know. Drives what the UI claims. */
  fidelity: 'exact' | 'approximate';
  /** Source weights. For 'exact' venues this is their published weighting. */
  weights: Partial<Record<SpotSource, number>>;
  /** Observed republish interval, milliseconds — measured live, not quoted. */
  publishMs: number;
  /** What their own docs say, for the UI to cite. */
  note: string;
  docs?: string;
}

/** Hyperliquid publishes its recipe outright, which makes it the one venue we
 *  can replicate exactly rather than approximate:
 *
 *    "validators are responsible for publishing spot oracle prices for each
 *     perp asset every 3 seconds" — the weighted median of Binance, OKX,
 *     Bybit, Kraken, Kucoin, Gate IO, MEXC and Hyperliquid spot mid prices,
 *     with weights 3, 2, 2, 1, 1, 1, 1, 1.
 *
 *  Hyperliquid's own spot leg is excluded for assets whose liquidity is
 *  primarily external, which covers BTC and ETH, so it is not in the weights
 *  below. The clearinghouse then takes a stake-weighted median across
 *  validators, which we cannot see and do not model — it is one more step
 *  between the inputs and the published number, and therefore one more reason
 *  the published number arrives after ours rather than before. */
export const INDEX_VENUES: IndexVenue[] = [
  {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    fidelity: 'exact',
    weights: { binance: 3, okx: 2, bybit: 2, kraken: 1, kucoin: 1, gate: 1, mexc: 1 },
    publishMs: 3000,
    note: 'Weighted median of seven CEX spot mids, published by validators every 3 seconds, then stake-weighted-median across validators.',
    docs: 'https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/oracle',
  },
  {
    id: 'hotstuff',
    name: 'Hotstuff',
    fidelity: 'approximate',
    weights: { binance: 1, okx: 1, bybit: 1, kraken: 1, kucoin: 1, gate: 1, mexc: 1 },
    publishMs: 2030,
    note: 'Weighted median across nine venues with MAD outlier filtering. Their weights are not published, so this is an equal-weighted stand-in over the sources we can read — close enough to race, not close enough to call a replication.',
  },
];

/* Other venues were measured but are not raced here, because their APIs do not
 * send CORS headers and proxying every one of them through our own origin would
 * add a hop to their side of a latency comparison — which would flatter us
 * dishonestly. Measured lead of our composite over their published index, from
 * a 10.4-minute capture (see research/index-replication/):
 *
 *   venue      run 1     run 2        venue      run 1     run 2
 *   Hotstuff   +4050ms   +4800ms      Backpack   +1700ms   +2050ms
 *   ApeX       +3900ms   +2350ms      Extended    +750ms    +450ms
 *   Aevo        +300ms    +350ms      Hibachi     +300ms    +250ms
 *   Orderly       +0ms    +150ms      Aster      not identified (well-depth 9%)
 *
 * Orderly at 0ms is the honest counter-example: their index is recomputed and
 * republished fast enough that a composite built the way we build ours does not
 * get there first. Not every venue is beatable, and the ones that are, are
 * beatable by exactly as much as their publish interval allows. */

export interface SourceQuote { src: SpotSource; mid: number; }

/** Weighted median: sort by price, walk the weights, take the value where the
 *  running total first reaches half. This is the aggregation Hyperliquid and
 *  most other index specs name, and it is deliberately not a mean — one venue
 *  printing a bad tick moves a mean and does not move this. */
export function weightedMedian(quotes: SourceQuote[], weights: Partial<Record<SpotSource, number>>): number | null {
  const rows = quotes
    .map((q) => ({ p: q.mid, w: weights[q.src] ?? 0 }))
    .filter((r) => r.w > 0 && Number.isFinite(r.p) && r.p > 0)
    .sort((a, b) => a.p - b.p);
  if (rows.length < 3) return null;      // too thin to be a consensus of anything
  const total = rows.reduce((s, r) => s + r.w, 0);
  let acc = 0;
  for (const r of rows) {
    acc += r.w;
    if (acc >= total / 2) return r.p;
  }
  return rows[rows.length - 1].p;
}

export interface IndexSourcesResponse {
  symbol: string;
  sources: Partial<Record<SpotSource, number>>;
  missing: SpotSource[];
  time: number;
}

/** Reads every spot input in one call. Sources that are unreachable from the
 *  deploy region come back in `missing` and drop out of the median, which is
 *  the same thing the venues do with a feed that has gone quiet. */
export async function fetchIndexSources(symbol: string): Promise<IndexSourcesResponse | null> {
  try {
    const res = await fetch(`/api/market/index-sources?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as IndexSourcesResponse;
  } catch {
    return null;
  }
}

/** Each venue's own published index, for the side-by-side. These are read
 *  straight from the browser where the venue sends permissive CORS headers,
 *  and through our own origin where it does not. */
export async function fetchVenueIndex(venueId: string, symbol: string): Promise<number | null> {
  try {
    if (venueId === 'hyperliquid') {
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      });
      if (!res.ok) return null;
      const [meta, ctxs] = await res.json();
      const i = meta?.universe?.findIndex((u: { name: string }) => u.name === symbol);
      if (i == null || i < 0) return null;
      const px = Number(ctxs?.[i]?.oraclePx);
      return Number.isFinite(px) ? px : null;
    }
    if (venueId === 'hotstuff') {
      const res = await fetch('https://api.hotstuff.trade/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'ticker', params: { symbol: `${symbol}-PERP` } }),
      });
      if (!res.ok) return null;
      const arr = await res.json();
      const d = Array.isArray(arr) ? arr[0] : arr;
      const px = Number(d?.index_price);
      return Number.isFinite(px) ? px : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Hyperliquid pushes its oracle the instant validators publish, which is the
 *  fairest possible comparison: we are not adding polling delay to their side
 *  of the race. Returns an unsubscribe function. */
export function subscribeHyperliquidOracle(
  symbol: string,
  onTick: (t: { oracle: number; mark: number }) => void,
  onFailure?: () => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  try {
    ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
  } catch {
    onFailure?.();
    return () => {};
  }
  ws.onopen = () => {
    try {
      ws?.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'activeAssetCtx', coin: symbol } }));
    } catch { /* socket died between open and send */ }
  };
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const ctx = msg?.data?.ctx;
      if (!ctx?.oraclePx) return;
      const oracle = Number(ctx.oraclePx);
      const mark = Number(ctx.markPx);
      if (Number.isFinite(oracle)) onTick({ oracle, mark });
    } catch { /* skip malformed frame */ }
  };
  ws.onerror = () => { if (!closed) onFailure?.(); };
  ws.onclose = () => { if (!closed) onFailure?.(); };
  return () => {
    closed = true;
    try { ws?.close(); } catch { /* already closing */ }
  };
}
