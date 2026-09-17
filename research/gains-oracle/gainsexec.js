// Does Gains FILL at the price it SHOWS?
//
// Exact-match test. If the pricing websocket is the same oracle that settles
// trades, then the price printed on a settled trade must appear verbatim
// somewhere in the feed history for that pair, and the gap between when we saw
// it and when the trade settled is the execution delay.
//
// If no settled price ever appears in the feed, the display feed is not the
// execution feed — which is exactly the trap GMX set, and it would mean any
// lead measured against the display feed is not reachable.
//
// Run gainsfill.js first; this reads the capture it leaves behind and fetches
// the pair map and the settled trades itself.
const fs = require('fs');
const S = __dirname;

const get = async (url, file) => {
  if (fs.existsSync(`${S}/${file}`)) return JSON.parse(fs.readFileSync(`${S}/${file}`, 'utf8'));
  const d = await (await fetch(url)).json();
  fs.writeFileSync(`${S}/${file}`, JSON.stringify(d));
  return d;
};

main();
async function main() {

const tv = await get('https://backend-arbitrum.gains.trade/trading-variables', 'gains_tv.json');
const pairName = tv.pairs.map((p) => `${p.from}/${p.to}`);

// feed: pairIndex -> [{t, m}]
const feed = new Map();
for (const line of fs.readFileSync(`${S}/gainsall.jsonl`, 'utf8').split('\n')) {
  if (!line) continue;
  const c = line.split(',');
  const p = Number(c[0]), t = Number(c[1]), m = Number(c[2]);
  if (!Number.isFinite(p) || !Number.isFinite(t) || !Number.isFinite(m)) continue;
  if (!feed.has(p)) feed.set(p, []);
  feed.get(p).push({ t, m });
}
const T0 = Math.min(...[...feed.values()].map((a) => a[0].t));
const T1 = Math.max(...[...feed.values()].map((a) => a[a.length - 1].t));
console.log(`feed: ${feed.size} pairs, ${[...feed.values()].reduce((s, a) => s + a.length, 0)} changes, ` +
  `window ${new Date(T0).toISOString()} .. ${new Date(T1).toISOString()} (${((T1 - T0) / 60000).toFixed(1)} min)`);

// Settled trades. The /api routes live on backend-global and need an explicit
// chainId; Arbitrum and Base carry most of the flow, and pooling them is what
// gets the fill count into three figures for a 25-minute window.
const rd = (x) => (Array.isArray(x) ? x : []);
const fills = [
  ...rd(await get('https://backend-global.gains.trade/api/trading-history/24h?chainId=42161', 'th_arb.json')),
  ...rd(await get('https://backend-global.gains.trade/api/trading-history/24h?chainId=8453', 'th_base.json')),
];
const idxOf = new Map(); pairName.forEach((n, i) => { if (!idxOf.has(n)) idxOf.set(n, i); });

// A settled trade lands in a block; `date` is that block's timestamp, at 1s
// resolution. Only trades whose block falls inside the capture window can be
// matched, with a margin for the resolution.
const inWin = fills.filter((f) => {
  const t = Date.parse(f.date);
  return t >= T0 + 2000 && t <= T1 - 1000 && idxOf.has(f.pair) && feed.has(idxOf.get(f.pair));
});
console.log(`fills in window: ${inWin.length} of ${fills.length} pulled`);

let exact = 0, near = 0, miss = 0;
const lags = [], rel = [];
for (const f of inWin) {
  const p = idxOf.get(f.pair);
  const hist = feed.get(p);
  const px = Number(f.marketPrice ?? f.price);
  if (!Number.isFinite(px) || px <= 0) continue;
  const bt = Date.parse(f.date);
  // exact, or within half a tick of float noise
  let bestExact = null, bestNear = null;
  for (const h of hist) {
    if (h.t > bt + 1500) break;
    const d = Math.abs(h.m - px) / px;
    if (d < 1e-9) { if (!bestExact || h.t > bestExact.t) bestExact = h; }
    if (d < 5e-6 && (!bestNear || d < bestNear.d)) bestNear = { ...h, d };
  }
  if (bestExact) { exact++; lags.push(bt - bestExact.t); }
  else if (bestNear) { near++; rel.push(bestNear.d * 1e4); }
  else miss++;
}
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length * f)] : NaN);
console.log(`\nexact feed match: ${exact}   close but not exact: ${near}   no match: ${miss}`);
if (lags.length) {
  console.log(`\nblock timestamp − time we saw that exact price (ms):`);
  console.log(`  p10 ${q(lags, 0.1)}   median ${q(lags, 0.5)}   p90 ${q(lags, 0.9)}   n=${lags.length}`);
  console.log(`  (1s resolution on the block timestamp, so read this as seconds, not ms)`);
}
if (rel.length) console.log(`near misses, distance in bp: median ${q(rel, 0.5).toFixed(2)}  p90 ${q(rel, 0.9).toFixed(2)}`);

// --- how stale is the EXECUTION price? ------------------------------------
// Almost no fill carries a value that appears verbatim in the display feed, so
// the two are separately computed numbers off the same oracle rather than the
// same number. The question that decides everything is therefore not "is it the
// same feed" but "which past value of the display feed does the executed price
// look like" — the same level test used everywhere else in this project, pooled
// across every pair so 100-odd fills carry it instead of the 3 BTC fills an
// hour that one market would give.
//
// Scored in basis points, not dollars: XAU at $4,300 and PEPE at $0.000007
// cannot be averaged in dollars. Block timestamps land on whole seconds, so the
// resolution here is about a second — enough to tell 0s from 3s, not enough to
// tell 200ms from 400ms.
{
  const rows = [];
  for (const f of inWin) {
    const p = idxOf.get(f.pair);
    const hist = feed.get(p);
    const px = Number(f.marketPrice ?? f.price);
    if (!Number.isFinite(px) || px <= 0 || !hist || hist.length < 20) continue;
    rows.push({ bt: Date.parse(f.date), px, hist });
  }
  const at = (hist, t) => {
    if (t < hist[0].t || t > hist[hist.length - 1].t) return NaN;
    let lo = 0, hi = hist.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (hist[m].t <= t) lo = m; else hi = m - 1; }
    return hist[lo].m;
  };
  let best = null; const curve = [];
  for (let lag = -2000; lag <= 12000; lag += 250) {
    const d = [];
    for (const r of rows) {
      const v = at(r.hist, r.bt - lag);
      if (Number.isFinite(v) && v > 0) d.push(Math.abs(r.px - v) / v * 1e4);
    }
    if (d.length < 30) continue;
    const err = q(d, 0.5);
    curve.push([lag, err, d.length]);
    if (!best || err < best.err) best = { lag, err, n: d.length };
  }
  console.log(`\n--- which past display-feed value does the EXECUTED price look like? ---`);
  if (best) {
    const errs = curve.map((c) => c[1]);
    const depth = (q(errs, 0.5) - best.err) / q(errs, 0.5);
    console.log(`  best fit at lag ${best.lag >= 0 ? '+' : ''}${best.lag}ms   median |error| ${best.err.toFixed(3)}bp   n=${best.n}   well ${(depth * 100).toFixed(0)}%`);
    console.log('  curve (lag, median |error| bp):');
    for (const [l, e, n] of curve) {
      if (l % 1000) continue;
      console.log(`    ${String(l).padStart(6)}ms  ${e.toFixed(3)}bp  n=${n}`);
    }
  } else {
    console.log('  not identified');
  }
}

} // main
