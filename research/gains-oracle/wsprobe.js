// Which exchange books can be streamed from here, and in which quote currency.
// The wider this set, the more of Gains' input set can be tested.
const WebSocket = require('ws');
const got = {};
const mark = (k, p) => { if (Number.isFinite(p) && p > 0) got[k] = p; };

function go(name, url, sub, handle) {
  let ws;
  try { ws = new WebSocket(url); } catch (e) { console.log(name, 'CTOR', e.message.slice(0, 50)); return; }
  ws.on('open', () => { if (sub) try { ws.send(typeof sub === 'string' ? sub : JSON.stringify(sub)); } catch {} });
  ws.on('message', (d) => { try { handle(JSON.parse(d.toString('utf8'))); } catch {} });
  ws.on('error', (e) => { got[name] = got[name] ?? ('ERR ' + e.message.slice(0, 40)); });
}

const mid = (b, a) => (Number(b) + Number(a)) / 2;

go('binance-usdt', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', null, (m) => mark('binance-usdt', mid(m.b, m.a)));
go('bybit-usdt', 'wss://stream.bybit.com/v5/public/spot', { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] },
  (m) => { if (m.data?.b?.[0]) mark('bybit-usdt', mid(m.data.b[0][0], m.data.a[0][0])); });
go('coinbase', 'wss://ws-feed.exchange.coinbase.com',
  { type: 'subscribe', product_ids: ['BTC-USD', 'BTC-USDT', 'USDT-USD'], channels: ['ticker'] },
  (m) => { if (m.type === 'ticker') mark('cb-' + m.product_id, mid(m.best_bid, m.best_ask)); });
go('kraken', 'wss://ws.kraken.com/v2',
  { method: 'subscribe', params: { channel: 'ticker', symbol: ['BTC/USD', 'BTC/USDT', 'USDT/USD'] } },
  (m) => { if (m.channel === 'ticker') for (const d of m.data || []) mark('kr-' + d.symbol, mid(d.bid, d.ask)); });
go('okx', 'wss://ws.okx.com:8443/ws/v5/public',
  { op: 'subscribe', args: [{ channel: 'tickers', instId: 'BTC-USDT' }, { channel: 'tickers', instId: 'BTC-USDC' }] },
  (m) => { if (m.arg?.channel === 'tickers' && m.data?.[0]) mark('okx-' + m.arg.instId, mid(m.data[0].bidPx, m.data[0].askPx)); });
go('bitstamp', 'wss://ws.bitstamp.net',
  { event: 'bts:subscribe', data: { channel: 'order_book_btcusd' } },
  (m) => { if (m.data?.bids?.[0]) mark('bitstamp-usd', mid(m.data.bids[0][0], m.data.asks[0][0])); });
go('bitfinex', 'wss://api-pub.bitfinex.com/ws/2', { event: 'subscribe', channel: 'ticker', symbol: 'tBTCUSD' },
  (m) => { if (Array.isArray(m) && Array.isArray(m[1]) && m[1].length >= 10) mark('bitfinex-usd', mid(m[1][0], m[1][2])); });
go('gemini', 'wss://api.gemini.com/v1/marketdata/BTCUSD?top_of_book=true&bids=true&offers=true', null,
  (m) => {
    for (const e of m.events || []) {
      if (e.type === 'change' && e.side === 'bid') gemBid = Number(e.price);
      if (e.type === 'change' && e.side === 'ask') gemAsk = Number(e.price);
    }
    if (gemBid && gemAsk) mark('gemini-usd', (gemBid + gemAsk) / 2);
  });
let gemBid = 0, gemAsk = 0;
go('htx', 'wss://api.huobi.pro/ws', { sub: 'market.btcusdt.bbo', id: '1' }, (m) => {
  if (m.tick?.bid) mark('htx-usdt', mid(m.tick.bid, m.tick.ask));
});
go('kucoin', 'wss://ws-api-spot.kucoin.com/', null, () => {});   // needs a token handshake; expected to fail
go('gate', 'wss://api.gateio.ws/ws/v4/',
  { time: Math.floor(Date.now() / 1000), channel: 'spot.book_ticker', event: 'subscribe', payload: ['BTC_USDT'] },
  (m) => { if (m.result?.b) mark('gate-usdt', mid(m.result.b, m.result.a)); });
go('mexc', 'wss://wbs-api.mexc.com/ws',
  { method: 'SUBSCRIPTION', params: ['spot@public.bookTicker.batch.v3.api.pb@BTCUSDT'] }, () => {});
go('bitget', 'wss://ws.bitget.com/v2/ws/public',
  { op: 'subscribe', args: [{ instType: 'SPOT', channel: 'ticker', instId: 'BTCUSDT' }] },
  (m) => { if (m.data?.[0]?.bidPr) mark('bitget-usdt', mid(m.data[0].bidPr, m.data[0].askPr)); });
go('crypto.com', 'wss://stream.crypto.com/exchange/v1/market',
  { id: 1, method: 'subscribe', params: { channels: ['ticker.BTC_USD'] } },
  (m) => { if (m.result?.data?.[0]?.b) mark('cdc-usd', mid(m.result.data[0].b, m.result.data[0].k)); });

setTimeout(() => {
  const ok = Object.entries(got).filter(([, v]) => typeof v === 'number');
  const bad = Object.entries(got).filter(([, v]) => typeof v !== 'number');
  console.log('--- STREAMING (' + ok.length + ') ---');
  ok.sort().forEach(([k, v]) => console.log('  ' + k.padEnd(18), v));
  console.log('--- FAILED ---');
  bad.forEach(([k, v]) => console.log('  ' + k.padEnd(18), v));
  process.exit(0);
}, 18000);
