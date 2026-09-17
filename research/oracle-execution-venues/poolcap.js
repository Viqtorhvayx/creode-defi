// Oracle lag on venues where the oracle IS the fill price.
//
// On an order-book venue a lagging oracle is unreachable because you fill at
// the book. On these venues there is no book — the oracle is the price you get,
// so any lag is directly tradeable and the only defence is the spread, the fees
// and how fast you can act.
//
// GMX v2 publishes minPrice/maxPrice per token; on BTC the band is currently
// collapsed to zero, so their cost sits in price impact and fees rather than a
// quoted spread. Ostium quotes an explicit bid/ask around its oracle.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const out = fs.createWriteStream(`${S}/pool.jsonl`, { flags: 'w' });
const UA = { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } };
const last = {}; const counts = {};
let running = true;

const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};

// reference: Binance perp, dense
(function ref() {
  let ws;
  const open = () => {
    if (!running) return;
    try { ws = new WebSocket('wss://fstream.binance.com/ws/btcusdt@bookTicker'); } catch { return setTimeout(open, 3000); }
    ws.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m.e === 'bookTicker') emit('binance', (Number(m.b) + Number(m.a)) / 2); } catch {} };
    ws.onclose = () => { if (running) setTimeout(open, 2000); };
    ws.onerror = () => {};
  };
  open();
})();

async function poll(name, ms, fn) {
  while (running) {
    const t0 = Date.now();
    try { await fn(); } catch {}
    await new Promise((r) => setTimeout(r, Math.max(0, ms - (Date.now() - t0))));
  }
}

// GMX v2 — prices scaled to (30 − tokenDecimals); BTC has 8
poll('gmx', 300, async () => {
  const t = await (await fetch('https://arbitrum-api.gmxinfra.io/prices/tickers', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const b = t.find((x) => x.tokenSymbol === 'BTC');
  if (!b) return;
  const mn = Number(b.minPrice) / 1e22, mx = Number(b.maxPrice) / 1e22;
  emit('gmx-oracle', (mn + mx) / 2, { spread: mx - mn, updatedAt: Number(b.updatedAt) });
});

// Ostium — explicit bid/ask around its Stork oracle
poll('ostium', 300, async () => {
  const a = await (await fetch('https://metadata-backend.ostium.io/PricePublish/latest-prices', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const f = a.find((x) => x.from === 'BTC' && x.to === 'USD');
  if (!f) return;
  emit('ostium-oracle', Number(f.mid), { spread: Number(f.ask) - Number(f.bid), ts: Number(f.timestampMs) });
});

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 720000));
