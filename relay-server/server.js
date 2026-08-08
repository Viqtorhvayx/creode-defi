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

// The 20 tokens the Vault chart tracks that Hotstuff/Hyperliquid also lists
// (must match frontend/src/lib/market.ts's VAULT_WATCH_TOKENS, minus HBAR —
// HBAR isn't a Hotstuff pair and stays on its own separate Pyth-only path).
const SYMBOLS = [
  'BTC', 'ETH', 'SOL', 'HYPE', 'XRP', 'BNB', 'DOGE', 'SUI', 'AVAX', 'LINK',
  'AAVE', 'TON', 'NEAR', 'TAO', 'ZEC', 'PENGU', 'PEPE', 'ASTER', 'WLFI', 'FARTCOIN',
];

const BINANCE_WS = 'wss://stream.binance.com:443/ws';
const PORT = process.env.PORT || 3001;

// sym -> Set<ServerResponse> currently subscribed over SSE.
const subscribers = new Map(SYMBOLS.map((sym) => [sym, new Set()]));
// sym -> last known {price, time}, so a brand-new subscriber gets an
// immediate value instead of waiting for the next trade print.
const lastTick = new Map();

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
