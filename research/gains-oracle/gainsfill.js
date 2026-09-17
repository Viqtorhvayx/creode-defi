// Is the price Gains SHOWS the price Gains FILLS at?
//
// This is the GMX trap asked of Gains. GMX publishes a display feed and a
// separate signed feed that keepers execute against; measuring the display feed
// and calling it the fill price would have been a false finding. Gains submits
// market orders with NO price attached — the order is priced later, by its
// oracle, at whatever that oracle says then. So the displayed price and the
// filled price are two different observations and the gap between them is the
// thing that decides whether any lead is reachable.
//
// Method: record every pair the pricing websocket publishes, then pull Gains'
// own settled trades and, for each fill, ask which past value of the feed for
// that pair equals the price the trade actually got.
const fs = require('fs');
const WebSocket = require('ws');
const S = __dirname;
const out = fs.createWriteStream(`${S}/gainsall.jsonl`, { flags: 'w' });
const last = new Map();
let n = 0, running = true;

function open() {
  if (!running) return;
  const ws = new WebSocket('wss://backend-pricing.eu.gains.trade/v3', { origin: 'https://gains.trade' });
  ws.on('message', (d) => {
    let a; try { a = JSON.parse(d.toString('utf8')); } catch { return; }
    if (!Array.isArray(a) || a.length < 2) return;
    const t = Date.now();
    for (let i = 0; i < a.length; i += 2) {
      const p = a[i], v = a[i + 1];
      if (!Number.isFinite(v) || v <= 0) continue;
      if (last.get(p) === v) continue;
      last.set(p, v);
      n++;
      out.write(`${p},${t},${v}\n`);
    }
  });
  ws.on('close', () => { if (running) setTimeout(open, 2000); });
  ws.on('error', () => {});
}
open();

setTimeout(() => {
  running = false;
  console.error(`[done] ${n} price changes across ${last.size} pairs`);
  out.end(() => process.exit(0));
}, Number(process.env.RUN_MS || 1500000));
