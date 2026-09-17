// Gains / gTrade's oracle, and racing it.
//
// FINDING THE FEED. Gains' documented price host, backend-pricing.gains.trade,
// does not resolve — which is why an earlier pass in
// research/oracle-execution-venues/ recorded their lag as "unmeasured". The
// real host is compiled into the trading page bundle:
//
//   let l = "wss://", d = "https://"
//   U = H(j("backend-pricing.eu.gains.trade"), d)           -> https base
//   V = q(j("backend-pricing.eu.gains.trade"), l) + "/v3"   -> the price socket
//
// WIRE FORMAT. A flat array of alternating pair index and price,
// [0, 76562.91, 1, 2463.54, ...], with pair indices from
// backend-arbitrum.gains.trade/trading-variables. Once a second a one-element
// array arrives carrying the server's own clock in milliseconds, which is how
// the measurements below could check their own timing bias instead of assuming
// it: that heartbeat lands a steady 42-44ms after the server stamps it, with a
// worst case of 51ms across the whole capture. Earlier in this project
// arrival-time analysis had to be thrown out because our own jitter ran
// 47-455ms — larger than the effects being measured. On this feed it does not.
//
// MEASURED, two captures of 13.0 and 14.0 minutes on BTC — see
// research/gains-oracle/ for the scripts, the guards and the full tables.
//
//   Publish cadence            505ms median (p10 494ms, p90 1504ms)
//   Lag vs the CEX tape        +250ms, +150ms   well 83%, 84%
//   Our fit to their number    $3.31 basis, $2.13 mean error on a $76.3k price
//   Self-control               +0ms at 100%   Placebo  well 2-4%, nothing found
//
// THE RECIPE. Gains quotes USD; every deep book quotes USDT. Their BTC oracle
// sat $71.75 BELOW Binance's USDT book and $2.74 from Kraken's USD book, and
// USDT/USD at 0.99909 accounts for the whole difference. So the replication is
// a median of the spot books converted to USD, and the first version of this —
// a median taken over USDT and USD books at once — was wrong by $35, because a
// median over a bimodal mixture just flips between the two clusters.
//
// THE HONEST PART, and it is the finding rather than a caveat. The lead is
// real, it survives every guard, and it is SMALLER THAN OUR OWN FORMULA ERROR.
// Their oracle trails by 150-300ms; BTC moves a median of $0.00 and a p90 of
// $4.30 in 300ms; our replication sits $2.13 from their number. Being 150ms
// early is worth less than being $2 wrong. Tested directly: asked whether our
// value predicts their NEXT print better than their CURRENT print does, it wins
// 29.3% of the time — it loses. Hyperliquid worked because 2.25 seconds of
// movement dwarfs a $0.01 formula error. Six times the cadence and two hundred
// times the fidelity error is the whole difference.
//
// WHAT IS STILL TRUE AND VISIBLE: they do not republish when their median has
// not changed, so the print on their screen is older than the lag. Sampled
// every 25ms, its age ran a median of 395ms, p90 1651ms and p99 4011ms, with a
// longest freeze of 8.5s. Their socket sends a heartbeat every second
// regardless, and it kept flowing through all 75 of the >2s price gaps, so
// those freezes are theirs and not a dropped connection on our side.
//
// AND IT IS NOT REACHABLE ANYWAY. A Gains market order carries no price: you
// submit it, and their oracle prices it when it settles. Pooling 111 settled
// fills across all pairs against the display feed, the executed price looks
// like the feed 750-1000ms earlier (well 63%, ~1s resolution because block
// timestamps are whole seconds) — so execution is not materially staler than
// display, and there is no second-scale lag anywhere in this venue. Their round
// trip on BTC is 1.0bp spread + 3.5bp/side = 8.0bp, a $61 move, against a p99
// 300ms move of $9.80.
export type GainsSource = 'binance' | 'okx' | 'bybit' | 'kraken' | 'kucoin' | 'gate' | 'mexc';

/** The price socket. No CORS on a websocket handshake, so the browser reads it
 *  directly rather than through our own origin — which matters, because routing
 *  their side through an extra hop would add delay to THEIR leg of a latency
 *  comparison and flatter us dishonestly. */
