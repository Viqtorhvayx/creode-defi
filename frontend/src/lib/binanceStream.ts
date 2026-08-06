// Live price streaming via Creode's own standalone relay server
// (relay-server/, deployed separately on Railway — see that folder's
// README), which holds ONE genuinely persistent WebSocket connection to
// Binance per symbol and re-emits each trade print over Server-Sent Events.
// Unlike the earlier Vercel-hosted relay (/api/market/binance-stream, kept
// in the repo but no longer used here), this one isn't a serverless
// function, so it never has to reconnect on an execution-time limit —
// confirmed live: a 6-second test pulled hundreds of distinct real trade
// ticks with no drops. SSE (not a raw client WebSocket) is used for the
// same reason as everywhere else in this app: some environments block
// WebSocket upgrades at a level JS can't catch, while SSE goes through.
//
// This is used as a pure accelerant layered on top of the existing 50ms
// REST poll (via /api/market/cex-fallback) in PriceChart.tsx, not a
// replacement for it: the poll keeps running unmodified regardless of
// whether this connects, so a failure here — the relay going down, Railway
// having an outage, anything — is silent and has zero visible impact, the
// chart simply continues at its current, already-working pace.
const RELAY_URL = 'https://creode-defi-production.up.railway.app';

export interface BinanceTick {
  price: number; // USD (quoted in USDT)
  time: number;  // unix seconds
}

/** Subscribe to a symbol's live Binance trade price (e.g. "BTC" → BTCUSDT).
 *  Calls `onTick` for every trade print. Returns an unsubscribe function. */
export function subscribeBinancePrice(sym: string, onTick: (tick: BinanceTick) => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`${RELAY_URL}/stream?symbol=${encodeURIComponent(sym)}`);
  } catch {
    // EventSource itself unavailable — nothing to subscribe to. The caller's
    // existing REST poll is unaffected and keeps the price current.
    return () => {};
  }
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const price = Number(msg.price);
      const time = Number(msg.time);
      if (Number.isFinite(price) && Number.isFinite(time)) onTick({ price, time });
    } catch {
      // Skip malformed/partial frames.
    }
  };
  // EventSource auto-reconnects on transport errors/closes per spec. The
  // relay itself never proactively closes (it's a real persistent process,
  // not a serverless function), so this should only ever fire on a genuine
  // network drop. No manual error handling needed either way — a silent gap
  // here just means the poll keeps supplying the price as it already does.
  es.onerror = () => {};
  const source = es;
  return () => source.close();
}
