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
//
// RUNNING THIS FOR A RESULT RATHER THAN A ZERO. The first 23-minute run landed
// on a dead tape — BTC's largest move inside Katana's whole 5.5s lag window was
// 6.21bp — so every phantom-stop figure came back 0.00% and none of them meant
// anything. The mechanism needs the market to move. So this version:
//
//   - APPENDS, so a container restart costs the process and not the data
//   - runs for hours rather than minutes, because volatility has to be waited
//     for and cannot be summoned
//   - watches the reference itself and prints a line to stdout whenever BTC
//     actually moves, so the wait can be monitored instead of polled, and so
//     the analysis can be pointed at the windows that carry information
const fs = require('fs');
const S = __dirname;
const out = fs.createWriteStream(`${S}/stops.jsonl`, { flags: process.env.APPEND === '0' ? 'w' : 'a' });
const last = {}; const counts = {};
let running = true;

// --- volatility watch ----------------------------------------------------
// A rolling window of the reference, used only to decide when something is
// happening. THRESH_BP is the move over WINDOW_MS that counts as an event; the
// default of 15bp over 10s is well above the 6.21bp ceiling of the dead-tape
// run, so it fires on genuine movement rather than on noise.
const WINDOW_MS = Number(process.env.WINDOW_MS || 10000);
const THRESH_BP = Number(process.env.THRESH_BP || 15);
const refBuf = [];
let inEvent = false, eventPeak = 0, eventStart = 0, events = 0;
const stamp = () => new Date().toISOString().slice(11, 19);

function watch(px) {
  const now = Date.now();
  refBuf.push({ t: now, m: px });
  while (refBuf.length && now - refBuf[0].t > WINDOW_MS) refBuf.shift();
  if (refBuf.length < 5) return;
  let lo = Infinity, hi = -Infinity;
  for (const r of refBuf) { if (r.m < lo) lo = r.m; if (r.m > hi) hi = r.m; }
  const bp = 1e4 * (hi - lo) / lo;
  if (!inEvent && bp >= THRESH_BP) {
    inEvent = true; eventPeak = bp; eventStart = now; events++;
    console.log(`${stamp()} VOLATILITY ${bp.toFixed(1)}bp over ${(WINDOW_MS / 1000).toFixed(0)}s  BTC ${px.toFixed(0)}`);
  } else if (inEvent) {
    if (bp > eventPeak) eventPeak = bp;
    if (bp < THRESH_BP / 2) {
      inEvent = false;
      console.log(`${stamp()} settled — peak ${eventPeak.toFixed(1)}bp, lasted ${((now - eventStart) / 1000).toFixed(0)}s (event ${events})`);
    }
  }
}

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
    try { ws = new WebSocket(url); } catch { return; }
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
  if (m.e !== 'bookTicker') return;
  const p = mid(m.b, m.a);
  emit('ref-binance-perp', p);
  watch(p);
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

// Default six hours. Volatility cannot be summoned, only waited for, and a
// 25-minute window is what produced the uninformative zeros the first time.
const RUN_MS = Number(process.env.RUN_MS || 6 * 3600 * 1000);
console.log(`${stamp()} capturing for ${(RUN_MS / 3600000).toFixed(1)}h — flagging any move of ${THRESH_BP}bp inside ${(WINDOW_MS / 1000).toFixed(0)}s`);
setInterval(() => {
  if (running) console.log(`${stamp()} alive — ${events} volatility events so far, ${(counts['ref-binance-perp'] || 0)} reference ticks`);
}, 1800000).unref?.();
setTimeout(() => {
  running = false;
  console.log(`${stamp()} [done] ${events} volatility events`);
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, RUN_MS);
