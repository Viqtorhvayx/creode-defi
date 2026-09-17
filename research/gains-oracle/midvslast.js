// Do Gains' nodes read book MIDS or LAST TRADE prices?
//
// It matters for everything else. If they poll a /ticker endpoint they get a
// last-trade price, and a mid will never land on their number no matter how
// right the membership is — the residual would be half a spread, not rounding.
//
// Test: stream both for the same venues, and ask which family the Gains print
// sits nearer to. Scored at a spread of lags so a timing difference cannot be
// mistaken for a price-type difference.
const WebSocket = require('ws');
const H = { mid: {}, last: {} };   // venue -> [{t, p}]
const push = (kind, v, p) => {
  if (!Number.isFinite(p) || p <= 0) return;
  const a = (H[kind][v] ||= []);
  if (a.length && a[a.length - 1].p === p) return;
  a.push({ t: Date.now(), p });
};
const G = [];
let running = true;

function sock(url, sub, handle) {
  let ws;
  try { ws = new WebSocket(url, { origin: 'https://gains.trade' }); } catch { return; }
  ws.on('open', () => { if (sub) try { ws.send(JSON.stringify(sub)); } catch {} });
  ws.on('message', (d) => { try { handle(JSON.parse(d.toString('utf8'))); } catch {} });
  ws.on('error', () => {});
}
const mid = (b, a) => (Number(b) + Number(a)) / 2;

sock('wss://backend-pricing.eu.gains.trade/v3', null, (o) => {
  if (!Array.isArray(o) || o.length < 2) return;
  for (let i = 0; i + 1 < o.length; i += 2) if (o[i] === 0) G.push({ t: Date.now(), p: o[i + 1] });
});
// Coinbase ticker carries both the touch and the last trade in one message.
sock('wss://ws-feed.exchange.coinbase.com',
  { type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }, (m) => {
    if (m.type !== 'ticker') return;
    push('mid', 'coinbase', mid(m.best_bid, m.best_ask));
    push('last', 'coinbase', Number(m.price));
  });
sock('wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null, (m) => push('mid', 'binance', mid(m.b, m.a)));
sock('wss://data-stream.binance.vision/ws/btcusdt@trade', null, (m) => push('last', 'binance', Number(m.p)));
sock('wss://ws.kraken.com/v2', { method: 'subscribe', params: { channel: 'ticker', symbol: ['BTC/USD'] } },
  (m) => { if (m.channel === 'ticker') for (const d of m.data || []) { push('mid', 'kraken', mid(d.bid, d.ask)); push('last', 'kraken', Number(d.last)); } });
sock('wss://ws.bitstamp.net', { event: 'bts:subscribe', data: { channel: 'order_book_btcusd' } },
  (m) => { if (m.data?.bids?.[0]) push('mid', 'bitstamp', mid(m.data.bids[0][0], m.data.asks[0][0])); });
sock('wss://ws.bitstamp.net', { event: 'bts:subscribe', data: { channel: 'live_trades_btcusd' } },
  (m) => { if (m.data?.price) push('last', 'bitstamp', Number(m.data.price)); });

const at = (a, t) => {
  if (!a || !a.length || t < a[0].t) return NaN;
  let lo = 0, hi = a.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m].t <= t) lo = m; else hi = m - 1; }
  return a[lo].p;
};
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length * f)] : NaN);

setTimeout(() => {
  running = false;
  const ev = G.slice(30, -5);
  console.log(`Gains prints scored: ${ev.length}`);
  console.log('\nDistance from each Gains print to the NEAREST venue, in bp:');
  console.log('lag      mid-family                last-trade family');
  for (const lag of [0, 150, 300, 450, 600]) {
    const out = {};
    for (const kind of ['mid', 'last']) {
      const d = [];
      for (const e of ev) {
        let best = Infinity;
        for (const v of Object.keys(H[kind])) {
          const p = at(H[kind][v], e.t - lag);
          if (Number.isFinite(p)) best = Math.min(best, Math.abs(e.p - p));
        }
        if (Number.isFinite(best)) d.push(1e4 * best / e.p);
      }
      out[kind] = d;
    }
    console.log(`${String(lag).padStart(4)}ms   p10 ${q(out.mid, 0.1).toFixed(3)} med ${q(out.mid, 0.5).toFixed(3)}` +
      `     p10 ${q(out.last, 0.1).toFixed(3)} med ${q(out.last, 0.5).toFixed(3)}`);
  }
  console.log('\nseries sizes:', Object.entries(H.mid).map(([k, v]) => `mid-${k}:${v.length}`).join(' '),
    Object.entries(H.last).map(([k, v]) => `last-${k}:${v.length}`).join(' '));
  process.exit(0);
}, Number(process.env.RUN_MS || 240000));
