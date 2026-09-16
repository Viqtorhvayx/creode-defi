// Replicate Hyperliquid's BTC oracle from its own declared inputs, and measure
// how far ahead of their published number we are.
//
// Their spec (hyperliquid docs, hypercore/oracle): validators publish, every 3
// seconds, the weighted median of spot mid prices from
//     Binance 3, OKX 2, Bybit 2, Kraken 1, KuCoin 1, Gate 1, MEXC 1
// (Hyperliquid's own spot is excluded for assets whose liquidity is primarily
// external, which includes BTC). The clearinghouse then takes a stake-weighted
// median across validators.
//
// So the number is a deterministic function of public CEX spot prices, refreshed
// on a 3-second drumbeat. We read the same inputs continuously and apply the
// same formula, which should put us ahead by roughly half their publish interval
// plus whatever their validator round adds.
//
// This is a different claim from the earlier study in research/lead-lag, and it
// is worth being precise about the difference: we are NOT claiming to be ahead
// of Binance. We are claiming to be ahead of a SLOW FUNCTION OF Binance. The
// first is impossible; the second is arithmetic.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RUN_MS = Number(process.env.RUN_MS || 12 * 60 * 1000);
const out = fs.createWriteStream(`${S}/rep2.jsonl`, { flags: 'w' });
let running = true;

const W = { binance: 3, okx: 2, bybit: 2, kraken: 1, kucoin: 1, gate: 1, mexc: 1 };
const spot = {};           // src -> { mid, t }
const counts = {};
const lastOut = {};

function emit(f, m, extra) {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (lastOut[f] === m) return;
  lastOut[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
}

function weightedMedian() {
  const now = Date.now();
  const rows = [];
  for (const [src, w] of Object.entries(W)) {
    const s = spot[src];
    if (!s || now - s.t > 10000) continue;      // same 10s staleness rule most venues use
    rows.push({ p: s.mid, w });
  }
  if (rows.length < 4) return null;             // not enough inputs to be meaningful
  rows.sort((a, b) => a.p - b.p);
  const total = rows.reduce((s, r) => s + r.w, 0);
  let acc = 0;
  for (const r of rows) { acc += r.w; if (acc >= total / 2) return { px: r.p, n: rows.length }; }
  return { px: rows[rows.length - 1].p, n: rows.length };
}

let lastPub = 0;
function recompute() {
  const wm = weightedMedian();
  if (!wm) return;
  // Emit at most every 20ms; the inputs are far faster than anything downstream needs.
  const now = Date.now();
  if (now - lastPub < 20) return;
  lastPub = now;
  emit('creode-index', wm.px, { n: wm.n });
}

function setSpot(src, mid) {
  if (!Number.isFinite(mid) || mid <= 0) return;
  spot[src] = { mid, t: Date.now() };
  emit(`spot-${src}`, mid);
  recompute();
}

function connect(name, url, sub, onMsg) {
  let ws;
  const open = () => {
    if (!running) return;
    try { ws = new WebSocket(url); } catch { return setTimeout(open, 3000); }
    ws.onopen = () => { if (sub) { try { ws.send(JSON.stringify(typeof sub === 'function' ? sub() : sub)); } catch {} } };
    ws.onmessage = (e) => { try { onMsg(JSON.parse(typeof e.data === 'string' ? e.data : e.data.toString())); } catch {} };
    ws.onerror = () => {};
    ws.onclose = () => { if (running) setTimeout(open, 2000); };
  };
  open();
}

// ---------- spot inputs: push where possible ----------
connect('binance', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null,
  (m) => { if (m.b && m.a) setSpot('binance', (+m.b + +m.a) / 2); });
connect('bybit', 'wss://stream.bybit.com/v5/public/spot', { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] },
  (m) => { const d = m?.data; if (d?.b?.[0] && d?.a?.[0]) setSpot('bybit', (+d.b[0][0] + +d.a[0][0]) / 2); });
connect('gate', 'wss://api.gateio.ws/ws/v4/',
  () => ({ time: Math.floor(Date.now() / 1000), channel: 'spot.book_ticker', event: 'subscribe', payload: ['BTC_USDT'] }),
  (m) => { const r = m?.result; if (m.event === 'update' && r?.b && r?.a) setSpot('gate', (+r.b + +r.a) / 2); });

