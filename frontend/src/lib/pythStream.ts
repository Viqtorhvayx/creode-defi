// Live price streaming via Pyth's Hermes SSE endpoint, replacing REST polling
// for the "majors" pairs (HBAR, USDT, WBTC, WETH). Pyth pushes a new tick the
// instant its network aggregates one (multiple times per second during active
// trading) instead of the client re-asking for a snapshot every 15-30s.
// Endpoint is publicly CORS-open (access-control-allow-origin: *), so this
// connects directly from the browser — no server relay needed.
const HERMES_STREAM = 'https://hermes.pyth.network/v2/updates/price/stream';

export interface PythTick {
  price: number; // USD
  time: number;  // unix seconds
}

/** Subscribe to a Pyth price feed. Calls `onTick` for every live update.
 *  Returns an unsubscribe function. `feedId` is the 64-char hex Pyth feed id
 *  (see PYTH_FEED_IDS in lib/market.ts). */
export function subscribePythPrice(feedId: string, onTick: (tick: PythTick) => void): () => void {
  const url = `${HERMES_STREAM}?ids[]=${feedId}&parsed=true&encoding=hex`;
  const es = new EventSource(url);
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const p = msg?.parsed?.[0];
      if (!p?.price) return;
      const price = Number(p.price.price) * 10 ** Number(p.price.expo);
      const time = Number(p.price.publish_time);
      if (Number.isFinite(price) && Number.isFinite(time)) onTick({ price, time });
    } catch {
      // Skip malformed/partial SSE frames.
    }
  };
  // EventSource auto-reconnects on transport errors per spec; nothing to do.
  es.onerror = () => {};
  return () => es.close();
}
