// GMX v2 publishes TWO price feeds and they are not the same thing:
//
//   /prices/tickers        the UI display feed. Polled, and on BTC its min/max
//                          band is collapsed to zero.
//   /signed_prices/latest  what keepers actually execute orders against.
//                          oracleType "realtimeFeed2", fetched over websocket
//                          (Chainlink Data Streams), and it carries a real
//                          min/max spread.
//
// Measuring the ticker and calling it the execution price would have been a
// false finding. This measures the signed feed, which is the one a fill is
// priced from.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const out = fs.createWriteStream(`${S}/gmxs.jsonl`, { flags: 'w' });
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
      const d = await (await fetch('https://arbitrum-api.gmxinfra.io/signed_prices/latest', { ...UA, signal: AbortSignal.timeout(6000) })).json();
      const b = (d.signedPrices || []).find((x) => x.tokenSymbol === 'BTC');
      if (b && b.minPriceFull && b.maxPriceFull) {
        const mn = Number(b.minPriceFull) / 1e22, mx = Number(b.maxPriceFull) / 1e22;
        emit('gmx-signed', (mn + mx) / 2, {
          spread: mx - mn,
          createdAt: Date.parse(b.createdAt),
          blockTs: Number(b.maxBlockTimestamp) * 1000,
          stale: b.stalenessSeconds ?? null,
        });
      }
    } catch {}
    await new Promise((r) => setTimeout(r, Math.max(0, 300 - (Date.now() - t0))));
  }
})();
setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 600000));
