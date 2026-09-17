// Which exchanges are in Gains' oracle, and how are they combined?
//
// Three independent questions, three tests:
//
//   A. MEMBERSHIP BY EXHAUSTION. A median over an odd set equals one of its
//      members. Try every subset of the books we can read, take the median in
//      USD, and level-test it against Gains' print. The subset with the lowest
//      fit error is the evidence. If the best subset still fits badly, the set
//      contains books we cannot read, and the residual says how much.
//
//   B. IS IT EVEN A MEDIAN? A median lands ON a member value; a mean generally
//      does not. So ask, for each Gains print, how far the NEAREST single book
//      sits. If Gains is a median over books we can read, that distance should
//      collapse to the rounding precision. If it sits well above, either the
//      aggregation is not a plain median or members are missing.
//
//   C. WHO HOLDS THE MEDIAN? For each print, tally which book is nearest.
//      Books in the set should take turns holding the median; books outside it
//      should be nearest only by coincidence.
//
// Everything is evaluated at each candidate's own best lag, so a book that is
// merely slow is not mistaken for a book that is absent.
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/set.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) {
  if (r.f === 'gains-hb') continue;
  const a = (feeds[r.f] ||= []);
  if (a.length && a[a.length - 1].m === r.m) continue;
  a.push({ t: r.l, m: r.m });
}
for (const k of Object.keys(feeds)) feeds[k].sort((a, b) => a.t - b.t);

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
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

// USD-quoted books need no conversion; USDT-quoted ones are multiplied by the
// live rate. Gains quotes USD and the two clusters sit ~$70 apart on BTC, so
// mixing them without converting is the one mistake that ruins everything.
const USD = ['coinbase', 'kraken', 'bitstamp', 'bitfinex', 'gemini', 'cryptocom'];
const USDT = ['binance-t', 'bybit-t', 'bitget-t', 'gate-t', 'kraken-t', 'coinbase-t'];
const rateFeed = feeds['usdtusd']?.length > 20 ? feeds['usdtusd'] : feeds['usdtusd-kr'];
const rateAt = stepper(rateFeed);

const books = [];
for (const k of [...USD, ...USDT]) {
  const f = feeds[k];
  if (!f || f.length < 60) { console.log(`(dropped ${k}: ${f ? f.length : 0} changes, too thin to carry a median)`); continue; }
  const raw = stepper(f);
  const at = USD.includes(k) ? raw : (t) => { const p = raw(t), r = rateAt(t); return Number.isFinite(p) && Number.isFinite(r) ? p * r : NaN; };
  books.push({ k, at, n: f.length });
}

const G = feeds['gains'];
const ref = feeds['binance-perp'];
const span = [Math.max(G[0].t, ref[0].t) + 60000, Math.min(G[G.length - 1].t, ref[ref.length - 1].t) - 30000];
const ev = G.filter((e) => e.t >= span[0] && e.t <= span[1]);
const refAt = stepper(ref);

// Activity filter: a flat tape carries no timing information.
const moves = ev.map((e) => { const a = refAt(e.t - 2000), b = refAt(e.t + 2000); return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(b - a) : 0; });
const cut = median(moves.filter((m) => m > 0));
const act = ev.filter((_, i) => moves[i] >= cut && moves[i] > 0);

const LAGS = []; for (let l = -1500; l <= 2500; l += 50) LAGS.push(l);
/** Best-fitting lag for a candidate series, and the error there. */
function fit(at, events) {
  let best = null; const errs = [];
  for (const lag of LAGS) {
    const d = [];
    for (const e of events) { const v = at(e.t - lag); if (Number.isFinite(v)) d.push(e.m - v); }
    if (d.length < 30) continue;
    const bas = median(d);
    const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
    errs.push(err);
    if (!best || err < best.err) best = { lag, err, basis: bas, n: d.length };
  }
  if (!best) return null;
  const med = median(errs);
  return { ...best, depth: (med - best.err) / med };
}

const dur = (G[G.length - 1].t - G[0].t) / 60000;
console.log(`\n${'='.repeat(92)}`);
console.log(`Recovering Gains' input set — BTC, ${dur.toFixed(1)} min, ${G.length} Gains prints, ${act.length} scored`);
console.log(`${books.length} readable books, USDT/USD median ${median(rateFeed.map((r) => r.m)).toFixed(6)}`);
console.log('='.repeat(92));