export const GAINS_WS = 'wss://backend-pricing.eu.gains.trade/v3';

/** Pair indices are positional in trading-variables and are not stable across
 *  Gains' own listings changes, so each is pinned with the symbol it carried
 *  when this was verified (2026-09-17) and re-checked at runtime against the
 *  same endpoint before any price is shown. A silently shifted index would
 *  display a confidently wrong price, which is worse than showing none. */
export const GAINS_TRADING_VARIABLES = 'https://backend-arbitrum.gains.trade/trading-variables';

export interface GainsMarket {
  /** Pair index on the wire. */
  idx: number;
  sym: string;
  name: string;
  /** Their quoted spread, in basis points, from pairs[].spreadP scaled 1e10. */
  spreadBp: number;
}

/* Only markets with a deep, readable CEX spot book are listed: the replication
 * is a median across those books, so a market we cannot independently price is
 * a market we have nothing to race with. Gains lists 493 pairs including FX,
 * commodities and equities; those are out of scope here for the same reason as
 * the non-crypto markets on the Bullbit and Hotstuff tabs.
 *
 * spreadBp comes from their own trading-variables: BTC and ETH quote 1.0bp,
 * everything else in this list quotes zero and is defended by fees alone. */
export const GAINS_MARKETS: GainsMarket[] = [
  { idx: 0, sym: 'BTC', name: 'Bitcoin', spreadBp: 1.0 },
  { idx: 1, sym: 'ETH', name: 'Ethereum', spreadBp: 1.0 },
  { idx: 33, sym: 'SOL', name: 'Solana', spreadBp: 0 },
  { idx: 19, sym: 'XRP', name: 'XRP', spreadBp: 0 },
  { idx: 47, sym: 'BNB', name: 'BNB', spreadBp: 0 },
  { idx: 3, sym: 'DOGE', name: 'Dogecoin', spreadBp: 0 },
  { idx: 2, sym: 'LINK', name: 'Chainlink', spreadBp: 0 },
  { idx: 5, sym: 'ADA', name: 'Cardano', spreadBp: 0 },
  { idx: 102, sym: 'AVAX', name: 'Avalanche', spreadBp: 0 },
  { idx: 13, sym: 'LTC', name: 'Litecoin', spreadBp: 0 },
  { idx: 11, sym: 'DOT', name: 'Polkadot', spreadBp: 0 },
  { idx: 104, sym: 'NEAR', name: 'NEAR Protocol', spreadBp: 0 },
  { idx: 109, sym: 'ARB', name: 'Arbitrum', spreadBp: 0 },
  { idx: 17, sym: 'UNI', name: 'Uniswap', spreadBp: 0 },
  { idx: 7, sym: 'AAVE', name: 'Aave', spreadBp: 0 },
  { idx: 103, sym: 'ATOM', name: 'Cosmos', spreadBp: 0 },
  { idx: 153, sym: 'SUI', name: 'Sui', spreadBp: 0 },
  { idx: 138, sym: 'APT', name: 'Aptos', spreadBp: 0 },
  { idx: 20, sym: 'ZEC', name: 'Zcash', spreadBp: 0 },
  { idx: 44, sym: 'TRX', name: 'TRON', spreadBp: 0 },
];

/** Gains' opening/closing fee, from fees[13].totalPositionSizeFeeP = 3.5e8
 *  scaled 1e10 as a percentage. Applies per side. */
export const GAINS_FEE_BP_PER_SIDE = 3.5;

export interface GainsTick { idx: number; price: number; at: number; }

/** Subscribe to the pairs we care about. `onTick` fires once per pair per
 *  batch, only when that pair's value actually changed — the socket resends
 *  unchanged prices and counting those as publishes would understate their
 *  cadence and therefore overstate our lead.
 *
 *  `onHeartbeat` receives the server clock from the one-element frames, which
 *  the caller uses to show the transport delay rather than assume it. */
