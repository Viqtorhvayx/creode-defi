// Hotstuff's 7 live crypto perp markets, each mapped to both Hotstuff's own
// oracle symbol and the fastest direct source Creode can read independently.
//
// Hotstuff also lists 20 non-crypto perps (equities, commodities, FX, and a
// SpaceX pre-IPO market) — those are out of scope here for the same reason
// as the Bullbit tab: there's no equivalent fast public source to read them
// from directly, so Creode couldn't show anything ahead of Hotstuff's own
// number for them.
//
// Measured against Hotstuff's live API before shipping (BTC-PERP):
//
// vs their ORACLE (index_price), ~2.5min sample:
//   - Oracle republishes every ~2.16s
//   - Gap median 0.0127% (~$9.74 on BTC at $77k)
//   - For its lag, see the LEAD/LAG section below — measured directly, not
//     by the cross-correlation originally used here
//
// vs their MARKET PRICE (order book mid), 75s sample — this is what the tab
// actually compares against, since the mid is what you'd trade near:
//   - Creode's read sat a steady +0.0551% above their mid (p5 +0.0381%,
//     p95 +0.0583%) — persistently positive, never flipping sign
//   - Their bid-ask spread ran median 0.0474% ($36.02), so the gap is only
//     ~1.16x the cost of crossing it, before Hotstuff's own fees
//
// LEAD/LAG. Two different questions, two different answers — the ORACLE
// genuinely trails, the MID does not. Conflating them is what produced the
// retracted claim below.
//
// THEIR ORACLE (index_price) DOES lag, confirmed three independent ways.
// The third is a 20-venue study run later — see research/lead-lag/ — which put
// it at 5250ms in one capture and 4900ms in another, with a 45% well-depth
// against a 2% placebo. That study also measured their BOOK at roughly 550ms
// behind Binance, which is the reason the oracle lag stays untradable: the
// thing you actually fill against has already moved.
// Direct level test over 239s / 108 index updates, mean absolute error by
// lag, basis-adjusted:
//       0ms -> $11.36
//    2000ms ->  $7.85
//    4000ms ->  $5.77   <- best fit
//    5000ms ->  $5.87
//   10000ms -> $11.28
//   20000ms -> $19.94
// A clean interior minimum at ~4-5s, rising steeply either side — the shape
// a real lag produces. Expected from their design: a weighted median of nine
// venues with MAD outlier filtering, republished every ~2.2s.
// NOT TRADABLE: this is an order-book venue. You fill against the book, not
// the oracle, and the book does not lag (below). The oracle governs their
// margin and liquidation math only.
//
// THEIR MID (order book) — RESULT: no meaningful lead. Tracks Binance in step.
//
// Testing which past Binance value best matches each new quote (mean
// absolute error, basis-adjusted, one observation per quote change):
//       lag     0ms -> $2.78
//       lag   500ms -> $2.75   <- best fit
//       lag  1000ms -> $2.93
//       lag  2000ms -> $4.34
//       lag  4000ms -> $5.72
// Error rises monotonically past ~500ms. A best fit inside 500ms sits within
// our own polling latency, so there is no lead to act on.
//
// AN EARLIER VERSION OF THIS FILE CLAIMED A ~2s LEAD. It was wrong. That
// figure came from cross-correlating returns on a resampled grid, and two
// things went wrong:
//   1. Their mid updates every ~3.3s and was forward-filled onto 250-1000ms
//      grids. The resulting step series mechanically trails any continuous
//      driver under forward-fill, independent of economics — that artifact
//      produced the apparent +2000ms peak and the 0.61/0.06 asymmetry that
//      was cited as decisive.
//   2. "Stable across 250/500/1000ms grids" was treated as robustness. It
//      isn't: those are the same 107 events resampled, sharing the same
//      noise. It tests resolution sensitivity, not sampling error.
// For a claim about levels ("their book sits where Binance was X ago"), test
// levels directly. Don't infer it from a correlation on a resampled grid.
//
// Depth, for context on any gap you do see: sampled over 30s, top of book
// held a median 0.00405 BTC bid / 0.00575 BTC ask — roughly $308/$437 at
// ~$76k. See the disclaimer in HotstuffFastPriceTab.tsx.
//
// Separately, their mid tracks their own index tightly: median ~0.045%
// discount, max deviation 0.098% over 149s, far inside their ±7.5% cap,
// with funding pinned throughout.
export type FastPriceSource = 'binance' | 'pyth';

export interface HotstuffMarket {
  sym: string;
  name: string;
  instrument: string; // Hotstuff's perp instrument, for POST /info method:"ticker"
  source: FastPriceSource;
  pythFeedId?: string; // only when source === 'pyth'
}

export const HOTSTUFF_API = 'https://api.hotstuff.trade/info';
// Trailing slash is required — without it the upgrade gets a 301 and the
// handshake fails. Confirmed live.
export const HOTSTUFF_WS = 'wss://api.hotstuff.trade/ws/';

