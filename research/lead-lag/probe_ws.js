// WebSocket reachability probe. REST is geo-blocked for Binance futures and
// Bybit from this host; their WS edges may not be. Push feeds also remove the
// polling-interval jitter that contaminated the earlier measurements.
const CASES = [
  ['binance-spot-ws', 'wss://stream.binance.com:9443/ws/btcusdt@bookTicker', null],
  ['binance-perp-ws', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', null],
  ['bybit-ws',        'wss://stream.bybit.com/v5/public/linear',
    { op: 'subscribe', args: ['orderbook.1.BTCUSDT'] }],
  ['okx-ws',          'wss://ws.okx.com:8443/ws/v5/public',
    { op: 'subscribe', args: [{ channel: 'bbo-tbt', instId: 'BTC-USDT-SWAP' }] }],
  ['hyperliquid-ws',  'wss://api.hyperliquid.xyz/ws',
    { method: 'subscribe', subscription: { type: 'bbo', coin: 'BTC' } }],
  ['aster-ws',        'wss://fstream.asterdex.com/ws/btcusdt@bookTicker', null],
  ['backpack-ws',     'wss://ws.backpack.exchange',
    { method: 'SUBSCRIBE', params: ['bookTicker.BTC_USDC_PERP'], id: 1 }],
  ['lighter-ws',      'wss://mainnet.zklighter.elliot.ai/stream',
    { type: 'subscribe', channel: 'order_book/1' }],
  ['paradex-ws',      'wss://ws.api.prod.paradex.trade/v1',
    { jsonrpc: '2.0', method: 'subscribe', params: { channel: 'bbo.BTC-USD-PERP' }, id: 1 }],
  ['dydx-ws',         'wss://indexer.dydx.trade/v4/ws',
    { type: 'subscribe', channel: 'v4_markets' }],
  ['bitget-ws',       'wss://ws.bitget.com/v2/ws/public',
    { op: 'subscribe', args: [{ instType: 'USDT-FUTURES', channel: 'books1', instId: 'BTCUSDT' }] }],
  ['gate-ws',         'wss://fx-ws.gateio.ws/v4/ws/usdt',
    { time: Math.floor(Date.now() / 1000), channel: 'futures.book_ticker', event: 'subscribe', payload: ['BTC_USDT'] }],
  ['kucoin-fut-ws',   null, null], // needs a token handshake; skip unless needed
  ['orderly-ws',      'wss://ws.orderly.org/ws/stream/0x6cf07c6b0c1e5d36a4b7c9c0a15a2e17a7b6be4e4bba0d7f7c8f5f5e4b7e7c0a',
    { id: '1', topic: 'PERP_BTC_USDC@bbo', event: 'subscribe' }],
  ['hotstuff-ws',     'wss://api.hotstuff.trade/ws/',
    { jsonrpc: '2.0', id: 1, method: 'subscribe', params: { channel: 'ticker', symbol: 'BTC-PERP' } }],
  ['hibachi-ws',      'wss://data-api.hibachi.xyz/ws/market',
    { method: 'subscribe', parameters: { subscriptions: [{ symbol: 'BTC/USDT-P', topic: 'mark_price' }] }, id: '1' }],
];

function test([name, url, sub]) {
  return new Promise((resolve) => {
    if (!url) return resolve({ name, note: 'skipped' });
    let msgs = 0; let first = null; let done = false;
    const t0 = Date.now();
    let ws;
    try { ws = new WebSocket(url); } catch (e) { return resolve({ name, err: String(e.message) }); }
    const finish = (r) => { if (done) return; done = true; try { ws.close(); } catch {} resolve(r); };
    ws.onopen = () => { if (sub) { try { ws.send(JSON.stringify(sub)); } catch {} } };
    ws.onmessage = (ev) => {
      msgs++;
      const s = typeof ev.data === 'string' ? ev.data : '[binary]';
      if (first === null) first = s.slice(0, 300);
      if (msgs >= 6) finish({ name, openMs: Date.now() - t0, msgs, first, last: s.slice(0, 300) });
    };
    ws.onerror = (e) => finish({ name, err: String(e.message || 'ws error').slice(0, 140) });
    setTimeout(() => finish({ name, openMs: Date.now() - t0, msgs, first, note: msgs ? 'slow' : 'no messages in 10s' }), 10000);
  });
}

(async () => {
  const out = await Promise.all(CASES.map(test));
  for (const r of out) {
    console.log(`${(r.msgs ? 'OK ' : '-- ')}${r.name.padEnd(17)} msgs=${String(r.msgs ?? 0).padStart(2)} ${r.err ? 'ERR ' + r.err : ''}${r.note ? '[' + r.note + '] ' : ''}`);
    if (r.first) console.log(`      first: ${r.first.replace(/\s+/g, ' ').slice(0, 230)}`);
    if (r.last) console.log(`      last : ${r.last.replace(/\s+/g, ' ').slice(0, 230)}`);
  }
  process.exit(0);
})();
