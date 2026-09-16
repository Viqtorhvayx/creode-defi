// Lead/lag study over the reduced capture.
//
// Convention: LAG θ means "this venue's print at time t matches where the
// reference was at t − θ". θ > 0 = venue trails. θ < 0 = venue LEADS.
//
// Estimators (neither resamples the slow series — that is what broke the
// earlier attempt):
//   LEVEL  — which shifted reference level best matches each print
//            (mean absolute deviation, basis-adjusted).
//   RETURN — correlate the venue's return over its own inter-print interval
//            with the reference's return over that same interval, shifted.
// Only the reference is interpolated. It updates ~40x/s, far denser than any
// venue tested, so previous-tick interpolation of it is harmless. Interpolating
// the SLOW side is the thing that manufactures phantom leads.
//
// Guards: a self-control feed (two sockets, one stream), a +90s placebo
// reference, reciprocity between every pair, and a well-depth figure so a
// meaningless flat curve can't be reported as a point estimate.
const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RED = JSON.parse(fs.readFileSync(process.argv[2] || `${SCRATCH}/reduced.json`, 'utf8'));
const BASE = process.env.BASE || 'srv';
const ASSET = process.env.ASSET || 'BTC';
const REF = process.env.REF || (ASSET === 'BTC' ? 'binance-perp' : 'binance-hype');
const MINPTS = Number(process.env.MINPTS || 150);

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

const feeds = {};
for (const key of Object.keys(RED)) {
  const [name, asset] = key.split('|');
  if (asset !== ASSET) continue;
  const o = RED[key];
  const t = [], m = [];
  for (let i = 0; i < o.m.length; i++) {
    const srv = o.s[i] != null && Math.abs(o.t[i] - o.s[i]) < 60000 ? o.s[i] : null;
    const tt = BASE === 'srv' ? (srv ?? o.t[i]) : o.t[i];
    t.push(tt); m.push(o.m[i]);
  }
  const idx = t.map((_, i) => i).sort((a, b) => t[a] - t[b]);
  feeds[name] = { t: Float64Array.from(idx.map((i) => t[i])), m: Float64Array.from(idx.map((i) => m[i])),
    delays: o.s.map((s, i) => (s != null && Math.abs(o.t[i] - s) < 60000 ? o.t[i] - s : null)).filter((x) => x != null) };
}

function stepper(f, shift = 0) {
  const T = f.t, M = f.m, n = T.length;
  return (t) => {
    const x = t - shift;
    if (x < T[0] || x > T[n - 1]) return NaN;
    let lo = 0, hi = n - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (T[mid] <= x) lo = mid; else hi = mid - 1; }
    return M[lo];
  };
}

const LAGS = []; for (let l = -3000; l <= 6000; l += 25) LAGS.push(l);

function levelTest(f, refAt, span) {
  const et = [], em = [], mv = [];
  for (let i = 0; i < f.t.length; i++) {
    const t = f.t[i];
    if (t < span[0] || t > span[1]) continue;
    const a = refAt(t - 1500), b = refAt(t + 1500);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    et.push(t); em.push(f.m[i]); mv.push(Math.abs(b - a));
  }
  if (et.length < 60) return null;
  const cut = median(mv);                       // keep the busier half of the tape
  const kt = [], km = [];
  for (let i = 0; i < et.length; i++) if (mv[i] >= cut && mv[i] > 0) { kt.push(et[i]); km.push(em[i]); }
  if (kt.length < 60) return null;
  let bestRow = null; const errs = [];
  for (const lag of LAGS) {
    const d = [];
    for (let i = 0; i < kt.length; i++) { const r = refAt(kt[i] - lag); if (Number.isFinite(r)) d.push(km[i] - r); }
    if (d.length < 60) continue;
    const bas = median(d);
    let s = 0; for (const x of d) s += Math.abs(x - bas);
    const err = s / d.length;
    errs.push(err);
    if (!bestRow || err < bestRow.err) bestRow = { lag, err };
  }
  if (!bestRow) return null;
  const med = median(errs);
  return { ...bestRow, n: kt.length, depth: (med - bestRow.err) / med, curve: LAGS.map((l, i) => [l, errs[i]]) };
}

function returnTest(f, refAt, span) {
  let bestRow = null; const cs = [];
  for (const lag of LAGS) {
    let sxy = 0, sxx = 0, syy = 0, n = 0;
    for (let i = 1; i < f.t.length; i++) {
      const t0 = f.t[i - 1], t1 = f.t[i];
      if (t0 < span[0] || t1 > span[1] || t1 - t0 > 10000 || t1 <= t0) continue;
      const a = refAt(t0 - lag), b = refAt(t1 - lag);
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const rx = Math.log(f.m[i] / f.m[i - 1]), ry = Math.log(b / a);
      if (!Number.isFinite(rx) || !Number.isFinite(ry)) continue;
      sxy += rx * ry; sxx += rx * rx; syy += ry * ry; n++;
    }
    const den = Math.sqrt(sxx * syy);
    const c = den > 0 ? sxy / den : NaN;
    cs.push(c);
    if (Number.isFinite(c) && (!bestRow || c > bestRow.corr)) bestRow = { lag, corr: c, n };
  }
  return bestRow;
}

