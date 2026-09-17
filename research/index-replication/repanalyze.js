// How far ahead of each DEX's published index is our live replication?
//
// Same level test as research/lead-lag: for each index print a venue publishes,
// find which past value of OUR index best matches it. A venue that trails us by
// L has its best fit at +L. Includes the same guards — a self-control that must
// read 0, and a +90s placebo that must find nothing.
//
// Also reports ACCURACY, which matters as much as the lead here: being early is
// worthless if the number is wrong. `fit` is the median absolute difference
// between their print and our index at the best lag.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const rows = fs.readFileSync(process.argv[2] || `${S}/rep2.jsonl`, 'utf8').split('\n')
  .filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) (feeds[r.f] ||= []).push({ t: r.l, m: r.m });
for (const k of Object.keys(feeds)) feeds[k].sort((a, b) => a.t - b.t);

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

function stepper(f, shift = 0) {
  const T = Float64Array.from(f.map((r) => r.t + shift));
  const M = Float64Array.from(f.map((r) => r.m));
  return (t) => {
    if (t < T[0] || t > T[T.length - 1]) return NaN;
    let lo = 0, hi = T.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (T[mid] <= t) lo = mid; else hi = mid - 1; }
    return M[lo];
  };
}

const REF = 'creode-index';
const ref = feeds[REF];
if (!ref) { console.error('no creode-index'); process.exit(1); }
const refAt = stepper(ref);
const span = [ref[0].t + 30000, ref[ref.length - 1].t - 30000];

const LAGS = []; for (let l = -2000; l <= 9000; l += 50) LAGS.push(l);

function test(series, at) {
  const ev = [];
  for (const e of series) {
    if (e.t < span[0] || e.t > span[1]) continue;
    const a = at(e.t - 2000), b = at(e.t + 2000);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    ev.push({ ...e, move: Math.abs(b - a) });
  }
  if (ev.length < 25) return null;
  const cut = median(ev.map((e) => e.move));
  const act = ev.filter((e) => e.move >= cut && e.move > 0);
  if (act.length < 20) return null;
  let best = null; const errs = [];
  for (const lag of LAGS) {
    const d = [];
    for (const e of act) { const r = at(e.t - lag); if (Number.isFinite(r)) d.push(e.m - r); }
    if (d.length < 20) continue;
    const bas = median(d);
    const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
    errs.push(err);
    if (!best || err < best.err) best = { lag, err, basis: bas };
  }
  if (!best) return null;
  const med = median(errs);
  return { ...best, n: act.length, depth: (med - best.err) / med };
}

console.log(`\n${'='.repeat(86)}`);
console.log(`Creode's replicated index vs each DEX's own published index — BTC`);
console.log(`window ${((span[1] - span[0]) / 60000).toFixed(1)} min   our index updated ${ref.length} times`);
console.log('='.repeat(86));
console.log('\nvenue                prints  their_gap   THEY LAG US BY   fit($)   basis($)  well');

const out = [];
for (const name of Object.keys(feeds).sort()) {
  if (name.startsWith('spot-')) continue;
  const f = feeds[name];
  if (f.length < 25) { console.log(`${name.padEnd(20)} ${String(f.length).padStart(6)}   (too few prints)`); continue; }
  const gaps = []; for (let i = 1; i < f.length; i++) gaps.push(f[i].t - f[i - 1].t);
  const r = test(f, refAt);
  if (!r) { console.log(`${name.padEnd(20)} ${String(f.length).padStart(6)}   (not identified)`); continue; }
  console.log(`${name.padEnd(20)} ${String(f.length).padStart(6)} ${String(Math.round(median(gaps))).padStart(9)}ms ` +
    `${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(14)}   ${r.err.toFixed(2).padStart(6)}  ${r.basis.toFixed(2).padStart(8)}  ${(r.depth * 100).toFixed(0).padStart(3)}%`);
  out.push({ name, ...r, gap: median(gaps), prints: f.length });
}

console.log('\n--- guards ---');
const selfR = test(ref.filter((_, i) => i % 2 === 0), refAt);
console.log(`self-control (our own index against itself)   ${selfR ? (selfR.lag >= 0 ? '+' : '') + selfR.lag + 'ms  well ' + (selfR.depth * 100).toFixed(0) + '%' : 'n/a'}`);
const plAt = stepper(ref, -90000);
for (const o of out.slice(0, 4)) {
  const p = test(feeds[o.name], plAt);
  console.log(`placebo ${o.name.padEnd(18)} real ${((o.lag >= 0 ? '+' : '') + o.lag).padStart(6)}ms well ${(o.depth * 100).toFixed(0).padStart(3)}%   placebo ${p ? ((p.lag >= 0 ? '+' : '') + p.lag).padStart(6) + 'ms well ' + (p.depth * 100).toFixed(0) + '%' : 'n/a'}`);
}

// --- does the market price follow the oracle? ---
console.log('\n--- does the market follow the index? (Hyperliquid) ---');
const bk = feeds['hl-book'], or = feeds['hl-oracle'], mk = feeds['hl-mark'];
if (bk && or && bk.length > 50) {
  const oAt = stepper(or);
  const bas = [];
  for (const e of bk) { const o = oAt(e.t); if (Number.isFinite(o)) bas.push(e.m - o); }
  bas.sort((a, b) => a - b);
  const q = (f) => bas[Math.floor(bas.length * f)];
  console.log(`  book mid minus oracle over ${bas.length} book updates:`);
  console.log(`    median $${q(0.5).toFixed(2)}   p5 $${q(0.05).toFixed(2)}   p95 $${q(0.95).toFixed(2)}   max |dev| $${Math.max(Math.abs(bas[0]), Math.abs(bas[bas.length - 1])).toFixed(2)}`);
  const px = median(bk.map((e) => e.m));
  console.log(`    as a fraction of price: median ${(1e4 * q(0.5) / px).toFixed(1)}bp, p95 ${(1e4 * q(0.95) / px).toFixed(1)}bp`);
  const flips = bas.filter((x) => x > 0).length;
  console.log(`    book above oracle ${(100 * flips / bas.length).toFixed(0)}% of the time — a basis that changes sign is one the book is pulled across, not a drift`);
}
if (mk && or) {
  const oAt = stepper(or);
  const d = [];
  for (const e of mk) { const o = oAt(e.t); if (Number.isFinite(o)) d.push(Math.abs(e.m - o)); }
  console.log(`  mark minus oracle: median $${median(d).toFixed(2)} over ${d.length} mark updates`);
}
