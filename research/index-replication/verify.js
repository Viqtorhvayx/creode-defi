// Two checks the headline result needs before it can be believed.
//
// 1. IS THE FORMULA DOING ANY WORK? If simply reading Binance spot reproduces
//    Hyperliquid's oracle as well as their full seven-source weighted median
//    does, then replicating the formula is theatre. Compare them head to head.
// 2. DOES THE MARKET ACTUALLY FOLLOW THE ORACLE? The user's premise. Measure
//    the basis: its size, whether it stays bounded, and whether the book's
//    moves track the oracle's.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const rows = fs.readFileSync(`${S}/rep.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const feeds = {};
for (const r of rows) (feeds[r.f] ||= []).push({ t: r.l, m: r.m });
for (const k of Object.keys(feeds)) feeds[k].sort((a, b) => a.t - b.t);

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
function stepper(f) {
  const T = Float64Array.from(f.map((r) => r.t)), M = Float64Array.from(f.map((r) => r.m));
  return (t) => {
    if (t < T[0] || t > T[T.length - 1]) return NaN;
    let lo = 0, hi = T.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (T[mid] <= t) lo = mid; else hi = mid - 1; }
    return M[lo];
  };
}

// Rebuild alternative index constructions from the raw spot feeds we logged.
const W = { binance: 3, okx: 2, bybit: 2, kraken: 1, kucoin: 1, gate: 1, mexc: 1 };
const SRC = Object.keys(W);
const at = {};
for (const s of SRC) if (feeds[`spot-${s}`]) at[s] = stepper(feeds[`spot-${s}`]);

function build(kind) {
  // sample on every spot update so each construction gets the same timestamps
  const times = [];
  for (const s of SRC) for (const e of feeds[`spot-${s}`] || []) times.push(e.t);
  times.sort((a, b) => a - b);
  const out = [];
  let last = null;
  for (const t of times) {
    const rowsNow = [];
    for (const s of SRC) { const v = at[s]?.(t); if (Number.isFinite(v)) rowsNow.push({ p: v, w: W[s], s }); }
    if (rowsNow.length < 4) continue;
    let px = null;
    if (kind === 'binance-only') px = rowsNow.find((r) => r.s === 'binance')?.p ?? null;
    else if (kind === 'plain-median') { const a = rowsNow.map((r) => r.p).sort((x, y) => x - y); px = a[a.length >> 1]; }
    else if (kind === 'mean') px = rowsNow.reduce((s2, r) => s2 + r.p, 0) / rowsNow.length;
    else { // weighted median, the documented one
      rowsNow.sort((a, b) => a.p - b.p);
      const tot = rowsNow.reduce((s2, r) => s2 + r.w, 0);
      let acc = 0;
      for (const r of rowsNow) { acc += r.w; if (acc >= tot / 2) { px = r.p; break; } }
    }
    if (px == null || px === last) continue;
    last = px;
    out.push({ t, m: px });
  }
  return out;
}

const hl = feeds['hl-oracle'];
const LAGS = []; for (let l = -1000; l <= 8000; l += 50) LAGS.push(l);
function race(series) {
  const A = stepper(series);
  const span = [series[0].t + 30000, series[series.length - 1].t - 30000];
  const ev = hl.filter((e) => e.t >= span[0] && e.t <= span[1]);
  if (ev.length < 20) return null;
  let best = null;
  for (const lag of LAGS) {
    const d = [];
    for (const e of ev) { const v = A(e.t - lag); if (Number.isFinite(v)) d.push(e.m - v); }
    if (d.length < 20) continue;
    const bas = median(d);
    const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
    if (!best || err < best.err) best = { lag, err, basis: bas, n: d.length };
  }
  return best;
}

console.log('\n=== 1. Which construction actually reproduces Hyperliquid\'s oracle? ===');
console.log('(fit = median absolute miss at the best lag; basis = constant offset)\n');
console.log('construction            lead over their oracle    fit($)   basis($)');
for (const kind of ['weighted-median', 'plain-median', 'mean', 'binance-only']) {
  const s = build(kind);
  const r = race(s);
  if (!r) { console.log(`${kind.padEnd(22)}  (not enough data)`); continue; }
  const label = kind === 'weighted-median' ? kind + '  <- their formula' : kind;
  console.log(`${label.padEnd(40)} ${(r.lag + 'ms').padStart(8)}   ${r.err.toFixed(2).padStart(6)}   ${r.basis.toFixed(2).padStart(8)}`);
}

console.log('\n=== 2. Does the market price follow the oracle? (Hyperliquid BTC) ===');
const bk = feeds['hl-book'], or = feeds['hl-oracle'], mk = feeds['hl-mark'];
const oAt = stepper(or);
const basis = [];
for (const e of bk) { const o = oAt(e.t); if (Number.isFinite(o)) basis.push({ t: e.t, d: e.m - o, px: e.m }); }
const ds = basis.map((b) => b.d).sort((a, b) => a - b);
const px = median(bk.map((e) => e.m));
const q = (f) => ds[Math.floor(ds.length * f)];
console.log(`  book mid − oracle, ${ds.length} book updates over ${((bk[bk.length - 1].t - bk[0].t) / 60000).toFixed(1)} min:`);
console.log(`    median ${q(0.5).toFixed(2)}  (${(1e4 * q(0.5) / px).toFixed(1)}bp)`);
console.log(`    p5 ${q(0.05).toFixed(2)}   p95 ${q(0.95).toFixed(2)}   full range $${(ds[ds.length - 1] - ds[0]).toFixed(2)} = ${(1e4 * (ds[ds.length - 1] - ds[0]) / px).toFixed(1)}bp`);
console.log(`    the oracle itself moved $${(Math.max(...or.map((e) => e.m)) - Math.min(...or.map((e) => e.m))).toFixed(2)} over the same window`);
console.log(`    so the book stayed inside a ${(1e4 * (ds[ds.length - 1] - ds[0]) / px).toFixed(1)}bp band of a price that ranged ${(1e4 * (Math.max(...or.map((e) => e.m)) - Math.min(...or.map((e) => e.m))) / px).toFixed(0)}bp — it is tracking, at a small persistent discount`);

// co-movement: do book moves and oracle moves line up?
let sxy = 0, sxx = 0, syy = 0, n = 0;
for (let i = 1; i < bk.length; i++) {
  if (bk[i].t - bk[i - 1].t > 5000) continue;
  const o0 = oAt(bk[i - 1].t), o1 = oAt(bk[i].t);
  if (!Number.isFinite(o0) || !Number.isFinite(o1) || o1 === o0) continue;
  const rx = Math.log(bk[i].m / bk[i - 1].m), ry = Math.log(o1 / o0);
  sxy += rx * ry; sxx += rx * rx; syy += ry * ry; n++;
}
console.log(`  co-movement of book and oracle returns: corr ${(sxy / Math.sqrt(sxx * syy)).toFixed(3)} over ${n} intervals`);
const mAt = stepper(mk);
const md = [];
for (const e of or) { const v = mAt(e.t); if (Number.isFinite(v)) md.push(v - e.m); }
console.log(`  mark − oracle: median $${median(md).toFixed(2)} (${(1e4 * median(md) / px).toFixed(1)}bp) — mark is built from the oracle by construction`);
