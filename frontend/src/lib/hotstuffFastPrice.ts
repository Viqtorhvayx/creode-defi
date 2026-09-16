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
//   - Oracle refreshes every ~2.16s; cross-correlation vs raw Binance peaks
//     at ~3.2-3.5s lag, stable across 200/100/400ms resampling grids
//   - Gap median 0.0127% (~$9.74 on BTC at $77k)
//
// vs their MARKET PRICE (order book mid), 75s sample — this is what the tab
// actually compares against, since the mid is what you'd trade near:
//   - Creode's read sat a steady +0.0551% above their mid (p5 +0.0381%,
//     p95 +0.0583%) — persistently positive, never flipping sign
//   - Their bid-ask spread ran median 0.0474% ($36.02), so the gap is only
//     ~1.16x the cost of crossing it, before Hotstuff's own fees
//
// LEAD/LAG — Binance vs their mid (359s, 1195 samples, 107 quote changes):
//   - Cross-correlation on returns peaks at a POSITIVE lag of ~2s, i.e.
//     Binance moves reach their book about 2s later:
//       250ms grid -> +1750ms (0.331)
//       500ms grid -> +2000ms (0.4885)
//      1000ms grid -> +2000ms (0.6144)
//   - The evidence is the asymmetry, not the peak: reverse-direction
//     correlation (their mid leading Binance) never exceeds ~0.06 at any
//     grid. Their book follows Binance; Binance does not follow their book.
//   - An earlier 74s sample suggested ~3s, but rested on only 16 quote
//     changes. The 359s/107-event figure above supersedes it.
//
// What bounds that lead is depth, not timing: sampled over 30s, top of book
// held a median 0.00405 BTC bid / 0.00575 BTC ask — roughly $308/$437 at
// ~$76k. Market makers quote thin precisely because they know they trail
// Binance. See the disclaimer in HotstuffFastPriceTab.tsx.
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