// ---------- spot inputs: polled (their WS is unreachable from here) ----------
async function poll(src, url, pick, ms = 200) {
  while (running) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
      const v = pick(await r.json());
      if (v) setSpot(src, v);
    } catch {}
    await new Promise((r) => setTimeout(r, Math.max(0, ms - (Date.now() - t0))));
  }
}
poll('okx', 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT',
  (d) => { const x = d?.data?.[0]; return x ? (+x.bidPx + +x.askPx) / 2 : null; });
poll('kucoin', 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT',
  (d) => { const x = d?.data; return x ? (+x.bestBid + +x.bestAsk) / 2 : null; });
poll('mexc', 'https://api.mexc.com/api/v3/ticker/bookTicker?symbol=BTCUSDT',
  (d) => (d?.bidPrice ? (+d.bidPrice + +d.askPrice) / 2 : null));
poll('kraken', 'https://api.kraken.com/0/public/Ticker?pair=XBTUSDT',
  (d) => { const x = d?.result?.XBTUSDT; return x ? (+x.b[0] + +x.a[0]) / 2 : null; }, 300);

// ---------- the DEX indices we are racing ----------
connect('hl', 'wss://api.hyperliquid.xyz/ws', { method: 'subscribe', subscription: { type: 'activeAssetCtx', coin: 'BTC' } },
  (m) => { const c = m?.data?.ctx; if (c?.oraclePx) { emit('hl-oracle', +c.oraclePx); emit('hl-mark', +c.markPx); } });
// HL's order book, to check the claim that the market price follows the oracle
connect('hl-book', 'wss://api.hyperliquid.xyz/ws', { method: 'subscribe', subscription: { type: 'bbo', coin: 'BTC' } },
  (m) => { if (m.channel === 'bbo') { const [b, a] = m.data.bbo; if (b && a) emit('hl-book', (+b.px + +a.px) / 2); } });
connect('backpack-ws', 'wss://ws.backpack.exchange', { method: 'SUBSCRIBE', params: ['markPrice.BTC_USDC_PERP'], id: 1 },
  (m) => { const d = m?.data; if (d?.i) emit('backpack-index', +d.i); });
connect('hotstuff', 'wss://api.hotstuff.trade/ws/',
  { jsonrpc: '2.0', id: 1, method: 'subscribe', params: { channel: 'ticker', symbol: 'BTC-PERP' } },
  (m) => { const d = m?.params?.data; if (d?.index_price) emit('hotstuff-index', +d.index_price); });
connect('dydx', 'wss://indexer.dydx.trade/v4/ws', { type: 'subscribe', channel: 'v4_markets' },
  (m) => { const o = m?.contents?.oraclePrices?.['BTC-USD'] ?? m?.contents?.markets?.['BTC-USD'];
    if (o?.oraclePrice) emit('dydx-oracle', +o.oraclePrice); });

const DEXPOLL = [
  ['orderly-index', 'https://api.orderly.org/v1/public/futures/PERP_BTC_USDC', (d) => +d?.data?.index_price],
  ['aster-index',   'https://fapi.asterdex.com/fapi/v1/premiumIndex?symbol=BTCUSDT', (d) => +d?.indexPrice],
  ['apex-index',    'https://omni.apex.exchange/api/v3/ticker?symbol=BTCUSDT', (d) => +d?.data?.[0]?.indexPrice],
  ['extended-index','https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD', (d) => +d?.data?.[0]?.marketStats?.indexPrice],
  ['aevo-index',    'https://api.aevo.xyz/markets?asset=BTC&instrument_type=PERPETUAL', (d) => +d?.[0]?.index_price],
  ['hibachi-spot',  'https://data-api.hibachi.xyz/market/data/prices?symbol=BTC/USDT-P', (d) => +d?.spotPrice],
  ['lighter-index', 'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails',
    (d) => { const b = d?.order_book_details?.find((x) => x.symbol === 'BTC'); return b ? +b.index_price : null; }],
];
for (const [name, url, pick] of DEXPOLL) {
  (async () => {
    while (running) {
      const t0 = Date.now();
      try { const v = pick(await (await fetch(url, { signal: AbortSignal.timeout(5000) })).json()); if (v) emit(name, v); } catch {}
      await new Promise((r) => setTimeout(r, Math.max(0, 250 - (Date.now() - t0))));
    }
  })();
}

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, RUN_MS);
