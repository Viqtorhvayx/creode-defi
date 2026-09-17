// Avantis' oracle lag, using the same level test and the same guards as
// everywhere else in this project: for each value they publish, which past
// value of the reference best reproduces it. Positive lag = they trail.
//
// Their feed carries its own microsecond clock, so this also reports the
// transport delay directly rather than folding it into the estimate.
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/av.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) {
  const a = (feeds[r.f] ||= []);
  if (a.length && a[a.length - 1].m === r.m) continue;
  a.push({ t: r.l, m: r.m, srv: r.srv, fu: r.fu, spread: r.spread, pub: r.pub });
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
const LAGS = []; for (let l = -1500; l <= 8000; l += 50) LAGS.push(l);
function test(series, at, span) {
  const ev = [];
  for (const e of series) {
    if (e.t < span[0] || e.t > span[1]) continue;
    const a = at(e.t - 2500), b = at(e.t + 2500);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    ev.push({ ...e, move: Math.abs(b - a) });
  }
  if (ev.length < 20) return null;
  const cut = median(ev.map((e) => e.move));
  const act = ev.filter((e) => e.move >= cut && e.move > 0);
  if (act.length < 15) return null;
  let best = null; const errs = [];
  for (const lag of LAGS) {
    const d = [];
    for (const e of act) { const r = at(e.t - lag); if (Number.isFinite(r)) d.push(e.m - r); }
    if (d.length < 15) continue;
    const bas = median(d);
    const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
    errs.push(err);
    if (!best || err < best.err) best = { lag, err, basis: bas };
  }
  if (!best) return null;
  const med = median(errs);
  return { ...best, n: act.length, depth: (med - best.err) / med };
}

const A = feeds['avantis'], ref = feeds['binance-perp'];
const refAt = stepper(ref);
const span = [Math.max(A[0].t, ref[0].t) + 30000, Math.min(A[A.length - 1].t, ref[ref.length - 1].t) - 30000];
const dur = (ref[ref.length - 1].t - ref[0].t) / 60000;

console.log(`\n${'='.repeat(86)}`);
console.log(`Avantis / Veranta (Pyth Lazer via feed-v3.avantisfi.com) — BTC, ${dur.toFixed(1)} min`);
console.log(`${A.length} price changes, ${ref.length} Binance perp changes`);
console.log('='.repeat(86));

// --- their own clock -----------------------------------------------------
{
  const all = rows.filter((r) => r.f === 'avantis' && r.srv);
  const d = all.map((r) => r.l - r.srv);
  const fu = all.map((r) => r.srv - r.fu);
  const gaps = []; for (let i = 1; i < all.length; i++) gaps.push(all[i].srv - all[i - 1].srv);
  console.log('\n--- their clock, from the wire ---');
  console.log(`  publish grid (server timestamps): median ${median(gaps).toFixed(0)}ms   p90 ${q(gaps, 0.9).toFixed(0)}ms`);
  console.log(`  transport to us: p10 ${q(d, 0.1).toFixed(0)}ms  median ${q(d, 0.5).toFixed(0)}ms  p90 ${q(d, 0.9).toFixed(0)}ms`);
  console.log(`  stamp minus feedUpdateTimestamp: median ${median(fu).toFixed(0)}ms  (their own internal delay)`);
  const sp = all.map((r) => r.spread).filter(Number.isFinite);
  const px = median(all.map((r) => r.m));
  console.log(`  quoted band: median $${median(sp).toFixed(2)} (${(1e4 * median(sp) / px).toFixed(2)}bp)   publishers ${median(all.map((r) => r.pub))}`);
}

console.log('\n--- lag against each reference ---');
console.log('reference          n     LAG       fit($)   basis($)   well');
for (const rk of ['binance-perp', 'binance-spot', 'coinbase']) {
  const f = feeds[rk];
  if (!f || f.length < 80) { console.log(`${rk.padEnd(16)} (too thin: ${f ? f.length : 0})`); continue; }
  const sp = [Math.max(span[0], f[0].t + 30000), Math.min(span[1], f[f.length - 1].t - 30000)];
  const r = test(A, stepper(f), sp);
  if (!r) { console.log(`${rk.padEnd(16)} (not identified)`); continue; }
  console.log(`${rk.padEnd(16)} ${String(r.n).padStart(4)}  ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(8)}  ${r.err.toFixed(2).padStart(7)}   ${r.basis.toFixed(2).padStart(8)}   ${(r.depth * 100).toFixed(0).padStart(3)}%`);
}

console.log('\n--- guards ---');
const self = test(ref.filter((_, i) => i % 4 === 0), refAt, span);
console.log(`self-control (Binance vs itself)   ${self ? (self.lag >= 0 ? '+' : '') + self.lag + 'ms  well ' + (self.depth * 100).toFixed(0) + '%' : 'n/a'}`);
const pl = test(A, stepper(ref, -90000), span);
console.log(`placebo (+90s shifted reference)   ${pl ? (pl.lag >= 0 ? '+' : '') + pl.lag + 'ms  well ' + (pl.depth * 100).toFixed(0) + '%' : 'not identified — good'}`);

// --- what would it be worth? --------------------------------------------
{
  const best = test(A, refAt, span);
  const T = ref.map((r) => r.t), M = ref.map((r) => r.m);
  const at = (t) => { if (t < T[0] || t > T[T.length - 1]) return NaN; let lo = 0, hi = T.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; } return M[lo]; };
  const px = median(M);
  const sp2 = [T[0] + 15000, T[T.length - 1] - 1000];
  const dist = (w) => {
    const a = [];
    for (let i = 0; i < 60000; i++) {
      const x = sp2[0] + Math.random() * (sp2[1] - sp2[0]);
      const p1 = at(x), p0 = at(x - w);
      if (Number.isFinite(p0) && Number.isFinite(p1)) a.push(Math.abs(p1 - p0));
    }
    return a.sort((c, d) => c - d);
  };
  const w = Math.max(50, best ? best.lag : 200);
  const a = dist(w);
  console.log(`\n--- what the ${w}ms is worth ---`);
  console.log(`BTC ~$${px.toFixed(0)}. Move inside ${w}ms: median $${q(a, 0.5).toFixed(2)}  p90 $${q(a, 0.9).toFixed(2)}  p99 $${q(a, 0.99).toFixed(2)}  max $${a[a.length - 1].toFixed(2)}`);
  const allA = rows.filter((r) => r.f === 'avantis' && Number.isFinite(r.spread));
  const bandBp = 1e4 * median(allA.map((r) => r.spread)) / px;
  console.log(`Their own quoted band alone is ${bandBp.toFixed(2)}bp = $${(bandBp / 1e4 * px).toFixed(2)}, before any fee.`);
  const hits = a.filter((x) => x > (bandBp / 1e4) * px);
  console.log(`Moves inside the window that clear just that band: ${(100 * hits.length / a.length).toFixed(2)}%`);
}
