// Does Katana's 6.1s index lag sit anywhere a taker could reach?
// Capture index, book mid, mark and top-of-book depth together against Binance.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const out = fs.createWriteStream(`${S}/kat.jsonl`, { flags: 'w' });
const last = {}; let running = true;
const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};
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
(async () => {
  while (running) {
    const t0 = Date.now();
    try {
      const d = await (await fetch('https://api-perps.katana.network/v1/orderbook?market=BTC-USD',
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, signal: AbortSignal.timeout(6000) })).json();
      const b = d.bids?.[0], a = d.asks?.[0];
      if (b && a) {
        const bid = Number(b[0]), ask = Number(a[0]);
        emit('kat-book', (bid + ask) / 2, { bidUsd: bid * Number(b[1]), askUsd: ask * Number(a[1]), spread: ask - bid });
      }
      if (d.markPrice) emit('kat-mark', Number(d.markPrice));
      if (d.indexPrice) emit('kat-index', Number(d.indexPrice));
    } catch {}
    await new Promise((r) => setTimeout(r, Math.max(0, 300 - (Date.now() - t0))));
  }
})();
setTimeout(() => { running = false; out.end(() => process.exit(0)); }, Number(process.env.RUN_MS || 420000));
