// Avantis (now trading as Veranta) vs the CEX tape.
//
// Their documented endpoints all 404'd when this class was first screened, so
// the lag went unmeasured. The feed is compiled into the trading bundle:
//
//   y  = "https://feed-v3.avantisfi.com"
//   o6 = y
//   new EventSource(`${o6}/v1/stream?price_feed_ids=...`)   // event: price_update
//
// It is Pyth Lazer relayed through their own host — feed id 1 is BTC/USD, 2 is
// ETH/USD, prices scaled 1e-8. Each message carries `timestampUs` and a
// `feedUpdateTimestamp`, both in microseconds, so their own clock is on the
// wire and the timing does not have to be inferred from arrival.
//
// This is a peer-to-pool venue: the oracle IS the fill price. That is the only
// class where a lag would be reachable at all, which is the whole reason for
// measuring it.
const fs = require('fs');
const S = __dirname;
const out = fs.createWriteStream(`${S}/av.jsonl`, { flags: 'w' });
const last = {}; const counts = {};
let running = true;

const emit = (f, m, extra) => {
  if (!running || !Number.isFinite(m) || m <= 0) return;
  counts[f] = (counts[f] || 0) + 1;
  if (last[f] === m && !extra) return;
  last[f] = m;
  out.write(JSON.stringify({ f, l: Date.now(), m, ...extra }) + '\n');
};

// --- Avantis / Pyth Lazer over SSE ---------------------------------------
async function lazer() {
  while (running) {
    try {
      const res = await fetch('https://feed-v3.avantisfi.com/v1/stream?price_feed_ids=1&price_feed_ids=2', {
        headers: { Accept: 'text/event-stream' },
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      while (running) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          const line = block.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          let d; try { d = JSON.parse(line.slice(5).trim()); } catch { continue; }
          const at = Date.now();
          const srvMs = Number(d.timestampUs) / 1000;
          for (const f of d.priceFeeds || []) {
            const px = Number(f.price) * Math.pow(10, f.exponent);
            const bid = Number(f.bestBidPrice) * Math.pow(10, f.exponent);
            const ask = Number(f.bestAskPrice) * Math.pow(10, f.exponent);
            const tag = f.priceFeedId === 1 ? 'avantis' : f.priceFeedId === 2 ? 'avantis-eth' : null;
            if (!tag) continue;
            emit(tag, px, { srv: srvMs, fu: Number(f.feedUpdateTimestamp) / 1000, spread: ask - bid, pub: f.publisherCount, at });
          }
        }
      }
    } catch { /* reconnect below */ }
    if (running) await new Promise((r) => setTimeout(r, 1500));
  }
}
lazer();

// --- reference tape ------------------------------------------------------
function sock(name, url, handle) {
  let attempt = 0;
  const open = () => {
    if (!running) return;
    let ws;
    try { ws = new WebSocket(url); } catch { return; }
    ws.onmessage = (e) => { attempt = 0; try { handle(JSON.parse(e.data)); } catch {} };
    ws.onclose = () => { if (running) setTimeout(open, Math.min(15000, 1000 * 2 ** Math.min(attempt++, 4))); };
    ws.onerror = () => { counts[name + '!err'] = (counts[name + '!err'] || 0) + 1; };
  };
  open();
}
sock('binperp', 'wss://fstream.binance.com/ws/btcusdt@bookTicker', (m) => {
  if (m.e === 'bookTicker') emit('binance-perp', (Number(m.b) + Number(m.a)) / 2, { E: m.E });
});
sock('binspot', 'wss://data-stream.binance.vision/ws/btcusdt@bookTicker', (m) => {
  if (m.b && m.a) emit('binance-spot', (Number(m.b) + Number(m.a)) / 2);
});
sock('coinbase', 'wss://ws-feed.exchange.coinbase.com', (m) => {
  if (m.type === 'ticker' && m.product_id === 'BTC-USD') emit('coinbase', (Number(m.best_bid) + Number(m.best_ask)) / 2);
});
// Coinbase needs a subscribe frame; the helper above has no onopen hook, so it
// is sent here on the first tick of a dedicated socket instead.
(function cb() {
  const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
  ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', product_ids: ['BTC-USD'], channels: ['ticker'] }));
  ws.onmessage = (e) => {
    try {
      const m = JSON.parse(e.data);
      if (m.type === 'ticker' && m.best_bid) emit('coinbase', (Number(m.best_bid) + Number(m.best_ask)) / 2);
    } catch {}
  };
  ws.onclose = () => { if (running) setTimeout(cb, 3000); };
  ws.onerror = () => {};
})();

setTimeout(() => {
  running = false;
  console.error('[done] ' + Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' '));
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 720000));