console.log('\n--- each book on its own ---');
console.log('book             changes    LAG     fit($)   basis($)   well');
const single = [];
for (const b of books) {
  const r = fit(b.at, act);
  if (!r) { console.log(`${b.k.padEnd(14)} ${String(b.n).padStart(8)}   (not identified)`); continue; }
  single.push({ ...b, ...r });
  console.log(`${b.k.padEnd(14)} ${String(b.n).padStart(8)}  ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(7)}   ${r.err.toFixed(2).padStart(6)}   ${r.basis.toFixed(2).padStart(8)}   ${(r.depth * 100).toFixed(0).padStart(3)}%`);
}

// --- A. every subset -----------------------------------------------------
console.log('\n--- every subset of those books, median in USD ---');
const N = books.length;
const results = [];
for (let mask = 1; mask < (1 << N); mask++) {
  const idx = []; for (let i = 0; i < N; i++) if (mask & (1 << i)) idx.push(i);
  if (idx.length < 3) continue;
  const ats = idx.map((i) => books[i].at);
  const at = (t) => {
    const v = [];
    for (const f of ats) { const p = f(t); if (Number.isFinite(p)) v.push(p); }
    if (v.length < 3) return NaN;
    v.sort((a, b) => a - b);
    const h = v.length >> 1;
    return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2;
  };
  const r = fit(at, act);
  if (r) results.push({ members: idx.map((i) => books[i].k), ...r });
}
results.sort((a, b) => a.err - b.err);
console.log('\nbest 12 subsets by fit error:');
console.log('  fit($)   LAG     basis($)  well   members');
for (const r of results.slice(0, 12)) {
  console.log(`  ${r.err.toFixed(3).padStart(6)}  ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(7)}  ${r.basis.toFixed(2).padStart(8)}  ${(r.depth * 100).toFixed(0).padStart(3)}%   ${r.members.join(' ')}`);
}
console.log('\nworst 3, for scale:');
for (const r of results.slice(-3)) {
  console.log(`  ${r.err.toFixed(3).padStart(6)}  ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(7)}  ${r.basis.toFixed(2).padStart(8)}  ${(r.depth * 100).toFixed(0).padStart(3)}%   ${r.members.join(' ')}`);
}

// How often does each book appear in the best subsets, against how often it
// could? A book that is genuinely in their set should be over-represented.
console.log('\n--- membership frequency in the best 5% of subsets vs all subsets ---');
const top = results.slice(0, Math.max(10, Math.floor(results.length * 0.05)));
console.log('book             in top 5%   in all    lift');
for (const b of books) {
  const a = top.filter((r) => r.members.includes(b.k)).length / top.length;
  const c = results.filter((r) => r.members.includes(b.k)).length / results.length;
  console.log(`${b.k.padEnd(14)} ${(100 * a).toFixed(0).padStart(8)}%  ${(100 * c).toFixed(0).padStart(7)}%   ${(a / c).toFixed(2)}x`);
}

// --- B. is it landing ON a member value? ---------------------------------
console.log('\n--- B. how far is the NEAREST single book from each Gains print? ---');
{
  const best = results[0];
  const lag = best.lag;
  const dist = [], holder = {};
  for (const e of act) {
    let bd = Infinity, bk = null;
    for (const b of books) {
      const v = b.at(e.t - lag);
      if (!Number.isFinite(v)) continue;
      const d = Math.abs(e.m - v);
      if (d < bd) { bd = d; bk = b.k; }
    }
    if (bk) { dist.push(1e4 * bd / e.m); holder[bk] = (holder[bk] || 0) + 1; }
  }
  console.log(`  at the best subset's lag of ${lag}ms, distance to the nearest book, in bp:`);
  console.log(`  p10 ${q(dist, 0.1).toFixed(3)}   median ${q(dist, 0.5).toFixed(3)}   p90 ${q(dist, 0.9).toFixed(3)}   n=${dist.length}`);
  console.log(`  BTC rounds to 2dp on their wire, which is ${(1e4 * 0.01 / act[0].m).toFixed(4)}bp — that is the floor a plain median would sit at.`);

  console.log('\n--- C. which book is nearest, and how often ---');
  const tot = Object.values(holder).reduce((s, x) => s + x, 0);
  Object.entries(holder).sort((a, b) => b[1] - a[1])
    .forEach(([k, v]) => console.log(`  ${k.padEnd(14)} ${(100 * v / tot).toFixed(1).padStart(5)}%  (${v})`));
}