export const HOTSTUFF_MARKETS: HotstuffMarket[] = [
  { sym: 'BTC', name: 'Bitcoin', instrument: 'BTC-PERP', source: 'binance' },
  { sym: 'ETH', name: 'Ethereum', instrument: 'ETH-PERP', source: 'binance' },
  { sym: 'SOL', name: 'Solana', instrument: 'SOL-PERP', source: 'binance' },
  { sym: 'XRP', name: 'XRP', instrument: 'XRP-PERP', source: 'binance' },
  { sym: 'BNB', name: 'BNB', instrument: 'BNB-PERP', source: 'binance' },
  { sym: 'ZEC', name: 'Zcash', instrument: 'ZEC-PERP', source: 'binance' },
  // Binance does not spot-list HYPE (confirmed live: "Invalid symbol"), so
  // this one uses the same verified Pyth feed the rest of the app already
  // trusts for HYPE — see VAULT_WATCH_TOKENS in market.ts.
  {
    sym: 'HYPE',
    name: 'Hyperliquid',
    instrument: 'HYPE-PERP',
    source: 'pyth',
    pythFeedId: '4279e31cc369bbcc2faf022b382b080e32a8e689ff20fbc530d2a603eb6cd98b',
  },
];

export interface HotstuffTicker {
  midPrice: number;    // order book mid — the actual market price you'd trade near
  bidPrice: number;
  askPrice: number;
  markPrice: number;   // smoothed, used for their margin/liquidation math
  indexPrice: number;  // their oracle
  fundingRate: number;
  lastUpdated: number; // unix ms, Hotstuff's own timestamp
}

/** Reads Hotstuff's full ticker for one instrument — mid, bid/ask, mark and
 *  index all arrive in a single call, so the market price and the oracle
 *  shown side by side are always from the same instant rather than two
 *  separately-timed requests. Their API sends
 *  `access-control-allow-origin: *`, so this is called straight from the
 *  browser — no relay or proxy hop, which matters for a latency-focused
 *  readout. */
export async function fetchHotstuffTicker(instrument: string): Promise<HotstuffTicker | null> {
  try {
    const res = await fetch(HOTSTUFF_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'ticker', params: { symbol: instrument } }),
    });
    if (!res.ok) return null;
    const arr = await res.json();
    const d = Array.isArray(arr) ? arr[0] : arr;
    if (!d) return null;
    const midPrice = Number(d.mid_price);
    if (!Number.isFinite(midPrice)) return null;
    return {
      midPrice,
      bidPrice: Number(d.best_bid_price),
      askPrice: Number(d.best_ask_price),
      markPrice: Number(d.mark_price),
      indexPrice: Number(d.index_price),
      fundingRate: Number(d.funding_rate),
      lastUpdated: Number(d.last_updated),
    };
  } catch {
    return null;
  }
}

/** Subscribes to Hotstuff's pushed ticker stream over their WebSocket
 *  (JSON-RPC 2.0, channel `ticker`). Their server pushes the instant their
 *  book changes, which removes the polling delay the REST path carries —
 *  with a 400ms poll we'd learn about a change up to 400ms after it
 *  happened; here we learn about it as soon as the network delivers it.
 *
 *  This cannot make Creode EARLIER than Hotstuff's market price: their mid
 *  is computed from orders resting on their own book, so nothing upstream
 *  precedes it. It only removes Creode's own lag in observing it.
 *
 *  Returns an unsubscribe function. Callers should keep a REST fallback:
 *  raw browser WebSockets are blocked outright in some environments
 *  (in-app wallet browsers, restrictive networks) in a way client-side JS
 *  can't always detect, which is the same reason the Binance/N1 feeds go
 *  through the relay rather than connecting directly. */
export function subscribeHotstuffTicker(
  instrument: string,
  onTick: (tick: HotstuffTicker) => void,
  onFailure?: () => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;

  try {
    ws = new WebSocket(HOTSTUFF_WS);
  } catch {
    onFailure?.();
    return () => {};
  }

  ws.onopen = () => {
    try {
      ws?.send(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'subscribe',
        params: { channel: 'ticker', symbol: instrument },
      }));
    } catch { /* socket died between open and send */ }
  };

  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const d = msg?.params?.data;
      if (!d) return; // subscribe ack, heartbeat, or another channel
      const midPrice = Number(d.mid_price);
      if (!Number.isFinite(midPrice)) return;
      onTick({
        midPrice,
        bidPrice: Number(d.best_bid_price),
        askPrice: Number(d.best_ask_price),
        markPrice: Number(d.mark_price),
        indexPrice: Number(d.index_price),
        fundingRate: Number(d.funding_rate),
        lastUpdated: Date.now(),
      });
    } catch { /* skip malformed frame */ }
  };

  ws.onerror = () => { if (!closed) onFailure?.(); };
  ws.onclose = () => { if (!closed) onFailure?.(); };

  return () => {
    closed = true;
    try { ws?.close(); } catch { /* already closing */ }
  };
}
