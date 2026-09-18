// Where does your stop get hunted?
//
// A stop loss and a liquidation do not fire against the market. They fire
// against whatever price the VENUE uses to decide, and on several venues that
// price is a laggy oracle. When the oracle lags, it keeps printing an old level
// after the market has moved — so it can reach your stop at a moment the real
// market never did. That is a phantom stop-out: you are closed at a loss on a
// wick that did not exist anywhere you could have traded.
//
// The trader-outcomes study makes this worth measuring: on Gains, the bottom
// group of traders ended 13.0% of trades in liquidation and 22.2% on a stop,
// against 0.2% and 1.0% for the top group. Mechanical exits, not bad calls,
// are what separated them.
//
// This captures each venue's TRIGGER price — the one its own docs say governs
// stops, margin and liquidation — against a reference built from the deepest
// books, so the deviation can be measured rather than assumed.
const fs = require('fs');
const S = __dirname;
const out = fs.createWriteStream(`${S}/stops.jsonl`, { flags: 'w' });
const last = {}; const counts = {};
let running = true;

const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};

function sock(name, url, sub, handle, opts) {
  let attempt = 0;
  const open = () => {
    if (!running) return;
    let ws;
    try { ws = new WebSocket(url, opts); } catch { return; }
    ws.onopen = () => { if (sub) try { ws.send(JSON.stringify(sub)); } catch {} };
    ws.onmessage = (e) => { attempt = 0; try { handle(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { if (running) setTimeout(open, Math.min(20000, 1000 * 2 ** Math.min(attempt++, 4))); };
    ws.onerror = () => { counts[name + '!err'] = (counts[name + '!err'] || 0) + 1; };
  };
  open();
}
async function poll(name, ms, fn) {
  while (running) {
    const t0 = Date.now();
    try { await fn(); } catch { counts[name + '!err'] = (counts[name + '!err'] || 0) + 1; }
    await new Promise((r) => setTimeout(r, Math.max(0, ms - (Date.now() - t0))));
  }
}
const mid = (b, a) => (Number(b) + Number(a)) / 2;
const UA = { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, cache: 'no-store' };

// ===== the reference: what the market actually did =======================
sock('binperp', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', null, (m) => {
  if (m.e === 'bookTicker') emit('ref-binance-perp', mid(m.b, m.a));
});
sock('binspot', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null, (m) => {
  if (m.b && m.a) emit('ref-binance-spot', mid(m.b, m.a));
});
sock('bybit', 'wss://stream.bybit.com/v5/public/spot', { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] }, (m) => {
  if (m.data?.b?.[0]) emit('ref-bybit', mid(m.data.b[0][0], m.data.a[0][0]));
});

// ===== venue trigger prices ==============================================

// Hyperliquid: liquidations run off the MARK price; the oracle feeds it.
sock('hl', 'wss://api.hyperliquid.xyz/ws', { method: 'subscribe', subscription: { type: 'activeAssetCtx', coin: 'BTC' } }, (m) => {
  const c = m?.data?.ctx; if (!c) return;
  if (c.oraclePx) emit('hyperliquid-oracle', Number(c.oraclePx));
  if (c.markPx) emit('hyperliquid-mark', Number(c.markPx));
});

// Gains: their docs say index price is used for LIQUIDATIONS and mark for
// TP/SL. The documented v4 endpoint that would separate them serves the v3
// format in practice, so only the single published series is available here.
sock('gains', 'wss://backend-pricing.eu.gains.trade/v3', null, (o) => {
  if (!Array.isArray(o) || o.length < 2) return;
  for (let i = 0; i + 1 < o.length; i += 2) if (o[i] === 0) emit('gains', o[i + 1]);
}, { origin: 'https://gains.trade' });

// Avantis / Veranta: Pyth Lazer relayed through their own host.
(async () => {
  while (running) {
    try {
      const res = await fetch('https://feed-v3.avantisfi.com/v1/stream?price_feed_ids=1', { headers: { Accept: 'text/event-stream' } });
      const rd = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
      while (running) {
        const { done, value } = await rd.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const blk = buf.slice(0, i); buf = buf.slice(i + 2);
          const ln = blk.split('\n').find((l) => l.startsWith('data:')); if (!ln) continue;
          const d = JSON.parse(ln.slice(5).trim());
          for (const f of d.priceFeeds || []) {
            if (f.priceFeedId !== 1) continue;
            emit('avantis', Number(f.price) * Math.pow(10, f.exponent));
          }
        }
      }
    } catch {}
    if (running) await new Promise((r) => setTimeout(r, 1500));
  }
})();

// GMX v2: keepers execute AND liquidate against the signed feed.
poll('gmx', 300, async () => {
  const d = await (await fetch('https://arbitrum-api.gmxinfra.io/signed_prices/latest', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const b = (d.signedPrices || []).find((x) => x.tokenSymbol === 'BTC');
  if (!b?.minPriceFull) return;
  emit('gmx-signed', (Number(b.minPriceFull) / 1e22 + Number(b.maxPriceFull) / 1e22) / 2);
});

// Ostium: the oracle IS the fill price, so it is also the trigger price.
poll('ostium', 400, async () => {
  const a = await (await fetch('https://metadata-backend.ostium.io/PricePublish/latest-prices', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const f = a.find((x) => x.from === 'BTC' && x.to === 'USD');
  if (f) emit('ostium', Number(f.mid));
});

// Katana: index price, measured at +5000 to +6100ms in research/new-venue-screen.
poll('katana', 500, async () => {
  const a = await (await fetch('https://api-perps.katana.network/v1/markets', { ...UA, signal: AbortSignal.timeout(6000) })).json();
  const arr = Array.isArray(a) ? a : (a.data || a.markets || []);
  const m = arr.find((x) => x.market === 'BTC-USD');
  if (m?.indexPrice) emit('katana-index', Number(m.indexPrice));
});

// Hotstuff: their oracle governs margin and liquidation; the book does not lag
// but the oracle does, by ~4.9s.
poll('hotstuff', 500, async () => {
  const r = await fetch('https://api.hotstuff.trade/info', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'ticker', params: { symbol: 'BTC-PERP' } }),
    signal: AbortSignal.timeout(6000),
  });
  const a = await r.json();
  const d = Array.isArray(a) ? a[0] : a;
  if (d?.index_price) emit('hotstuff-oracle', Number(d.index_price));
  if (d?.mid_price) emit('hotstuff-mid', Number(d.mid_price));
});

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 1500000));
