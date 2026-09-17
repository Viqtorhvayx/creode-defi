// Recovering Gains' input set: which exchanges, and in what combination.
//
// Gains does not publish its exchange list or its weights. Their docs say only
// that a custom Chainlink DON takes "the median price of an asset from up to 7
// data sources" and that the aggregator takes a median again across node
// answers. So the set has to be recovered from the prints themselves.
//
// Two things make that tractable:
//
//  1. A median over an odd number of members IS one of the member values. A
//     median of medians still equals one of the node answers, and each node
//     answer equals one of its own inputs. So whatever Gains publishes should
//     equal SOME exchange's price at SOME instant — and if it never equals any
//     book we can read, the set contains books we cannot.
//
//  2. Every candidate subset can simply be tried. Fourteen streams is 16k
//     subsets, which is nothing, and the one whose median best reproduces
//     their prints is the evidence.
//
// A note on the endpoint, because the docs are wrong twice. They describe a v4
// format at /v4 carrying mark and index separately with a server timestamp per
// batch ({m, i, t}), and they describe the stream as updating every 25ms.
// Neither is what the wire serves: /v4 returns the same flat v3 array as /v3
// and the root path, and the observed cadence is two batches a second. Checked
// on all three paths. So this captures the flat array, and for BTC it does not
// matter anyway — the same docs say mark and index are identical for Core
// pairs, which BTC is.
const fs = require('fs');
const WebSocket = require('ws');
const S = __dirname;
const out = fs.createWriteStream(`${S}/set.jsonl`, { flags: 'w' });
const last = {}; const counts = {};
let running = true;

const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};

function sock(name, url, sub, handle) {
  let attempt = 0;
  const open = () => {
    if (!running) return;
    let ws;
    try { ws = new WebSocket(url, { origin: 'https://gains.trade' }); } catch { return; }
    ws.on('open', () => { if (sub) try { ws.send(typeof sub === 'string' ? sub : JSON.stringify(sub)); } catch {} });
    ws.on('message', (d) => { attempt = 0; try { handle(JSON.parse(d.toString('utf8'))); } catch {} });
    ws.on('close', () => { if (running) setTimeout(open, Math.min(20000, 1000 * 2 ** Math.min(attempt++, 4))); });
    ws.on('error', () => { counts[name + '!err'] = (counts[name + '!err'] || 0) + 1; });
  };
  open();
}

const mid = (b, a) => (Number(b) + Number(a)) / 2;

// --- Gains v4: mark, index, and their own clock per batch ----------------
sock('gains', 'wss://backend-pricing.eu.gains.trade/v3', null, (o) => {
  if (!Array.isArray(o)) return;
  if (o.length === 1) {                               // the once-a-second ping
    out.write(JSON.stringify({ f: 'gains-hb', l: Date.now(), m: 1, srv: o[0] }) + '\n');
    return;
  }
  for (let i = 0; i + 1 < o.length; i += 2) {
    if (o[i] === 0) emit('gains', o[i + 1]);
    else if (o[i] === 1) emit('gains-eth', o[i + 1]);
  }
});

// --- USD-quoted books ----------------------------------------------------
sock('coinbase', 'wss://ws-feed.exchange.coinbase.com',
  { type: 'subscribe', product_ids: ['BTC-USD', 'BTC-USDT', 'USDT-USD'], channels: ['ticker'] },
  (m) => {
    if (m.type !== 'ticker') return;
    const p = mid(m.best_bid, m.best_ask);
    if (m.product_id === 'BTC-USD') emit('coinbase', p);
    else if (m.product_id === 'BTC-USDT') emit('coinbase-t', p);
    else if (m.product_id === 'USDT-USD') emit('usdtusd', p);
  });
sock('kraken', 'wss://ws.kraken.com/v2',
  { method: 'subscribe', params: { channel: 'ticker', symbol: ['BTC/USD', 'BTC/USDT', 'USDT/USD'] } },
  (m) => {
    if (m.channel !== 'ticker') return;
    for (const d of m.data || []) {
      const p = mid(d.bid, d.ask);
      if (d.symbol === 'BTC/USD') emit('kraken', p);
      else if (d.symbol === 'BTC/USDT') emit('kraken-t', p);
      else if (d.symbol === 'USDT/USD') emit('usdtusd-kr', p);
    }
  });
sock('bitstamp', 'wss://ws.bitstamp.net', { event: 'bts:subscribe', data: { channel: 'order_book_btcusd' } },
  (m) => { if (m.data?.bids?.[0]) emit('bitstamp', mid(m.data.bids[0][0], m.data.asks[0][0])); });
sock('bitfinex', 'wss://api-pub.bitfinex.com/ws/2', { event: 'subscribe', channel: 'ticker', symbol: 'tBTCUSD' },
  (m) => { if (Array.isArray(m) && Array.isArray(m[1]) && m[1].length >= 10) emit('bitfinex', mid(m[1][0], m[1][2])); });
let gb = 0, ga = 0;
sock('gemini', 'wss://api.gemini.com/v1/marketdata/BTCUSD?top_of_book=true&bids=true&offers=true', null, (m) => {
  for (const e of m.events || []) {
    if (e.type === 'change' && e.side === 'bid') gb = Number(e.price);
    if (e.type === 'change' && e.side === 'ask') ga = Number(e.price);
  }
  if (gb && ga) emit('gemini', (gb + ga) / 2);
});
sock('cryptocom', 'wss://stream.crypto.com/exchange/v1/market',
  { id: 1, method: 'subscribe', params: { channels: ['ticker.BTC_USD'] } },
  (m) => { if (m.result?.data?.[0]?.b) emit('cryptocom', mid(m.result.data[0].b, m.result.data[0].k)); });

// --- USDT-quoted books ---------------------------------------------------
sock('binance', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null,
  (m) => emit('binance-t', mid(m.b, m.a)));
sock('bybit', 'wss://stream.bybit.com/v5/public/spot', { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] },
  (m) => { if (m.data?.b?.[0]) emit('bybit-t', mid(m.data.b[0][0], m.data.a[0][0])); });
sock('bitget', 'wss://ws.bitget.com/v2/ws/public',
  { op: 'subscribe', args: [{ instType: 'SPOT', channel: 'ticker', instId: 'BTCUSDT' }] },
  (m) => { if (m.data?.[0]?.bidPr) emit('bitget-t', mid(m.data[0].bidPr, m.data[0].askPr)); });
sock('gate', 'wss://api.gateio.ws/ws/v4/',
  { time: Math.floor(Date.now() / 1000), channel: 'spot.book_ticker', event: 'subscribe', payload: ['BTC_USDT'] },
  (m) => { if (m.result?.b) emit('gate-t', mid(m.result.b, m.result.a)); });

// Binance perp, as the reference clock only — it is not a candidate input.
sock('binperp', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', null,
  (m) => { if (m.e === 'bookTicker') emit('binance-perp', mid(m.b, m.a), { E: m.E }); });

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 1200000));
