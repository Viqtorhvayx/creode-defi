// Second, independent capture. Changes from run 1:
//   - Aster now logged off E (event time); its T is bucketed to 50-100ms and
//     backdates every print, which faked a lead in the first pass.
//   - Paradex timestamp no longer divided (it publishes ms, not µs).
//   - Adds Coinbase, Deribit, BitMEX and Kraken. Coinbase matters most: it is
//     where US flow lands, so if anything leads Binance on a US-driven move it
//     is the plausible candidate.
//   - Adds Binance spot AND perp trade streams. The spot bookTicker carries no
//     server timestamp; trades do, so spot-vs-perp can be compared on matched
//     clocks rather than on arrival times.
//   - Dedupes at write time. Run 1 wrote 318MB, ~95% of it repeated mids.
const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RUN_MS = Number(process.env.RUN_MS || 15 * 60 * 1000);
const OUT = process.env.OUT || `${SCRATCH}/ticks2.jsonl`;

const stream = fs.createWriteStream(OUT, { flags: 'w' });
const counts = {}; const lastMid = {};
let running = true;

function rec(feed, asset, tServer, bid, ask) {
  if (!running) return;
  const b = Number(bid), a = Number(ask);
  if (!Number.isFinite(b) || !Number.isFinite(a) || b <= 0 || a <= 0) return;
  emit(feed, asset, tServer, (b + a) / 2);
}
function emit(feed, asset, tServer, px) {
  if (!running) return;
  const p = Number(px);
  if (!Number.isFinite(p) || p <= 0) return;
  counts[feed] = (counts[feed] || 0) + 1;
  if (lastMid[feed] === p) return;                 // price unchanged, no information
  lastMid[feed] = p;
  stream.write(JSON.stringify({ f: feed, k: asset, l: Date.now(), s: tServer ?? null, m: p }) + '\n');
}

function connect(name, url, sub, onMsg) {
  let ws;
  const open = () => {
    if (!running) return;
    try { ws = new WebSocket(url); } catch { return setTimeout(open, 3000); }
    ws.onopen = () => { if (sub) { try { ws.send(JSON.stringify(typeof sub === 'function' ? sub() : sub)); } catch {} } };
    ws.onmessage = (ev) => { try { onMsg(JSON.parse(typeof ev.data === 'string' ? ev.data : ev.data.toString())); } catch {} };
    ws.onerror = () => {};
    ws.onclose = () => { if (running) setTimeout(open, 2000); };
  };
  open();
}

// ---- reference + control ----
connect('binance-perp', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', null,
  (m) => { if (m.e === 'bookTicker') rec('binance-perp', 'BTC', m.T, m.b, m.a); });
connect('binance-perp-ctl', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', null,
  (m) => { if (m.e === 'bookTicker') rec('binance-perp-ctl', 'BTC', m.T, m.b, m.a); });

// ---- trade streams: matched clocks for spot vs perp ----
connect('binance-perp-trade', 'wss://fstream.binance.com/ws/btcusdt@aggTrade', null,
  (m) => { if (m.e === 'aggTrade') emit('binance-perp-trade', 'BTC', m.T, m.p); });
connect('binance-spot-trade', 'wss://data-stream.binance.vision/ws/btcusdt@aggTrade', null,
  (m) => { if (m.e === 'aggTrade') emit('binance-spot-trade', 'BTC', m.T, m.p); });
connect('binance-spot', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null,
  (m) => { if (m.b && m.a) rec('binance-spot', 'BTC', null, m.b, m.a); });

// ---- CEX perps ----
connect('bybit', 'wss://stream.bybit.com/v5/public/linear', { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] },
  (m) => { const d = m?.data; if (d?.b?.[0] && d?.a?.[0]) rec('bybit', 'BTC', m.cts ?? m.ts, d.b[0][0], d.a[0][0]); });
connect('bitget', 'wss://ws.bitget.com/v2/ws/public',
  { op: 'subscribe', args: [{ instType: 'USDT-FUTURES', channel: 'books1', instId: 'BTCUSDT' }] },
  (m) => { const d = m?.data?.[0]; if (d?.bids?.[0] && d?.asks?.[0]) rec('bitget', 'BTC', Number(d.ts), d.bids[0][0], d.asks[0][0]); });
connect('gate', 'wss://fx-ws.gateio.ws/v4/ws/usdt',
  () => ({ time: Math.floor(Date.now() / 1000), channel: 'futures.book_ticker', event: 'subscribe', payload: ['BTC_USDT'] }),
  (m) => { const r = m?.result; if (m.event === 'update' && r?.b && r?.a) rec('gate', 'BTC', r.t, r.b, r.a); });
connect('deribit', 'wss://www.deribit.com/ws/api/v2',
  { jsonrpc: '2.0', id: 1, method: 'public/subscribe', params: { channels: ['quote.BTC-PERPETUAL'] } },
  (m) => { const d = m?.params?.data; if (d?.best_bid_price && d?.best_ask_price) rec('deribit', 'BTC', d.timestamp, d.best_bid_price, d.best_ask_price); });
