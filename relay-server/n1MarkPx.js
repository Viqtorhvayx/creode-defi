// Creode's tokens now come directly from 01 Exchange/N1's (terminal.trade)
// own published mark price — not a reconstruction. Their public REST API
// already computes and publishes it themselves (GET /markets/live on
// zo-mainnet.n1.xyz -> markets[].perpetuals.markPrice), so there's nothing
// to replicate or guess at: this is their real number, polled and
// re-broadcast, the same trust model as consuming their own indexPrice for
// anything else. Originally built for just BTC/ETH (replacing an earlier
// Hyperliquid-targeted markPx replica); extended to every symbol server.js
// tracks once that proved out, since N1's /markets/live already returns
// every market in one bulk call regardless of how many symbols we use from
// it — covering more symbols costs nothing extra.
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
      const price = Number(m?.perpetuals?.markPrice);
      if (!Number.isFinite(price)) continue;
      broadcast(sym, { price, time: Math.floor(t / 1000) });
      replicaFreshAt.set(sym, t);
    }
  } catch (e) {
    console.error('[n1-markpx] poll failed:', e.message);
  }
  setTimeout(() => poll(broadcast, replicaFreshAt, trackedSyms), POLL_MS);
}

// replicaFreshAt: Map<sym, timestampMs> — server.js reads this to decide
// whether to suppress Binance's own broadcast for these symbols. `symbols`
// is every symbol server.js tracks (including ones with no Binance upstream
// at all, like LIT) — only symbols N1 actually lists get anything broadcast.
function connectN1MarkPx(broadcast, replicaFreshAt, symbols) {
  const trackedSyms = new Set(symbols);
  poll(broadcast, replicaFreshAt, trackedSyms);
}

module.exports = { connectN1MarkPx, REPLICA_FRESH_MS };
