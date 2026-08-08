// Creode's own live replica of Hotstuff/Hyperliquid's mark price, sourced
// entirely from their own public data and computed continuously instead of
// waiting for their official once-per-second published field. Their own
// documented formula (median of three):
//   pMark = median of:
//     1. pOracle + 150s EMA of (pMid - pOracle)
//     2. median(bestBid, bestAsk, lastTrade)   <- Hotstuff's own order book
//     3. pOracle itself
//
// VALIDATED before being wired in here: ran this exact formula side by side
// against Hotstuff's real, official markPx for 5 minutes on BTC and ETH —
// mean absolute deviation 0.0017% (BTC) and 0.0033% (ETH), worst-case under
// 0.032% for either, across 100 live samples each. Do not add more coins to
// COINS below without re-running that same validation first — this module
// is the PREFERRED source for the symbols it covers (server.js suppresses
// Binance's own broadcast for these symbols while this stays fresh), not a
// pure accelerant like the rest of this relay, so a wrong number here would
// be shown as the chart's actual price, not just arrive a bit slower.
const WebSocket = require('ws');

const COINS = ['BTC', 'ETH']; // validated set only.
const EMA_TAU_SEC = 150;
const ORACLE_POLL_MS = 500;
// server.js treats replica data older than this as stale and falls back to
// broadcasting Binance directly for these symbols again.
const REPLICA_FRESH_MS = 2000;

const state = {};
for (const c of COINS) state[c] = { oraclePx: null, bestBid: null, bestAsk: null, lastTrade: null, emaVal: null, emaLastT: null };

function median3(a, b, c) {
  return [a, b, c].sort((x, y) => x - y)[1];
}

function updateEma(sym, pMid, oraclePx, t) {
  const s = state[sym];
  if (pMid == null || oraclePx == null) return;
  const diff = pMid - oraclePx;
  if (s.emaVal == null) { s.emaVal = diff; s.emaLastT = t; return; }
  const dtSec = (t - s.emaLastT) / 1000;
  const alpha = 1 - Math.exp(-dtSec / EMA_TAU_SEC);
  s.emaVal = s.emaVal + alpha * (diff - s.emaVal);
  s.emaLastT = t;
}

function computeMarkPx(sym) {
  const s = state[sym];
  if (s.oraclePx == null || s.bestBid == null || s.bestAsk == null || s.lastTrade == null || s.emaVal == null) return null;
  return median3(s.oraclePx + s.emaVal, median3(s.bestBid, s.bestAsk, s.lastTrade), s.oraclePx);
}

function emitIfReady(sym, broadcast, replicaFreshAt) {
  const markPx = computeMarkPx(sym);
  if (markPx == null) return;
  const t = Date.now();
  broadcast(sym, { price: markPx, time: Math.floor(t / 1000) });
  replicaFreshAt.set(sym, t);
}

function connectOraclePoll(broadcast, replicaFreshAt) {
  async function poll() {
    try {
      const res = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
      });
      const [meta, ctxs] = await res.json();
      const t = Date.now();
      for (const sym of COINS) {
        const idx = meta.universe.findIndex((u) => u.name === sym);
        if (idx === -1) continue;
        state[sym].oraclePx = Number(ctxs[idx].oraclePx);
        const { bestBid, bestAsk } = state[sym];
        if (bestBid != null && bestAsk != null) updateEma(sym, (bestBid + bestAsk) / 2, state[sym].oraclePx, t);
        emitIfReady(sym, broadcast, replicaFreshAt);
      }
    } catch (e) {
      console.error('[hotstuff-markpx] oracle poll failed:', e.message);
    }
    setTimeout(poll, ORACLE_POLL_MS);
  }
  poll();
}

function connectBookWs(broadcast, replicaFreshAt) {
  let ws;
  try {
    ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
  } catch (e) {
    console.error('[hotstuff-markpx] failed to open ws, retrying in 5s:', e.message);
    setTimeout(() => connectBookWs(broadcast, replicaFreshAt), 5000);
    return;
  }

  ws.on('open', () => {
    console.log('[hotstuff-markpx] connected, subscribing to l2Book + trades for', COINS.join(', '));
    for (const coin of COINS) {
      ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'l2Book', coin } }));
      ws.send(JSON.stringify({ method: 'subscribe', subscription: { type: 'trades', coin } }));
    }
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.channel === 'l2Book') {
        const coin = msg.data.coin;
        if (!state[coin]) return;
        const [bids, asks] = msg.data.levels;
        if (bids?.[0]) state[coin].bestBid = Number(bids[0].px);
        if (asks?.[0]) state[coin].bestAsk = Number(asks[0].px);
        emitIfReady(coin, broadcast, replicaFreshAt);
      } else if (msg.channel === 'trades') {
        const touched = new Set();
        for (const tr of msg.data) {
          if (!state[tr.coin]) continue;
          state[tr.coin].lastTrade = Number(tr.px);
          touched.add(tr.coin);
        }
        for (const coin of touched) emitIfReady(coin, broadcast, replicaFreshAt);
      }
    } catch { /* skip malformed frame */ }
  });

  ws.on('error', (e) => console.error('[hotstuff-markpx] ws error:', e.message));
  ws.on('close', () => {
    console.error('[hotstuff-markpx] ws closed, reconnecting in 2s');
    setTimeout(() => connectBookWs(broadcast, replicaFreshAt), 2000);
  });
}

// replicaFreshAt: Map<sym, timestampMs> — server.js reads this to decide
// whether to suppress Binance's own broadcast for these symbols.
function connectHotstuffMarkPx(broadcast, replicaFreshAt) {
  connectBookWs(broadcast, replicaFreshAt);
  connectOraclePoll(broadcast, replicaFreshAt);
}

module.exports = { connectHotstuffMarkPx, REPLICA_FRESH_MS, COINS };