export function subscribeGainsPrices(
  indices: number[],
  onTick: (t: GainsTick) => void,
  onHeartbeat?: (serverMs: number, localMs: number) => void,
  onFailure?: () => void,
): () => void {
  const want = new Set(indices);
  const last = new Map<number, number>();
  let ws: WebSocket | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const open = () => {
    if (closed) return;
    try {
      ws = new WebSocket(GAINS_WS);
    } catch {
      onFailure?.();
      return;
    }
    ws.onmessage = (ev) => {
      let a: unknown;
      try { a = JSON.parse(ev.data as string); } catch { return; }
      if (!Array.isArray(a)) return;
      const at = Date.now();
      attempt = 0;   // a frame arrived, so the connection is genuinely healthy
      if (a.length === 1) { onHeartbeat?.(Number(a[0]), at); return; }
      for (let i = 0; i + 1 < a.length; i += 2) {
        const idx = Number(a[i]), price = Number(a[i + 1]);
        if (!want.has(idx) || !Number.isFinite(price) || price <= 0) continue;
        if (last.get(idx) === price) continue;
        last.set(idx, price);
        onTick({ idx, price, at });
      }
    };
    ws.onerror = () => { if (!closed) onFailure?.(); };
    ws.onclose = () => {
      if (closed) return;
      onFailure?.();
      // Their socket drops occasionally; reconnect rather than going dark. The
      // gap shows up as a stale "last publish" age in the UI, not as a frozen
      // price pretending to be live.
      //
      // Backed off, and capped. Some environments answer the upgrade with a
      // 200 or a 404 instead of a 101 — a proxy, a corporate filter, an
      // in-app browser — and a flat 2s retry against one of those is an
      // infinite request loop that the browser eventually answers with
      // ERR_TOO_MANY_RETRIES anyway.
      retry = setTimeout(open, Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5)));
    };
  };
  open();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    try { ws?.close(); } catch { /* already closing */ }
  };
}

/* ---------------------------------------------------------------------------
 * Our side of the race.
 *
 * WHY THIS IS STREAMED AND NOT POLLED. Gains republishes every ~505ms and its
 * print trails the tape by about half that. A server-side poll of seven
 * exchange REST endpoints costs ~165-170ms on the edge runtime before the poll
 * interval is even counted, so a replication built that way would be staler
 * than the thing it is racing and would show no lead at all. The exchange
 * websockets have no CORS on the handshake, so the browser reads all of them
 * directly and the composite is recomputed on every book update instead of on
 * a timer. The polled route stays as the fallback for environments that block
 * websocket upgrades outright, and it is honestly labelled as such in the UI
 * because in that mode the lead really does mostly disappear.
 *
 * WHY THE USDT RATE. Every deep book is quoted in USDT; Gains quotes USD. That
 * gap is not cosmetic. Measured live, Gains' BTC oracle sat $72.21 below
 * Binance's USDT book, and USDT/USD at 0.999055 accounts for $72.4 of it — the
 * whole thing. Against the USD books it sat $0.38 from Kraken and $2.32 from
 * Coinbase. So the recipe that reproduces their number is a median of the spot
 * books converted to USD, and a USDT median presented as a USD price would be
 * wrong by nine times their own quoted spread. Early and wrong is worth
 * nothing. */
export type SpotLegId = 'binance' | 'bybit' | 'okx' | 'coinbase' | 'kraken';

export interface SpotLeg {
  id: SpotLegId;
  label: string;
  /** What the book is quoted in. 'usdt' legs are multiplied by USDT/USD. */
  quote: 'usdt' | 'usd';
}

export const SPOT_LEGS: SpotLeg[] = [
  { id: 'binance', label: 'Binance', quote: 'usdt' },
  { id: 'bybit', label: 'Bybit', quote: 'usdt' },
  { id: 'okx', label: 'OKX', quote: 'usdt' },
  { id: 'coinbase', label: 'Coinbase', quote: 'usd' },
  { id: 'kraken', label: 'Kraken', quote: 'usd' },
];

export interface CompositeUpdate {
  /** Median across the legs, in USD. Null until three legs are live. */
  price: number | null;
  /** Per-leg price already converted to USD, for the inputs panel. */
  legs: Partial<Record<SpotLegId, number>>;
  usdtUsd: number | null;
  at: number;
}

