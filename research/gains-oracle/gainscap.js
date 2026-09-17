// Gains / gTrade price feed vs the CEX tape.
//
// The feed was unreachable earlier because the host in the docs
// (backend-pricing.gains.trade) does not exist. The real one is compiled into
// the trading page bundle:
//
//   let l = "wss://", d = "https://"
//   U = H(j("backend-pricing.eu.gains.trade"), d)          -> https
//   V = q(j("backend-pricing.eu.gains.trade"), l) + "/v3"  -> wss://.../v3
//
// Wire format: a flat array [pairIndex, price, pairIndex, price, ...], plus a
// one-element array [serverMs] once a second. Pair indices come from
// trading-variables: 0 = BTC/USD, 1 = ETH/USD.
//
// The heartbeat is the useful part: it gives a continuous read of the Gains
// server clock against ours, so the arrival-time bias is measured rather than
// assumed. Earlier in this project arrival-time analysis was thrown out because
// our own jitter (47-455ms) was larger than the effects; here the heartbeat
// delta holds inside a couple of ms, so it can be checked instead of trusted.
const fs = require('fs');
const WebSocket = require('ws');
const S = __dirname;
const out = fs.createWriteStream(`${S}/gains.jsonl`, { flags: 'w' });
const last = {}; const counts = {};
let running = true;

const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};

function sock(name, url, onmsg, sub, opts) {
  let ws;
  const open = () => {
    if (!running) return;
    try { ws = new WebSocket(url, opts || {}); } catch { return setTimeout(open, 3000); }
    ws.on('open', () => { if (sub) try { ws.send(JSON.stringify(sub)); } catch {} });
    ws.on('message', (d) => { try { onmsg(d.toString('utf8')); } catch {} });
    ws.on('close', () => { if (running) setTimeout(open, 2000); });
    ws.on('error', (e) => { counts[name + '!err'] = (counts[name + '!err'] || 0) + 1; });
  };
  open();
}

// --- Gains ---------------------------------------------------------------
sock('gains', 'wss://backend-pricing.eu.gains.trade/v3', (s) => {
  const a = JSON.parse(s);
  if (!Array.isArray(a)) return;
  if (a.length === 1) { // heartbeat: server clock
    out.write(JSON.stringify({ f: 'gains-hb', l: Date.now(), m: 1, srv: a[0] }) + '\n');
    return;
  }
  for (let i = 0; i < a.length; i += 2) {
    if (a[i] === 0) emit('gains-btc', a[i + 1]);
    else if (a[i] === 1) emit('gains-eth', a[i + 1]);
  }
}, null, { origin: 'https://gains.trade' });

// --- reference tape ------------------------------------------------------
sock('binperp', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', (s) => {
  const m = JSON.parse(s);
  if (m.e === 'bookTicker') emit('binance-perp', (Number(m.b) + Number(m.a)) / 2, { E: m.E });
});
sock('binperpE', 'wss://fstream.binance.com/ws/ethusdt@bookTicker', (s) => {
  const m = JSON.parse(s);
  if (m.e === 'bookTicker') emit('binance-perp-eth', (Number(m.b) + Number(m.a)) / 2);
});
// stream.binance.com answers 451 from this region; the Vision mirror is the
// same book and is not geo-blocked.
sock('binspot', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', (s) => {
  const m = JSON.parse(s);
  if (m.b && m.a) emit('binance-spot', (Number(m.b) + Number(m.a)) / 2);
});
sock('bybit', 'wss://stream.bybit.com/v5/public/spot', (s) => {
  const m = JSON.parse(s);
  if (m.topic === 'orderbook.1.BTCUSDT' && m.data) {
    const b = m.data.b?.[0]?.[0], a = m.data.a?.[0]?.[0];
    if (b && a) emit('bybit-spot', (Number(b) + Number(a)) / 2);
  }
}, { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] });
// USDT/USD comes in on the same two sockets as the USD books. The first run
// omitted it and built the composite as a median over a MIXTURE of USDT-quoted
// and USD-quoted books; the two clusters sit ~$70 apart on BTC, so the median
// flipped between them and the composite read $3.19 fit against $1.89 for a
// single book. That is not a small modelling choice, it is the whole recipe.
sock('coinbase', 'wss://ws-feed.exchange.coinbase.com', (s) => {
  const m = JSON.parse(s);
  if (m.type !== 'ticker' || !m.best_bid || !m.best_ask) return;
  const p = (Number(m.best_bid) + Number(m.best_ask)) / 2;
  if (m.product_id === 'BTC-USD') emit('coinbase-spot', p);
  else if (m.product_id === 'USDT-USD') emit('usdtusd', p);
}, { type: 'subscribe', product_ids: ['BTC-USD', 'USDT-USD'], channels: ['ticker'] });
sock('kraken', 'wss://ws.kraken.com/v2', (s) => {
  const m = JSON.parse(s);
  if (m.channel !== 'ticker' || !m.data) return;
  for (const d of m.data) {
    if (!d.bid || !d.ask) continue;
    const p = (Number(d.bid) + Number(d.ask)) / 2;
    if (d.symbol === 'BTC/USD') emit('kraken-spot', p);
    else if (d.symbol === 'USDT/USD') emit('usdtusd-kraken', p);
  }
}, { method: 'subscribe', params: { channel: 'ticker', symbol: ['BTC/USD', 'USDT/USD'] } });
sock('okx', 'wss://ws.okx.com:8443/ws/v5/public', (s) => {
  const m = JSON.parse(s);
  if (m.arg?.channel === 'tickers' && m.data?.[0]) {
    const d = m.data[0];
    if (d.bidPx && d.askPx) emit('okx-spot', (Number(d.bidPx) + Number(d.askPx)) / 2);
  }
}, { op: 'subscribe', args: [{ channel: 'tickers', instId: 'BTC-USDT' }] });

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 720000));
