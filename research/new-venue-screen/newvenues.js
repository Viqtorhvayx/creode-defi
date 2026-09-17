// Oracle-lag capture for the new venues whose APIs were cracked by netcap.js.
//
// The question is not just "does the oracle lag" — it is "does the lag sit
// somewhere you could reach". So for each venue we record the oracle AND the
// market price (mark / last trade / book) where the venue exposes both. A
// lagging oracle next to a fast book is untradeable, which is how every
// earlier lead in this session died.
//
// Reference is Binance spot, polled on the same clock as everything else.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RUN_MS = Number(process.env.RUN_MS || 10 * 60 * 1000);
const out = fs.createWriteStream(`${S}/newv.jsonl`, { flags: 'w' });
const last = {}; const counts = {};
let running = true;

const emit = (f, m) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m }) + '\n');
};

const UA = { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } };
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

async function poll(name, ms, fn) {
  while (running) {
    const t0 = Date.now();
    try { await fn(); } catch { /* venue hiccup */ }
    await new Promise((r) => setTimeout(r, Math.max(0, ms - (Date.now() - t0))));
  }
}

// --- reference: Binance USDT-M perp over websocket ---
// Polling spot gave only 8 price changes in 50s on a quiet tape, which is far
// too sparse to locate a lag. The perp book ticker pushes thousands.
(function refFeed() {
  let ws;
  const open = () => {
    if (!running) return;
    try { ws = new WebSocket('wss://fstream.binance.com/ws/btcusdt@bookTicker'); } catch { return setTimeout(open, 3000); }
    ws.onmessage = (e) => {
      try {
        const m = JSON.parse(e.data);
        if (m.e === 'bookTicker') emit('binance', (Number(m.b) + Number(m.a)) / 2);
      } catch { /* malformed frame */ }
    };
    ws.onclose = () => { if (running) setTimeout(open, 2000); };
    ws.onerror = () => {};
  };
  open();
})();

// --- Katana Perps: index only over REST ---
poll('katana', 300, async () => {
  const d = await (await fetch('https://api-perps.katana.network/v1/markets', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const m = (Array.isArray(d) ? d : d.markets || []).find((x) => (x.market || x.symbol) === 'BTC-USD');
  if (m) emit('katana-index', num(m.indexPrice));
});

// --- Arcus: oracle, mark and last trade in one call ---
poll('arcus', 300, async () => {
  const d = await (await fetch('https://api.arcus.xyz/v1/markets', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const m = (d.markets || []).find((x) => x.marketDisplayName === 'BTC-USD');
  if (!m) return;
  emit('arcus-oracle', num(m.oraclePrice));
  emit('arcus-mark', num(m.markPrice));
  emit('arcus-last', num(m.lastTradePrice));
});

// --- Ondo Perps: whatever BTC market they carry ---
poll('ondo', 400, async () => {
  const d = await (await fetch('https://api.ondoperps.xyz/v1/markets', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const perps = d?.result?.perps;
  const list = perps?.tradingPairs || perps?.markets || (Array.isArray(perps) ? perps : []);
  const m = list.find((x) => /BTC/i.test(x.market || x.symbol || ''));
  if (!m) return;
  for (const [k, v] of Object.entries(m)) {
    if (/^(index|oracle|mark|last)/i.test(k) && num(v)) emit(`ondo-${k}`, num(v));
  }
});

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, RUN_MS);
