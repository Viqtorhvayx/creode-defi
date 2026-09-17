// Oracle lag for the new venues, using the same level test and the same guards
// as research/lead-lag: for each value a venue publishes, which past value of
// the reference best reproduces it. Positive lag = the venue trails.
//
// The guards matter more here than anywhere, because these are small venues on
// a quiet tape and it would be easy to report noise as a finding:
//   - self-control: the reference against itself must read 0ms
//   - placebo: the same test against a +90s shifted reference must find nothing
//   - well depth: how much better the minimum is than a typical lag. A shallow
//     well means the estimate is not identified, whatever number it points at.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const rows = fs.readFileSync(`${S}/newv.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

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

const ref = feeds['binance'];
if (!ref || ref.length < 200) { console.error('reference too thin'); process.exit(1); }
const refAt = stepper(ref);
const span = [ref[0].t + 30000, ref[ref.length - 1].t - 30000];
const LAGS = []; for (let l = -2000; l <= 15000; l += 100) LAGS.push(l);

function test(series, at) {
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

const dur = (ref[ref.length - 1].t - ref[0].t) / 60000;
console.log(`\n${'='.repeat(84)}`);
console.log(`New perp DEX oracle lag vs Binance perp — BTC, ${dur.toFixed(1)} min, ${ref.length} reference ticks`);
console.log('='.repeat(84));
console.log('\nfeed              changes  cadence   LAG vs Binance   fit($)   basis($)   well');

const out = [];
for (const name of Object.keys(feeds).sort()) {
  if (name === 'binance') continue;
  const f = feeds[name];
  const gaps = []; for (let i = 1; i < f.length; i++) gaps.push(f[i].t - f[i - 1].t);
  const r = test(f, refAt);
  if (!r) { console.log(`${name.padEnd(17)} ${String(f.length).padStart(7)}   ${(median(gaps) || 0).toFixed(0).padStart(6)}ms   (not identified — too few changes)`); continue; }
  console.log(`${name.padEnd(17)} ${String(f.length).padStart(7)}   ${median(gaps).toFixed(0).padStart(6)}ms   ` +
    `${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(13)}   ${r.err.toFixed(2).padStart(6)}   ${r.basis.toFixed(2).padStart(8)}   ${(r.depth * 100).toFixed(0).padStart(3)}%`);
  out.push({ name, ...r });
}

console.log('\n--- guards ---');
const self = test(ref.filter((_, i) => i % 3 === 0), refAt);
console.log(`self-control (reference vs itself)   ${self ? (self.lag >= 0 ? '+' : '') + self.lag + 'ms  well ' + (self.depth * 100).toFixed(0) + '%' : 'n/a'}`);
const pl = stepper(ref, -90000);
for (const o of out) {
  const p = test(feeds[o.name], pl);
  console.log(`placebo ${o.name.padEnd(15)} real ${((o.lag >= 0 ? '+' : '') + o.lag).padStart(7)}ms well ${(o.depth * 100).toFixed(0).padStart(3)}%   placebo ${p ? ((p.lag >= 0 ? '+' : '') + p.lag).padStart(7) + 'ms well ' + (p.depth * 100).toFixed(0) + '%' : 'n/a'}`);
}

// --- tradability: does the venue's own market price lag too? ---
console.log('\n--- is the lag reachable? (Arcus publishes oracle, mark and last together) ---');
const or = feeds['arcus-oracle'], mk = feeds['arcus-mark'];
if (or && mk && mk.length > 50) {
  const oAt = stepper(or);
  const d = [];
  for (const e of mk) { const o = oAt(e.t); if (Number.isFinite(o)) d.push(e.m - o); }
  d.sort((a, b) => a - b);
  const px = median(mk.map((e) => e.m));
  const q = (f) => d[Math.floor(d.length * f)];
  console.log(`  mark − oracle over ${d.length} samples: median $${q(0.5).toFixed(2)} (${(1e4 * q(0.5) / px).toFixed(1)}bp)`);
  console.log(`    p5 $${q(0.05).toFixed(2)}   p95 $${q(0.95).toFixed(2)}   mark above oracle ${(100 * d.filter((x) => x > 0).length / d.length).toFixed(0)}% of the time`);
  console.log(`  If mark and oracle carry the SAME lag, the gap is a basis you cannot trade.`);
  console.log(`  If the oracle lags and mark does not, the difference is what a taker could reach.`);
}
