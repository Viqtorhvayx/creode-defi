// Katana market-making: measure the thing that decides it.
//
// Gross spread capture is easy and already known. What kills a market maker is
// ADVERSE SELECTION: you get filled precisely when the price is about to move
// against you. A maker who sells at the ask and watches the market run up has
// bought the spread and sold the future.
//
// Measurement: every trade Katana prints carries `makerSide`. If makerSide is
// "sell", a taker lifted the maker's ask — the maker is now short. Track where
// the mid goes over the next few seconds. Adverse selection is the average move
// against the maker, and it comes straight off the spread.
//
// Also records the live spread and top-of-book size per market, so revenue can
// be estimated against the venue's real flow rather than assumed.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RUN_MS = Number(process.env.RUN_MS || 13 * 60 * 1000);
const MARKETS = ['ZEC-USD', 'ETH-USD', 'BTC-USD', 'HYPE-USD', 'SOL-USD', 'XRP-USD'];
const out = fs.createWriteStream(`${S}/katmm.jsonl`, { flags: 'w' });
const UA = { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } };
let running = true;
const seen = {};      // market -> Set of fillId, so trades are counted once

async function pollBook(mkt) {
  while (running) {
    const t0 = Date.now();
    try {
      const d = await (await fetch(`https://api-perps.katana.network/v1/orderbook?market=${mkt}`,
        { ...UA, signal: AbortSignal.timeout(6000) })).json();
      const b = d.bids?.[0], a = d.asks?.[0];
      if (b && a) {
        const bid = Number(b[0]), ask = Number(a[0]);
        out.write(JSON.stringify({ k: 'book', m: mkt, t: Date.now(), bid, ask,
          bidSz: Number(b[1]) * bid, askSz: Number(a[1]) * ask,
          bidN: b[2] ?? null, askN: a[2] ?? null,
          mark: Number(d.markPrice) || null, index: Number(d.indexPrice) || null }) + '\n');
      }
    } catch { /* venue hiccup */ }
    await new Promise((r) => setTimeout(r, Math.max(0, 400 - (Date.now() - t0))));
  }
}

async function pollTrades(mkt) {
  seen[mkt] = new Set();
  let first = true;
  while (running) {
    const t0 = Date.now();
    try {
      const d = await (await fetch(`https://api-perps.katana.network/v1/trades?market=${mkt}`,
        { ...UA, signal: AbortSignal.timeout(6000) })).json();
      for (const f of (Array.isArray(d) ? d : [])) {
        if (seen[mkt].has(f.fillId)) continue;
        seen[mkt].add(f.fillId);
        // The first response is a 50-trade backfill from before the book
        // series starts, so those fills can never be scored. Record them as
        // seen and skip, otherwise they inflate the fill count and score n/a.
        if (first) continue;
        out.write(JSON.stringify({ k: 'fill', m: mkt, t: Number(f.time), seenAt: Date.now(),
          price: Number(f.price), qty: Number(f.quantity), usd: Number(f.quoteQuantity),
          makerSide: f.makerSide }) + '\n');
      }
      // cap memory on a long run
      first = false;
      if (seen[mkt].size > 5000) seen[mkt] = new Set([...seen[mkt]].slice(-2000));
    } catch { /* venue hiccup */ }
    await new Promise((r) => setTimeout(r, Math.max(0, 1000 - (Date.now() - t0))));
  }
}

for (const m of MARKETS) { pollBook(m); pollTrades(m); }

setTimeout(() => {
  running = false;
  const n = Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.size]));
  console.error('[done] fills seen: ' + JSON.stringify(n));
  out.end(() => process.exit(0));
}, RUN_MS);
