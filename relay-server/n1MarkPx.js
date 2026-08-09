// Creode's BTC/ETH price now comes directly from 01 Exchange/N1's
// (terminal.trade) own published mark price — not a reconstruction. Their
// public REST API already computes and publishes it themselves
// (GET /markets/live on zo-mainnet.n1.xyz -> markets[].perpetuals.markPrice),
// so there's nothing to replicate or guess at: this is their real number,
// polled and re-broadcast, the same trust model as consuming their own
// indexPrice for anything else. This replaces the earlier
// Hyperliquid-targeted markPx replica now that the rest of the Vault chart
// tracks N1 instead of Hyperliquid — BTC/ETH need to track the same
// platform as everything else on the chart.
const N1_LIVE_URL = 'https://zo-mainnet.n1.xyz/markets/live';
const POLL_MS = 400; // N1's own value changes roughly once per second (measured); this samples faster so a new value is picked up close to when it's published.
// server.js treats a value older than this as stale and falls back to
// broadcasting Binance directly for these symbols again.
const REPLICA_FRESH_MS = 2000;

// BTC = marketId 0, ETH = marketId 1 on N1's own market list (verified via
// GET /info on zo-mainnet.n1.xyz).
const MARKET_ID_TO_SYM = { 0: 'BTC', 1: 'ETH' };
const COINS = Object.values(MARKET_ID_TO_SYM);

async function poll(broadcast, replicaFreshAt) {
  try {
    const res = await fetch(N1_LIVE_URL);
    const data = await res.json();
    const t = Date.now();
    for (const m of data.markets) {
      const sym = MARKET_ID_TO_SYM[m.marketId];
      if (!sym) continue;
      const price = Number(m?.perpetuals?.markPrice);
      if (!Number.isFinite(price)) continue;
      broadcast(sym, { price, time: Math.floor(t / 1000) });
      replicaFreshAt.set(sym, t);
    }
  } catch (e) {
    console.error('[n1-markpx] poll failed:', e.message);
  }
  setTimeout(() => poll(broadcast, replicaFreshAt), POLL_MS);
}

// replicaFreshAt: Map<sym, timestampMs> — server.js reads this to decide
// whether to suppress Binance's own broadcast for these symbols.
function connectN1MarkPx(broadcast, replicaFreshAt) {
  poll(broadcast, replicaFreshAt);
}

module.exports = { connectN1MarkPx, REPLICA_FRESH_MS, COINS };
