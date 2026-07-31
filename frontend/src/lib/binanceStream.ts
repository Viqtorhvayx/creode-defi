// Live price streaming via Creode's own server-side Binance relay
// (/api/market/binance-stream), which holds the real WebSocket connection to
// Binance and re-emits each trade print over Server-Sent Events. SSE is used
// instead of a direct client WebSocket because some environments (in-app
// wallet browsers, restrictive network policies) block raw WebSocket
// upgrades outright at a level JavaScript can't catch or recover from, while
// ordinary HTTPS/SSE traffic — the same mechanism the Pyth stream already
// relies on in this app — goes through fine. Updates arrive per trade print
// (often several times a second on liquid pairs) instead of on a fixed
// polling interval.
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
    // EventSource itself unavailable — nothing to subscribe to; the caller's
    // own Pyth/Bybit fallback cascade takes over once this stays silent.
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
  // including the relay's own proactive close every ~9s.
  es.onerror = () => {};
  const source = es;
  return () => source.close();
}
