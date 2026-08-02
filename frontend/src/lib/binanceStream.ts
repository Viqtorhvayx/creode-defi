// Live price streaming via Creode's own server-side Binance relay
// (/api/market/binance-stream), which holds the real WebSocket connection to
// Binance and re-emits each trade print over Server-Sent Events. SSE is used
// instead of a direct client WebSocket because some environments (in-app
// wallet browsers, restrictive network policies) block raw WebSocket
// upgrades outright at a level JavaScript can't catch or recover from, while
// ordinary HTTPS/SSE traffic — the same mechanism the Pyth stream already
// relies on in this app — goes through fine.
//
// This is used as a pure accelerant layered on top of the existing 150ms
// REST poll in PriceChart.tsx, not a replacement for it: the poll keeps
// running unmodified regardless of whether this connects, so a failure here
// is silent and has zero visible impact — the chart simply continues at its
// current, already-working pace.
export interface BinanceTick {
  price: number; // USD (quoted in USDT)
  time: number;  // unix seconds
}

/** Subscribe to a symbol's live Binance trade price (e.g. "BTC" → BTCUSDT).
 *  Calls `onTick` for every trade print. Returns an unsubscribe function. */
export function subscribeBinancePrice(sym: string, onTick: (tick: BinanceTick) => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`/api/market/binance-stream?symbol=${encodeURIComponent(sym)}`);
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
  // EventSource auto-reconnects on transport errors/closes per spec —
  // including the relay's own proactive close every ~9s. No manual error
  // handling needed since a silent gap here just means the poll keeps
  // supplying the price as it already does.
  es.onerror = () => {};
  const source = es;
  return () => source.close();
}