const names = Object.keys(feeds).filter((n) => feeds[n].t.length >= 40).sort();
const ref = feeds[REF];
if (!ref) { console.error(`no reference ${REF} for ${ASSET}`); process.exit(1); }
const span = [ref.t[0] + 25000, ref.t[ref.t.length - 1] - 25000];
const refAt = stepper(ref);

console.log(`\n${'='.repeat(78)}`);
console.log(`${ASSET}  ·  reference ${REF}  ·  clock = ${BASE === 'srv' ? 'venue server timestamps' : 'local arrival times'}`);
console.log(`window ${((span[1] - span[0]) / 1000).toFixed(0)}s   reference price-changes ${ref.t.length}`);
console.log('='.repeat(78));
console.log('\nvenue              changes  gap_ms  netdelay   LEVEL_lag  well   RETURN_lag  corr');

const rows = [];
for (const n of names) {
  const f = feeds[n];
  const gaps = []; for (let i = 1; i < f.t.length; i++) gaps.push(f.t[i] - f.t[i - 1]);
  const lv = levelTest(f, refAt, span);
  const rt = returnTest(f, refAt, span);
  const nd = f.delays.length ? Math.min(...f.delays) : null;
  rows.push({ n, f, lv, rt, gap: median(gaps), nd });
  console.log(
    `${n.padEnd(18)} ${String(f.t.length).padStart(7)} ${String(Math.round(median(gaps))).padStart(7)} ` +
    `${(nd != null ? nd + 'ms' : '—').padStart(9)}  ${(lv ? (lv.lag >= 0 ? '+' : '') + lv.lag : '—').padStart(10)} ` +
    `${(lv ? (lv.depth * 100).toFixed(0) + '%' : '—').padStart(5)}  ${(rt ? (rt.lag >= 0 ? '+' : '') + rt.lag : '—').padStart(10)}  ${rt ? rt.corr.toFixed(3) : '—'}`);
}

// ---- placebo ----
console.log('\n--- PLACEBO: identical test against the reference shifted +90s ---');
console.log('(a real result must beat what the method finds in unrelated data)');
const plRef = stepper(ref, -90000);
for (const r of rows) {
  if (r.n === REF) continue;
  const p = levelTest(r.f, plRef, [span[0], span[1] - 90000]);
  if (!p || !r.lv) continue;
  console.log(`${r.n.padEnd(18)} real ${((r.lv.lag >= 0 ? '+' : '') + r.lv.lag).padStart(6)}ms well ${(r.lv.depth * 100).toFixed(0).padStart(3)}%   placebo ${((p.lag >= 0 ? '+' : '') + p.lag).padStart(6)}ms well ${(p.depth * 100).toFixed(0).padStart(3)}%`);
}

// ---- pairwise + reciprocity ----
const big = names.filter((n) => feeds[n].t.length >= MINPTS);
console.log('\n--- RECIPROCITY: A-vs-B must be the negative of B-vs-A ---');
const pair = {};
for (const a of big) for (const b of big) {
  if (a === b) continue;
  const v = levelTest(feeds[a], stepper(feeds[b]), span);
  pair[`${a}|${b}`] = v ? v.lag : null;
}
for (let i = 0; i < big.length; i++) for (let j = i + 1; j < big.length; j++) {
  const a = big[i], b = big[j];
  const ab = pair[`${a}|${b}`], ba = pair[`${b}|${a}`];
  if (ab == null || ba == null) continue;
  const sum = ab + ba;
  console.log(`${a.padEnd(17)} vs ${b.padEnd(17)} ${String(ab).padStart(6)} / ${String(ba).padStart(6)}  sum ${String(sum).padStart(6)}ms  ${Math.abs(sum) <= 100 ? 'consistent' : 'NOT RECIPROCAL'}`);
}

fs.writeFileSync(`${SCRATCH}/lead_${ASSET}_${BASE}.json`,
  JSON.stringify(rows.map((r) => ({ venue: r.n, changes: r.f.t.length, gap: r.gap, netdelay: r.nd,
    level: r.lv?.lag, levelErr: r.lv?.err, depth: r.lv?.depth, ret: r.rt?.lag, corr: r.rt?.corr,
    curve: r.lv?.curve })), null, 1));
