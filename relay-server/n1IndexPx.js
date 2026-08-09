// Creode's tokens come directly from 01 Exchange/N1's (terminal.trade) own
// published INDEX price (their oracle price — median of Pyth/Switchboard),
// not their mark price, and not a reconstruction of either. Both are real
// fields N1 already computes and publishes themselves in the same API
// response (GET /markets/live on zo-mainnet.n1.xyz ->
// markets[].indexPrice / markets[].perpetuals.markPrice) — this was
// n1MarkPx.js using the mark field until a live measurement (3 minutes,
// 1002 samples, 38 tokens) showed N1's own mark price lags its own index
// price by a median of ~3.2s whenever they diverge: index is fed straight
// from Pyth/Switchboard, while mark is derived from N1's own order book and
// only pulled back toward index over time via funding, not instantly. So
// index price is N1's own faster-updating real number — nothing predicted
// or invented, just choosing the one of N1's own two published fields that
// leads instead of the one that lags.
const N1_INFO_URL = 'https://zo-mainnet.n1.xyz/info';
const N1_LIVE_URL = 'https://zo-mainnet.n1.xyz/markets/live';
const POLL_MS = 400; // N1's own values change roughly once per second (measured); this samples faster so a new value is picked up close to when it's published.
// server.js treats a value older than this as stale and falls back to
// broadcasting Binance directly for these symbols again.
const REPLICA_FRESH_MS = 2000;

// marketId -> our symbol, built once from N1's own market list. 'k'-prefixed
// symbols (e.g. kPEPE) are Hyperliquid/N1's convention for a 1000x-scaled
// display price, not a different asset — stripped to match our own naming.
let marketIdToSym = null;

async function buildMapping() {
  const res = await fetch(N1_INFO_URL);
  const data = await res.json();
  const map = {};
  for (const m of data.markets) {
    let sym = m.symbol.replace(/USD$/, '');
    if (sym.startsWith('k')) sym = sym.slice(1);
    map[m.marketId] = sym;
  }
  return map;
}

async function poll(broadcast, replicaFreshAt, trackedSyms) {
  try {
    if (!marketIdToSym) marketIdToSym = await buildMapping();
    const res = await fetch(N1_LIVE_URL);
    const data = await res.json();
    const t = Date.now();
    for (const m of data.markets) {
      const sym = marketIdToSym[m.marketId];
      if (!sym || !trackedSyms.has(sym)) continue;
      const price = Number(m?.indexPrice);
      if (!Number.isFinite(price)) continue;
      broadcast(sym, { price, time: Math.floor(t / 1000) });
      replicaFreshAt.set(sym, t);
    }
  } catch (e) {
    console.error('[n1-indexpx] poll failed:', e.message);
  }
  setTimeout(() => poll(broadcast, replicaFreshAt, trackedSyms), POLL_MS);
}

// replicaFreshAt: Map<sym, timestampMs> — server.js reads this to decide
// whether to suppress Binance's own broadcast for these symbols. `symbols`
// is every symbol server.js tracks (including ones with no Binance upstream
// at all, like LIT) — only symbols N1 actually lists get anything broadcast.
function connectN1IndexPx(broadcast, replicaFreshAt, symbols) {
  const trackedSyms = new Set(symbols);
  poll(broadcast, replicaFreshAt, trackedSyms);
}

module.exports = { connectN1IndexPx, REPLICA_FRESH_MS };
