// Live index-vs-mark price stream for Bullbit's perpetual markets, via
// Creode's own relay (relay-server/bullbitPx.js), which holds one
// persistent WebSocket to Bullbit's own public API and re-broadcasts over
// SSE — same reasoning as binanceStream.ts: raw browser WebSockets get
// blocked in some environments (in-app wallets, restrictive network
// policies), SSE goes through. Both indexPrice and markPrice are Bullbit's
// own real, published numbers in every tick — nothing reconstructed or
// predicted. Scale-corrected server-side for Bullbit's "1000X" tickers
// (see relay-server/bullbitPx.js for why) — everything here is already the
// real per-token price.
const RELAY_URL = 'https://creode-defi-production.up.railway.app';

export interface BullbitGapTick {
  indexPrice: number;
  markPrice: number;
  time: number; // unix seconds
}

export interface BullbitGapMarket { sym: string; name: string }

// Every market confirmed live against Bullbit's own
// GET /perp/v1/exchangeInfo (status: TRADING, isLive: true) and its public
// WebSocket on 2026-08-30 — see relay-server/bullbitPx.js for the exact
// symbol/scale mapping.
export const BULLBIT_GAP_MARKETS: BullbitGapMarket[] = [
  { sym: 'BTC', name: 'Bitcoin' },
  { sym: 'ETH', name: 'Ethereum' },
  { sym: 'SOL', name: 'Solana' },
  { sym: 'XRP', name: 'XRP' },
  { sym: 'BNB', name: 'BNB' },
  { sym: 'DOGE', name: 'Dogecoin' },
  { sym: 'SUI', name: 'Sui' },
  { sym: 'STX', name: 'Stacks' },
  { sym: 'AAVE', name: 'Aave' },
  { sym: 'APT', name: 'Aptos' },
  { sym: 'HYPE', name: 'Hyperliquid' },
  { sym: 'TAO', name: 'Bittensor' },
  { sym: 'LINK', name: 'Chainlink' },
  { sym: 'SAND', name: 'The Sandbox' },
  { sym: 'NEAR', name: 'NEAR Protocol' },
  { sym: 'ZEC', name: 'Zcash' },
  { sym: 'LTC', name: 'Litecoin' },
  { sym: 'DOT', name: 'Polkadot' },
  { sym: 'AVAX', name: 'Avalanche' },
  { sym: 'ADA', name: 'Cardano' },
  { sym: 'PUMP', name: 'Pump.fun' },
  { sym: 'PEPE', name: 'Pepe' },
  { sym: 'BONK', name: 'Bonk' },
  { sym: 'PAXG', name: 'PAX Gold' },
  { sym: 'XAUT', name: 'Tether Gold' },
  { sym: 'XAG', name: 'Silver' },
  { sym: 'PLTR', name: 'Palantir' },
  { sym: 'TSLA', name: 'Tesla' },
  { sym: 'NVDA', name: 'NVIDIA' },
  { sym: 'AMD', name: 'AMD' },
  { sym: 'SAMSUNG', name: 'Samsung' },
  { sym: 'HYUNDAI', name: 'Hyundai' },
  { sym: 'SKHYNIX', name: 'SK Hynix' },
  { sym: 'SPCX', name: 'SpaceX' },
  { sym: 'SNDK', name: 'SanDisk' },
  { sym: 'EWY', name: 'iShares MSCI South Korea ETF' },
  { sym: 'DRAM', name: 'DRAM Memory Index' },
  { sym: 'SP500', name: 'S&P 500' },
];

/** Subscribe to a market's live index/mark price pair from Bullbit.
 *  Calls `onTick` for every update. Returns an unsubscribe function. */
export function subscribeBullbitGap(sym: string, onTick: (tick: BullbitGapTick) => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource(`${RELAY_URL}/bullbit-stream?symbol=${encodeURIComponent(sym)}`);
  } catch {
    return () => {};
  }
  es.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const indexPrice = Number(msg.indexPrice);
      const markPrice = Number(msg.markPrice);
      const time = Number(msg.time);
      if (Number.isFinite(indexPrice) && Number.isFinite(markPrice) && Number.isFinite(time)) {
        onTick({ indexPrice, markPrice, time });
      }
    } catch {
      // Skip malformed/partial frames.
    }
  };
  es.onerror = () => {};
  const source = es;
  return () => source.close();
}
