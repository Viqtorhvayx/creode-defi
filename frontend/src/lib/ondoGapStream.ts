// Live oracle-vs-mark price stream for Ondo Perps' equity/commodity markets,
// via Creode's own relay (relay-server/ondoGapPx.js), which holds one
// persistent WebSocket to Ondo's own public API and re-broadcasts over SSE —
// same reasoning as binanceStream.ts: raw browser WebSockets get blocked in
// some environments (in-app wallets, restrictive network policies), SSE
// goes through. Both markPrice and oraclePrice are Ondo's own real,
// published numbers in every tick — nothing reconstructed or predicted.
const RELAY_URL = 'https://creode-defi-production.up.railway.app';

export interface OndoGapTick {
  markPrice: number;
  oraclePrice: number;
  time: number; // unix seconds
}

export interface OndoGapMarket { sym: string; name: string }

// Every market confirmed live on Ondo Perps' own WebSocket before shipping —
// see relay-server/ondoGapPx.js for the exact symbol mapping.
export const ONDO_GAP_MARKETS: OndoGapMarket[] = [
  { sym: 'XAU', name: 'Gold' },
  { sym: 'XAG', name: 'Silver' },
  { sym: 'AAPL', name: 'Apple' },
  { sym: 'TSLA', name: 'Tesla' },
  { sym: 'NVDA', name: 'NVIDIA' },
  { sym: 'GOOGL', name: 'Alphabet' },
  { sym: 'QQQ', name: 'Invesco QQQ Trust' },
  { sym: 'META', name: 'Meta Platforms' },
  { sym: 'MSFT', name: 'Microsoft' },
  { sym: 'AMZN', name: 'Amazon' },
  { sym: 'AMD', name: 'AMD' },
  { sym: 'COIN', name: 'Coinbase' },
  { sym: 'CRCL', name: 'Circle' },
  { sym: 'HOOD', name: 'Robinhood' },
  { sym: 'INTC', name: 'Intel' },
  { sym: 'MSTR', name: 'MicroStrategy' },
  { sym: 'NFLX', name: 'Netflix' },
  { sym: 'ORCL', name: 'Oracle' },
  { sym: 'PLTR', name: 'Palantir' },
];

/** Subscribe to a market's live oracle/mark price pair from Ondo Perps.
 *  Calls `onTick` for every update. Returns an unsubscribe function. */
export function subscribeOndoGap(sym: string, onTick: (tick: OndoGapTick) => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`${RELAY_URL}/ondo-stream?symbol=${encodeURIComponent(sym)}`);
  } catch {
    return () => {};
  }
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const markPrice = Number(msg.markPrice);
      const oraclePrice = Number(msg.oraclePrice);
      const time = Number(msg.time);
      if (Number.isFinite(markPrice) && Number.isFinite(oraclePrice) && Number.isFinite(time)) {
        onTick({ markPrice, oraclePrice, time });
      }
    } catch {
      // Skip malformed/partial frames.
    }
  };
  es.onerror = () => {};
  const source = es;
  return () => source.close();
}
