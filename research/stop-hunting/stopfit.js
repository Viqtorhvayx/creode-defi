// How often does a venue's trigger price reach your stop when the market never
// did?
//
// THE SIMULATION. A long is opened at the true market price. A stop sits d
// basis points below it. Over the next H seconds:
//
//   the venue triggers  if its trigger price ever trades at or below the stop
//   the market triggers if the REFERENCE ever trades at or below the stop
//
//   venue yes, market no  ->  PHANTOM stop-out. Closed at a loss on a wick that
//                             existed nowhere you could have traded.
//   market yes, venue no  ->  a stop that should have fired and did not. Cheaper
//                             than a phantom, but recorded, because it is the
//                             same defect pointing the other way.
//
// The reference is a median across the deepest books, so no single exchange's
// glitch can manufacture a phantom.
//
// THE BASIS IS REMOVED FIRST. Every venue sits at some persistent offset from
// the reference — different source set, USD against USDT. That offset is not a
// stop hunt, it is a unit difference, and leaving it in would convict whichever
// venue happened to quote lowest. Only the DEVIATION around each venue's own
// median offset is scored.
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/stops.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) {
  const a = (feeds[r.f] ||= []);
  if (a.length && a[a.length - 1].m === r.m) continue;
  a.push({ t: r.l, m: r.m });
}
for (const k of Object.keys(feeds)) feeds[k].sort((a, b) => a.t - b.t);

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
function stepper(f) {
  const T = Float64Array.from(f.map((r) => r.t));
  const M = Float64Array.from(f.map((r) => r.m));
  return (t) => {
    if (t < T[0] || t > T[T.length - 1]) return NaN;
    let lo = 0, hi = T.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (T[mid] <= t) lo = mid; else hi = mid - 1; }
    return M[lo];
  };
}

// --- the reference -------------------------------------------------------
const REF = ['ref-binance-perp', 'ref-binance-spot', 'ref-bybit'].filter((k) => feeds[k]?.length > 200);
const refAts = REF.map((k) => stepper(feeds[k]));
const base = feeds['ref-binance-perp'];
const T0 = base[0].t + 60000, T1 = base[base.length - 1].t - 60000;
const STEP = 250;   // evaluate everything on a common 250ms grid
const grid = [];
for (let t = T0; t <= T1; t += STEP) {
  const v = refAts.map((f) => f(t)).filter(Number.isFinite);
  if (v.length < 2) { grid.push(NaN); continue; }
  v.sort((a, b) => a - b);
  grid.push(v.length % 2 ? v[v.length >> 1] : (v[(v.length >> 1) - 1] + v[v.length >> 1]) / 2);
}
const N = grid.length;
const dur = (T1 - T0) / 60000;

console.log(`\n${'='.repeat(94)}`);
console.log(`Where your stop gets hunted — BTC, ${dur.toFixed(1)} min, reference = median of ${REF.length} deep books`);
console.log('='.repeat(94));

const VENUES = [
  ['hotstuff-oracle', 'Hotstuff', 'oracle — governs margin + liquidation'],
  ['katana-index', 'Katana', 'index price'],
  ['gmx-signed', 'GMX v2', 'signed feed — execution AND liquidation'],
  ['ostium', 'Ostium', 'oracle — is the fill price'],
  ['hyperliquid-mark', 'Hyperliquid', 'mark — liquidations run off this'],
  ['hyperliquid-oracle', 'Hyperliquid', 'oracle — feeds the mark'],
  ['gains', 'Gains', 'published feed'],
  ['avantis', 'Avantis', 'Pyth Lazer'],
  ['hotstuff-mid', 'Hotstuff', 'book mid — for contrast, it does not lag'],
];

