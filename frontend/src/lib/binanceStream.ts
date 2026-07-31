// Live price streaming via Binance's public trade-stream WebSocket — pushes
// a tick the instant a trade prints (often several times a second on liquid
// pairs) instead of polling a REST snapshot on a fixed interval. This is the
// same underlying Binance spot data vDEX's own pOracle samples once a
// second; streaming it instead of polling it is what makes Creode's chart
// faster than vDEX's, not a different data source. Public market-data
// stream, no auth/CORS restriction, so this connects directly from the
// browser — no server relay needed.
const BINANCE_WS = 'wss://stream.binance.com:443/ws';

export interface BinanceTick {
  price: number; // USD (quoted in USDT)
  time: number;  // unix seconds
}

/** Subscribe to a symbol's live Binance trade price (e.g. "BTC" → BTCUSDT).
 *  Calls `onTick` for every trade print. Reconnects with backoff on drop.
 *  Returns an unsubscribe function. */
export function subscribeBinancePrice(sym: string, onTick: (tick: BinanceTick) => void): () => void {
  const pair = `${sym.toLowerCase()}usdt`;
  let ws: WebSocket | null = null;
  let closed = false;
  let retryDelay = 1000;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (closed) return;
    try {
      ws = new WebSocket(`${BINANCE_WS}/${pair}@trade`);
    } catch {
      // WebSocket unavailable/blocked in this environment (some in-app
      // browsers restrict it) — retry with backoff instead of throwing
      // synchronously out of the caller's effect, which would otherwise
      // crash the whole render. The Pyth/Bybit fallback in PriceChart
      // takes over once this has been silent for 10s.
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
      return;
    }
    ws.onopen = () => { retryDelay = 1000; };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        const price = Number(msg.p);
        const time = Math.floor(Number(msg.T) / 1000);
        if (Number.isFinite(price) && Number.isFinite(time)) onTick({ price, time });
      } catch {
        // Skip malformed/partial frames.
      }
    };
    ws.onclose = () => {
      if (closed) return;
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 15000);
    };
    ws.onerror = () => { ws?.close(); };
  };

  connect();
  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    ws?.close();
  };
}