connect('bitmex', 'wss://ws.bitmex.com/realtime?subscribe=quote:XBTUSD', null,
  (m) => { if (m.table === 'quote' && m.data) for (const d of m.data) if (d.bidPrice && d.askPrice) rec('bitmex', 'BTC', Date.parse(d.timestamp), d.bidPrice, d.askPrice); });
connect('kraken', 'wss://futures.kraken.com/ws/v1', { event: 'subscribe', feed: 'ticker', product_ids: ['PI_XBTUSD'] },
  (m) => { if (m.feed === 'ticker' && m.bid && m.ask) rec('kraken', 'BTC', m.time, m.bid, m.ask); });

// ---- US spot: the plausible leader on US-driven moves ----
connect('coinbase', 'wss://ws-feed.exchange.coinbase.com',
  { type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] },
  (m) => { if (m.type === 'ticker' && m.best_bid && m.best_ask) rec('coinbase', 'BTC', m.time ? Date.parse(m.time) : null, m.best_bid, m.best_ask); });

// ---- perp DEXes ----
connect('hyperliquid', 'wss://api.hyperliquid.xyz/ws', { method: 'subscribe', subscription: { type: 'bbo', coin: 'BTC' } },
  (m) => { if (m.channel === 'bbo') { const [bb, ab] = m.data.bbo; if (bb && ab) rec('hyperliquid', 'BTC', m.data.time, bb.px, ab.px); } });
connect('aster', 'wss://fstream.asterdex.com/ws/btcusdt@bookTicker', null,
  (m) => { if (m.e === 'bookTicker') rec('aster', 'BTC', m.E, m.b, m.a); });
connect('backpack', 'wss://ws.backpack.exchange', { method: 'SUBSCRIBE', params: ['bookTicker.BTC_USDC_PERP'], id: 1 },
  (m) => { const d = m?.data; if (d?.e === 'bookTicker') rec('backpack', 'BTC', Math.round(d.T / 1000), d.b, d.a); });
connect('paradex', 'wss://ws.api.prod.paradex.trade/v1',
  { jsonrpc: '2.0', method: 'subscribe', params: { channel: 'bbo.BTC-USD-PERP' }, id: 1 },
  (m) => { const d = m?.params?.data; if (d?.bid && d?.ask) rec('paradex', 'BTC', d.last_updated_at ?? null, d.bid, d.ask); });
connect('hotstuff', 'wss://api.hotstuff.trade/ws/',
  { jsonrpc: '2.0', id: 1, method: 'subscribe', params: { channel: 'ticker', symbol: 'BTC-PERP' } },
  (m) => { const d = m?.params?.data; if (!d) return;
    rec('hotstuff', 'BTC', d.last_updated ?? null, d.best_bid_price, d.best_ask_price);
    emit('hotstuff-oracle', 'BTC', d.last_updated ?? null, d.index_price); });

// ---- HYPE: does the home venue lead its own token? ----
connect('hl-hype', 'wss://api.hyperliquid.xyz/ws', { method: 'subscribe', subscription: { type: 'bbo', coin: 'HYPE' } },
  (m) => { if (m.channel === 'bbo') { const [bb, ab] = m.data.bbo; if (bb && ab) rec('hl-hype', 'HYPE', m.data.time, bb.px, ab.px); } });
connect('binance-hype', 'wss://fstream.binance.com/ws/hypeusdt@bookTicker', null,
  (m) => { if (m.e === 'bookTicker') rec('binance-hype', 'HYPE', m.T, m.b, m.a); });
connect('bybit-hype', 'wss://stream.bybit.com/v5/public/linear', { op: 'subscribe', args: ['orderbook.1.HYPEUSDT'] },
  (m) => { const d = m?.data; if (d?.b?.[0] && d?.a?.[0]) rec('bybit-hype', 'HYPE', m.cts ?? m.ts, d.b[0][0], d.a[0][0]); });
connect('gate-hype', 'wss://fx-ws.gateio.ws/v4/ws/usdt',
  () => ({ time: Math.floor(Date.now() / 1000), channel: 'futures.book_ticker', event: 'subscribe', payload: ['HYPE_USDT'] }),
  (m) => { const r = m?.result; if (m.event === 'update' && r?.b && r?.a) rec('gate-hype', 'HYPE', r.t, r.b, r.a); });

async function pollOkx() {
  while (running) {
    const t0 = Date.now();
    try {
      const r = await fetch('https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP', { signal: AbortSignal.timeout(4000) });
      const d = (await r.json())?.data?.[0];
      if (d) rec('okx', 'BTC', Number(d.ts), d.bidPx, d.askPx);
    } catch {}
    await new Promise((r) => setTimeout(r, Math.max(0, 200 - (Date.now() - t0))));
  }
}
pollOkx();

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  stream.end(() => process.exit(0));
}, RUN_MS);