// --- deviation, basis-removed -------------------------------------------
console.log(`\n--- deviation of each venue's trigger price from the market, in bp ---`);
console.log('venue        feed                                    p0.1     p1      p50     p99    p99.9    worst');
const series = {};
for (const [key, name, what] of VENUES) {
  const f = feeds[key];
  if (!f || f.length < 30) { console.log(`${name.padEnd(12)} ${what.padEnd(38)} (too thin: ${f ? f.length : 0})`); continue; }
  const at = stepper(f);
  const raw = [];
  for (let i = 0; i < N; i++) {
    const r = grid[i]; if (!Number.isFinite(r)) { raw.push(NaN); continue; }
    const v = at(T0 + i * STEP);
    raw.push(Number.isFinite(v) ? 1e4 * (v - r) / r : NaN);
  }
  const ok = raw.filter(Number.isFinite);
  if (ok.length < 100) { console.log(`${name.padEnd(12)} ${what.padEnd(38)} (not enough overlap)`); continue; }
  const bas = median(ok);
  const dev = raw.map((x) => (Number.isFinite(x) ? x - bas : NaN));
  series[key] = { dev, name, what, basis: bas };
  const d = dev.filter(Number.isFinite);
  console.log(`${name.padEnd(12)} ${what.padEnd(38)} ${q(d, 0.001).toFixed(1).padStart(7)} ${q(d, 0.01).toFixed(1).padStart(7)} ${q(d, 0.5).toFixed(1).padStart(7)} ${q(d, 0.99).toFixed(1).padStart(7)} ${q(d, 0.999).toFixed(1).padStart(7)} ${Math.min(...d).toFixed(1).padStart(8)}`);
}
console.log('  (negative = the venue is printing BELOW the market, which is what reaches a long\'s stop)');
console.log('  basis removed per venue: ' + Object.values(series).map((s) => `${s.name} ${s.basis >= 0 ? '+' : ''}${s.basis.toFixed(1)}bp`).join(', '));

// --- the phantom stop-out simulation ------------------------------------
const HORIZON = 300;          // seconds a position is held before giving up
const HS = HORIZON * 1000 / STEP;
const STARTS = [];
for (let i = 0; i + HS < N; i += 4) if (Number.isFinite(grid[i])) STARTS.push(i);

console.log(`\n--- phantom stop-outs: venue reached the stop, the market never did ---`);
console.log(`  ${STARTS.length} simulated entries, each held up to ${HORIZON}s, long side`);
console.log('\nvenue        feed                            stop=10bp  25bp    50bp   100bp   200bp');
for (const [key] of VENUES) {
  const s = series[key]; if (!s) continue;
  const cells = [];
  for (const d of [10, 25, 50, 100, 200]) {
    let phantom = 0, real = 0, n = 0;
    for (const i of STARTS) {
      let vHit = false, rHit = false, seen = false;
      for (let j = i; j <= i + HS; j++) {
        const r = grid[j], dv = s.dev[j];
        if (!Number.isFinite(r) || !Number.isFinite(dv)) continue;
        seen = true;
        // both measured as a fall from the entry, in bp
        const rFall = 1e4 * (grid[i] - r) / grid[i];
        const vFall = rFall - dv;           // venue = market + deviation
        if (vFall >= d) vHit = true;
        if (rFall >= d) rHit = true;
        if (vHit && rHit) break;
      }
      if (!seen) continue;
      n++;
      if (vHit && !rHit) phantom++;
      if (rHit && !vHit) real++;
    }
    cells.push({ d, phantom, real, n });
  }
  console.log(`${s.name.padEnd(12)} ${s.what.slice(0, 30).padEnd(30)} ` +
    cells.map((c) => ((100 * c.phantom / c.n).toFixed(2) + '%').padStart(8)).join(''));
}
console.log('\n  Read as: of positions opened at a random moment, the share where the venue\'s');
console.log('  own price reached a stop that distance away while the real market did not.');

// --- and the mirror: stops that should have fired and did not ------------
console.log('\n--- the same defect pointing the other way: market hit the stop, venue did not ---');
console.log('venue        feed                            stop=10bp  25bp    50bp   100bp   200bp');
for (const [key] of VENUES) {
  const s = series[key]; if (!s) continue;
  const cells = [];
  for (const d of [10, 25, 50, 100, 200]) {
    let real = 0, n = 0;
    for (const i of STARTS) {
      let vHit = false, rHit = false, seen = false;
      for (let j = i; j <= i + HS; j++) {
        const r = grid[j], dv = s.dev[j];
        if (!Number.isFinite(r) || !Number.isFinite(dv)) continue;
        seen = true;
        const rFall = 1e4 * (grid[i] - r) / grid[i];
        const vFall = rFall - dv;
        if (vFall >= d) vHit = true;
        if (rFall >= d) rHit = true;
        if (vHit && rHit) break;
      }
      if (!seen) continue;
      n++;
      if (rHit && !vHit) real++;
    }
    cells.push({ d, real, n });
  }
  console.log(`${s.name.padEnd(12)} ${s.what.slice(0, 30).padEnd(30)} ` +
    cells.map((c) => ((100 * c.real / c.n).toFixed(2) + '%').padStart(8)).join(''));
}
