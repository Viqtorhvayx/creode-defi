// Bullbit Gap Monitor: a persistent WebSocket to Bullbit's own public,
// unauthenticated price feed (wss://app.bullbit.ai/ws), re-broadcast to
// browsers over SSE by server.js — same reasoning as every other feed in
// this file: browser WebSockets get blocked in some environments, SSE goes
// through; Vercel serverless functions can't hold a connection open this
// long anyway.
//
// Bullbit publishes two genuinely different numbers per market, confirmed
// live against https://app.bullbit.ai/api/perp/v1/exchangeInfo and the WS
// itself: Index Price (their aggregated oracle, pulled from major CEXes +
// external oracles) and Mark Price (index price + a 300-block EMA basis —
// see their docs' Pricing Engine page). This module streams both, exactly
// as published, for every live market.
//
// SCALE WARNING (learned from the earlier N1 kPEPE bug — see n1IndexPx.js):
// Bullbit lists some ultra-low-priced assets as "1000XUSD" (e.g.
// 1000PEPEUSD, 1000BONKUSD) meaning the price is quoted PER 1000 TOKENS,
// same convention as Hyperliquid's "k" prefix. Confirmed live:
// 1000pepeusd@index-price read 0.0036678 while real per-PEPE price is
// ~0.0000036678 -- exactly a 1000x ratio. SYMBOL_MAP below strips the
// "1000" prefix for display AND divides the raw price by 1000, baked in
// from the start this time rather than fixed after shipping wrong.

const WS_URL = 'wss://app.bullbit.ai/ws';
const RECONNECT_MS = 2000;

// { rawSymbol (Bullbit's own, e.g. "1000PEPEUSD") -> { sym (display), scale } }
// Built from the 38 live/TRADING symbols confirmed via GET
// /perp/v1/exchangeInfo on 2026-08-30. Display names for the human label
// live in frontend/src/lib/bullbitGapStream.ts, not here -- this only needs
// the raw Bullbit symbol, the display ticker, and the scale divisor.
const SYMBOL_MAP = {
  BTCUSD: { sym: 'BTC', scale: 1 },
  ETHUSD: { sym: 'ETH', scale: 1 },
  SOLUSD: { sym: 'SOL', scale: 1 },
  XRPUSD: { sym: 'XRP', scale: 1 },
  BNBUSD: { sym: 'BNB', scale: 1 },
  DOGEUSD: { sym: 'DOGE', scale: 1 },
  SUIUSD: { sym: 'SUI', scale: 1 },
  STXUSD: { sym: 'STX', scale: 1 },
  AAVEUSD: { sym: 'AAVE', scale: 1 },
  APTUSD: { sym: 'APT', scale: 1 },
  HYPEUSD: { sym: 'HYPE', scale: 1 },
  TAOUSD: { sym: 'TAO', scale: 1 },
  LINKUSD: { sym: 'LINK', scale: 1 },
  SANDUSD: { sym: 'SAND', scale: 1 },
  NEARUSD: { sym: 'NEAR', scale: 1 },
  ZECUSD: { sym: 'ZEC', scale: 1 },
  LTCUSD: { sym: 'LTC', scale: 1 },
  DOTUSD: { sym: 'DOT', scale: 1 },
  AVAXUSD: { sym: 'AVAX', scale: 1 },
  ADAUSD: { sym: 'ADA', scale: 1 },
  PUMPUSD: { sym: 'PUMP', scale: 1 },
  '1000PEPEUSD': { sym: 'PEPE', scale: 1000 },
  '1000BONKUSD': { sym: 'BONK', scale: 1000 },
  PAXGUSD: { sym: 'PAXG', scale: 1 },
  XAUTUSD: { sym: 'XAUT', scale: 1 },
  XAGUSD: { sym: 'XAG', scale: 1 },
  PLTRUSD: { sym: 'PLTR', scale: 1 },
  TSLAUSD: { sym: 'TSLA', scale: 1 },
  NVDAUSD: { sym: 'NVDA', scale: 1 },
  AMDUSD: { sym: 'AMD', scale: 1 },
  SAMSUNGUSD: { sym: 'SAMSUNG', scale: 1 },
  HYUNDAIUSD: { sym: 'HYUNDAI', scale: 1 },
  SKHYNIXUSD: { sym: 'SKHYNIX', scale: 1 },
  SPCXUSD: { sym: 'SPCX', scale: 1 },
  SNDKUSD: { sym: 'SNDK', scale: 1 },
  EWYUSD: { sym: 'EWY', scale: 1 },
  DRAMUSD: { sym: 'DRAM', scale: 1 },
  SP500USD: { sym: 'SP500', scale: 1 },
};

const SYMBOLS = Object.values(SYMBOL_MAP).map((v) => v.sym);
const RAW_BY_SYM = Object.fromEntries(Object.entries(SYMBOL_MAP).map(([raw, v]) => [v.sym, raw]));

function connectBullbitPx(onTick) {
  let ws;
  try {
    ws = new WebSocket(WS_URL);
  } catch {
    setTimeout(() => connectBullbitPx(onTick), RECONNECT_MS);
    return;
  }

  // sym -> last known indexPrice/markPrice, so a tick only fires (and the
  // UI only gets a usable pair) once both sides of a market are known.
  const lastIndex = new Map();
  const lastMark = new Map();

  ws.onopen = () => {
    const methods = Object.keys(SYMBOL_MAP).flatMap((raw) => {
      const lower = raw.toLowerCase();
      return [`${lower}@index-price`, `${lower}@mark-price`];
    });
    ws.send(JSON.stringify({ action: 'SUBSCRIBE', methods }));
  };

  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (!msg || (msg.type !== 'INDEX_PRICE' && msg.type !== 'MARK_PRICE')) return;

    const raw = String(msg.method || '').split('@')[0].toUpperCase();
    const info = SYMBOL_MAP[raw];
    const price = Number(msg.data);
    if (!info || !Number.isFinite(price)) return;

    const scaled = price / info.scale;
    if (msg.type === 'INDEX_PRICE') lastIndex.set(info.sym, scaled);
    else lastMark.set(info.sym, scaled);

    const indexPrice = lastIndex.get(info.sym);
    const markPrice = lastMark.get(info.sym);
    if (indexPrice == null || markPrice == null) return;

    onTick(info.sym, { indexPrice, markPrice, time: Math.floor(Date.now() / 1000) });
  };

  ws.onerror = () => {
    try { ws.close(); } catch { /* already closing */ }
  };
  ws.onclose = () => setTimeout(() => connectBullbitPx(onTick), RECONNECT_MS);
}

module.exports = { connectBullbitPx, SYMBOLS, RAW_BY_SYM };