const legMid = (b: unknown, a: unknown): number | null => {
  const bid = Number(b), ask = Number(a);
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return null;
  return (bid + ask) / 2;
};

/** Opens one socket per exchange and emits the running median in USD on every
 *  book update. Legs that never connect are simply absent — the median is taken
 *  over whatever is live, which is what the venues do with a dead feed.
 *
 *  `onFailure` fires when a socket cannot be established at all, so the caller
 *  can start the polled fallback. It can fire more than once. */
export function subscribeSpotComposite(
  sym: string,
  onUpdate: (u: CompositeUpdate) => void,
  onFailure?: (leg: SpotLegId) => void,
): () => void {
  const raw: Partial<Record<SpotLegId, number>> = {};   // as quoted
  let rate: number | null = null;                        // USDT/USD
  let closed = false;
  const sockets: WebSocket[] = [];
  const retries: ReturnType<typeof setTimeout>[] = [];

  const emit = () => {
    if (closed) return;
    const legs: Partial<Record<SpotLegId, number>> = {};
    for (const leg of SPOT_LEGS) {
      const v = raw[leg.id];
      if (v == null) continue;
      if (leg.quote === 'usd') legs[leg.id] = v;
      else if (rate != null) legs[leg.id] = v * rate;
      // A USDT leg with no rate yet is held back rather than published at 1.0:
      // it would be 9bp wrong, which is larger than everything being measured.
    }
    const v = Object.values(legs).filter((p): p is number => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
    let price: number | null = null;
    if (v.length >= 3) {
      const h = v.length >> 1;
      price = v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2;
    }
    onUpdate({ price, legs, usdtUsd: rate, at: Date.now() });
  };

  const connect = (id: SpotLegId, url: string, sub: unknown, handle: (msg: unknown) => void) => {
    let attempt = 0;
    const open = () => {
      if (closed) return;
      let ws: WebSocket;
      try { ws = new WebSocket(url); } catch { onFailure?.(id); return; }
      sockets.push(ws);
      ws.onopen = () => { if (sub) try { ws.send(JSON.stringify(sub)); } catch { /* died between open and send */ } };
      ws.onmessage = (ev) => {
        attempt = 0;
        try { handle(JSON.parse(ev.data as string)); } catch { /* skip malformed frame */ }
      };
      ws.onerror = () => { if (!closed) onFailure?.(id); };
      ws.onclose = () => {
        if (closed) return;
        onFailure?.(id);
        // Backed off and capped for the same reason as the Gains socket: where
        // websocket upgrades are blocked outright, a flat retry is an infinite
        // request loop, and the caller has already moved to the polled path.
        retries.push(setTimeout(open, Math.min(30_000, 1000 * 2 ** Math.min(attempt++, 5))));
      };
    };
    open();
  };

  const S = sym.toUpperCase();

  connect('binance', `wss://data-stream.binance.vision/ws/${S.toLowerCase()}usdt@bookTicker`, null, (m) => {
    const d = m as { b?: string; a?: string };
    const p = legMid(d.b, d.a);
    if (p != null) { raw.binance = p; emit(); }
  });

  connect('bybit', 'wss://stream.bybit.com/v5/public/spot',
    { op: 'subscribe', args: [`orderbook.1.${S}USDT`] }, (m) => {
      const d = m as { topic?: string; data?: { b?: string[][]; a?: string[][] } };
      if (d.topic !== `orderbook.1.${S}USDT` || !d.data) return;
      const p = legMid(d.data.b?.[0]?.[0], d.data.a?.[0]?.[0]);
      if (p != null) { raw.bybit = p; emit(); }
    });

  connect('okx', 'wss://ws.okx.com:8443/ws/v5/public',
    { op: 'subscribe', args: [{ channel: 'tickers', instId: `${S}-USDT` }] }, (m) => {
      const d = (m as { arg?: { channel?: string }; data?: Array<{ bidPx?: string; askPx?: string }> });
      if (d.arg?.channel !== 'tickers' || !d.data?.[0]) return;
      const p = legMid(d.data[0].bidPx, d.data[0].askPx);
      if (p != null) { raw.okx = p; emit(); }
    });

  // Coinbase carries both the USD book and the USDT/USD rate the other legs
  // need, on one socket.
  connect('coinbase', 'wss://ws-feed.exchange.coinbase.com',
    { type: 'subscribe', product_ids: [`${S}-USD`, 'USDT-USD'], channels: ['ticker'] }, (m) => {
      const d = m as { type?: string; product_id?: string; best_bid?: string; best_ask?: string };
      if (d.type !== 'ticker') return;
      const p = legMid(d.best_bid, d.best_ask);
      if (p == null) return;
      if (d.product_id === 'USDT-USD') { if (p > 0.9 && p < 1.1) { rate = p; emit(); } return; }
      if (d.product_id === `${S}-USD`) { raw.coinbase = p; emit(); }
    });

  connect('kraken', 'wss://ws.kraken.com/v2',
    { method: 'subscribe', params: { channel: 'ticker', symbol: [`${S}/USD`, 'USDT/USD'] } }, (m) => {
      const d = m as { channel?: string; data?: Array<{ symbol?: string; bid?: number; ask?: number }> };
      if (d.channel !== 'ticker' || !d.data?.[0]) return;
      for (const row of d.data) {
        const p = legMid(row.bid, row.ask);
        if (p == null) continue;
        if (row.symbol === 'USDT/USD') { if (rate == null && p > 0.9 && p < 1.1) rate = p; }
        else if (row.symbol === `${S}/USD`) raw.kraken = p;
      }
      emit();
    });

  return () => {
    closed = true;
    for (const t of retries) clearTimeout(t);
    for (const ws of sockets) { try { ws.close(); } catch { /* already closing */ } }
  };
}

export interface SourceQuote { src: GainsSource; mid: number; }

/** Plain median across the spot books we can read.
 *
 *  Unweighted deliberately. Gains' oracle is documented as the median of up to
 *  8 exchange prices taken by a custom Chainlink DON, and unlike Hyperliquid
 *  they do not publish which exchanges or what weights. Inventing weights we
 *  cannot check would make the replication look more exact than it is; an equal
 *  median over the books we can read is the honest stand-in, and the measured
 *  fit error in research/gains-oracle/ is what it is worth. */
export function medianOf(quotes: SourceQuote[]): number | null {
  const v = quotes.map((q) => q.mid).filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (v.length < 3) return null;   // too thin to be a consensus of anything
  const h = v.length >> 1;
  return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2;
}

export interface IndexSourcesResponse {
  symbol: string;
  /** Every book behind this route is USDT-quoted. */
  sources: Partial<Record<GainsSource, number>>;
  missing: GainsSource[];
  /** USDT/USD, needed to turn those books into the USD price Gains quotes.
   *  Null when neither Coinbase nor Kraken answered, in which case the caller
   *  publishes nothing rather than a price that is 9bp wrong. */
  usdtUsd: number | null;
  time: number;
}

/** Reads every spot input in one call. Sources unreachable from the deploy
 *  region come back in `missing` and drop out of the median, which is what the
 *  venues themselves do with a feed that has gone quiet. */
export async function fetchIndexSources(symbol: string): Promise<IndexSourcesResponse | null> {
  try {
    const res = await fetch(`/api/market/index-sources?symbol=${encodeURIComponent(symbol)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as IndexSourcesResponse;
  } catch {
    return null;
  }
}

/** Confirms the pair indices above still carry the symbols they were pinned
 *  with. Returns the indices that no longer match, so the UI can refuse to
 *  price them rather than show a wrong number confidently. */
export async function verifyGainsPairIndices(): Promise<{ ok: number[]; drifted: number[] } | null> {
  try {
    const res = await fetch(GAINS_TRADING_VARIABLES, { cache: 'no-store' });
    if (!res.ok) return null;
    const d = await res.json();
    const pairs = d?.pairs;
    if (!Array.isArray(pairs)) return null;
    const ok: number[] = [], drifted: number[] = [];
    for (const m of GAINS_MARKETS) {
      const p = pairs[m.idx];
      if (p && p.from === m.sym && p.to === 'USD') ok.push(m.idx);
      else drifted.push(m.idx);
    }
    return { ok, drifted };
  } catch {
    return null;
  }
}
