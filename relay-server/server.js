// Standalone, always-on relay for Binance's live trade-print WebSocket.
//
// This exists because the main Next.js app runs on Vercel's serverless
// functions, which can't hold a connection open indefinitely — its own
// relay (frontend/src/app/api/market/binance-stream) has to reconnect to
// Binance roughly every 9 seconds. This service is a small, ordinary
// long-running Node process instead: it opens ONE persistent WebSocket to
// Binance per symbol and keeps it open indefinitely (only reconnecting if
// the connection actually drops), then re-broadcasts every trade print to
// however many browsers are listening.
//
// Browser clients connect over Server-Sent Events, not a raw WebSocket —
// deliberately, matching the same reasoning as the Vercel relay: some
// environments (in-app wallet browsers, restrictive network policies) block
// raw WebSocket upgrades outright at a level client-side JavaScript can't
// catch or recover from, while ordinary HTTPS/SSE traffic goes through fine.
// The upstream leg (this server -> Binance) is a normal server-to-server
// WebSocket, which has never been the problem — only browser-initiated
// WebSocket connections were.
//
// This file is standalone on purpose: no build step, no framework, just
// Node's built-in http module plus the `ws` package for the upstream
// connections, so it deploys identically on Render, Fly.io, Railway, or any
// other Docker-capable host.

const http = require('http');
const WebSocket = require('ws');
const { connectHotstuffMarkPx, REPLICA_FRESH_MS } = require('./hotstuffMarkPx');

// The tokens the Vault chart tracks that 01 Exchange/N1 (terminal.trade)
// also lists (must match frontend/src/lib/market.ts's VAULT_WATCH_TOKENS,
// minus HBAR — HBAR isn't an N1 pair and stays on its own separate
// Pyth-only path). Listed in N1's own market order (GET /info on
// zo-mainnet.n1.xyz), skipping IP — N1's only listed token with neither a
// live Binance USDT pair nor a stable Pyth feed, so there's no real-time
// source for it at all.
// LIT is deliberately excluded: Binance's LITUSDT is a different, unrelated
// coin (Litentry) than N1's LIT (Lighter) — confirmed live, Binance priced
// it at ~$0.74 while Pyth's correct LIT feed read ~$2.34 at the same
// instant. LIT still trades on Creode's chart via Pyth alone (see
// PYTH_ONLY_SYMS in PriceChart.tsx); it just never opens a relay
// connection here, so this process can't broadcast the wrong asset's price.
const SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'HYPE', 'BERA', 'SUI', 'XRP', 'WLFI', 'XPL', 'S',
  'JUP', 'EIGEN', 'APT', 'AAVE', 'KAITO', 'VIRTUAL', 'ENA', 'NEAR', 'ARB', 'ZEC',
  'ASTER', 'PAXG', 'PUMP', 'WLD', 'TAO', 'DOGE', 'BNB', 'UNI', 'ONDO',
  'PENGU', 'PEPE', 'FARTCOIN', 'MON', 'VVV', 'ZRO', 'MORPHO', 'AERO',
];

const BINANCE_WS = 'wss://stream.binance.com:443/ws';
const PORT = process.env.PORT || 3001;

// sym -> Set<ServerResponse> currently subscribed over SSE.
const subscribers = new Map(SYMBOLS.map((sym) => [sym, new Set()]));
// sym -> last known {price, time}, so a brand-new subscriber gets an
// immediate value instead of waiting for the next trade print.
const lastTick = new Map();
// sym -> ms timestamp of the last fresh tick from hotstuffMarkPx.js, for the
// small set of symbols (BTC/ETH) where that's the preferred source. See
// connectUpstream's message handler below for how this suppresses Binance's
// own broadcast while the replica is healthy, and falls back the instant
// it isn't.
const replicaFreshAt = new Map();

function broadcast(sym, tick) {
  lastTick.set(sym, tick);
  const subs = subscribers.get(sym);
  if (!subs || subs.size === 0) return;
  const payload = `data: ${JSON.stringify(tick)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { /* client likely disconnected; req 'close' will clean it up */ }
  }
}

function connectUpstream(sym) {
  const pair = `${sym.toLowerCase()}usdt`;
  let ws;
  try {
    ws = new WebSocket(`${BINANCE_WS}/${pair}@trade`);
  } catch {
    setTimeout(() => connectUpstream(sym), 2000);
    return;
  }

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const price = Number(msg.p);
      const time = Math.floor(Number(msg.T) / 1000);
      if (!Number.isFinite(price) || !Number.isFinite(time)) return;
      // Suppressed while hotstuffMarkPx.js's replica is fresh for this
      // symbol — for BTC/ETH that's the preferred source now (Hotstuff's
      // own validated mark price, not just raw Binance), not an accelerant
      // layered alongside Binance like every other symbol here. Binance
      // still resumes automatically the moment the replica goes stale, so
      // these symbols are never left without a live price either way.
      const freshAt = replicaFreshAt.get(sym);
      if (freshAt && Date.now() - freshAt < REPLICA_FRESH_MS) return;
      broadcast(sym, { price, time });
    } catch {
      // Skip malformed/partial frames.
    }
  });

  // Only reconnect on an actual drop — never on a timer. That's the entire
  // point of running this as a real process instead of on Vercel.
  ws.on('close', () => setTimeout(() => connectUpstream(sym), 1000));
  ws.on('error', () => { try { ws.close(); } catch { /* already closing */ } });
}

SYMBOLS.forEach(connectUpstream);
connectHotstuffMarkPx(broadcast, replicaFreshAt);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  if (url.pathname === '/stream') {
    const sym = (url.searchParams.get('symbol') || '').toUpperCase();
    if (!SYMBOLS.includes(sym)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('unknown symbol');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Public, read-only market data — the browser will be connecting
      // from a different origin (this relay's own domain, not Creode's),
      // same open-CORS posture as Pyth's own public Hermes stream.
      'Access-Control-Allow-Origin': '*',
    });

    const existing = lastTick.get(sym);
    if (existing) res.write(`data: ${JSON.stringify(existing)}\n\n`);

    subscribers.get(sym).add(res);
    req.on('close', () => { subscribers.get(sym)?.delete(res); });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`creode-binance-relay listening on :${PORT}`);
});
