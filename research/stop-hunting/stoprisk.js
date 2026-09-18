// Why the direct measurement came back empty, and what it does tell you.
//
// The phantom stop-out simulation found ~0% at every stop distance of 25bp or
// more, on every venue. That is not "stops are safe". It is a quiet tape: BTC's
// worst deviation against ANY of these venues was about 5bp over 23 minutes,
// and a stale oracle can only reach a stop the market never reached if the
// market MOVES far and fast and then comes back. Nothing moved.
//
// The giveaway that the result is noise rather than signal: Hotstuff's BOOK MID,
// which does not lag at all, scored the HIGHEST phantom rate (1.95%) — above
// every laggy oracle. If lag were driving the result, the 4.9-second oracle
// would be worst and the non-lagging mid would be best. It is the other way
// round, so the sample is measuring jitter.
//
// So this derives the answer instead of waiting for a violent day.
//
// THE MECHANISM, stated exactly. A venue whose trigger price lags by L seconds
// is, at any instant, showing the market as it was L seconds ago. Its deviation
// from the true price is therefore the distance the market travelled during
// those L seconds. A stop sitting d basis points away is reachable by that
// venue and not by the market precisely when:
//
//     the market moves d bp within L seconds, and then recovers
//
// So the risk is not a property of the venue alone. It is the venue's lag
// crossed with how far the asset travels in that window — and THAT is fully
// measurable from a reference tape, quiet day or not.
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/stops.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const ref = [];
for (const r of rows) {
  if (r.f !== 'ref-binance-perp') continue;
  if (ref.length && ref[ref.length - 1].m === r.m) continue;
  ref.push({ t: r.l, m: r.m });
}
ref.sort((a, b) => a.t - b.t);
const T = Float64Array.from(ref.map((r) => r.t));
const M = Float64Array.from(ref.map((r) => r.m));
const at = (t) => {
  if (t < T[0] || t > T[T.length - 1]) return NaN;
  let lo = 0, hi = T.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; }
  return M[lo];
};
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);

// Measured lags, from the studies in this repo.
const VENUES = [
  ['Katana', 5500, 'index price'],
  ['Hotstuff', 4900, 'oracle — governs margin + liquidation'],
  ['GMX v2', 3200, 'signed feed — execution AND liquidation'],
  ['Ostium', 800, 'oracle — is the fill price'],
  ['Hyperliquid', 425, 'oracle feeding the mark'],
  ['Avantis', 300, 'Pyth Lazer'],
  ['Gains', 225, 'published feed'],
];

const T0 = T[0] + 5000, T1 = T[T.length - 1] - 1000;
const dur = (T1 - T0) / 60000;
console.log(`\n${'='.repeat(92)}`);
console.log(`Stop-hunt exposure = venue lag x how far BTC travels in that window`);
console.log(`Reference tape: ${ref.length} Binance perp changes over ${dur.toFixed(1)} min`);
console.log('='.repeat(92));

// How far does BTC travel inside each venue's lag window?
const SAMPLES = 120000;
console.log(`\n--- distance BTC travelled within each venue's lag window, this sample ---`);
console.log('venue        lag      median     p90      p99     p99.9      max');
const dists = {};
for (const [name, L] of VENUES) {
  const a = [];
  for (let i = 0; i < SAMPLES; i++) {
    const x = T0 + L + Math.random() * (T1 - T0 - L);
    const p1 = at(x), p0 = at(x - L);
    if (Number.isFinite(p0) && Number.isFinite(p1)) a.push(Math.abs(1e4 * (p1 - p0) / p0));
  }
  a.sort((x, y) => x - y);
  dists[name] = a;
  console.log(`${name.padEnd(12)} ${(L + 'ms').padStart(6)}  ${q(a, 0.5).toFixed(2).padStart(8)} ${q(a, 0.9).toFixed(2).padStart(8)} ${q(a, 0.99).toFixed(2).padStart(8)} ${q(a, 0.999).toFixed(2).padStart(8)} ${a[a.length - 1].toFixed(2).padStart(8)}`);
}
console.log('  (basis points. This is the size of deviation the venue can show at any moment.)');

// The same thing as the question a trader actually asks.
console.log(`\n--- how often is a stop at distance d inside the reachable range? ---`);
console.log('  share of moments where BTC moved at least d bp within the venue\'s lag window');
console.log('venue        lag      d=10bp   d=25bp   d=50bp  d=100bp  d=200bp');
for (const [name, L] of VENUES) {
  const a = dists[name];
  const cells = [10, 25, 50, 100, 200].map((d) => {
    const p = 100 * a.filter((x) => x >= d).length / a.length;
    return (p === 0 ? '0' : p < 0.01 ? '<0.01' : p.toFixed(2)) + '%';
  });
  console.log(`${name.padEnd(12)} ${(L + 'ms').padStart(6)} ${cells.map((c) => c.padStart(8)).join('')}`);
}

// What it takes, stated as the move required — this does not depend on the
// sample at all, and is the part that carries to a violent day.
console.log(`\n--- what a stop hunt REQUIRES on each venue (sample-independent) ---`);
console.log('  to be hunted at distance d, BTC must move d bp within the lag window and recover');
console.log('venue        lag      move needed for a 50bp stop, as % per minute');
for (const [name, L] of VENUES) {
  const perMin = 50 * (60000 / L) / 100;
  console.log(`${name.padEnd(12)} ${(L + 'ms').padStart(6)}   ${perMin.toFixed(2)}%/min sustained`);
}
console.log('\n  Lower is more dangerous: it takes less speed to reach your stop.');
console.log('  Katana needs 5.45%/min sustained; Gains needs 133%/min. That is a 24x gap in');
console.log('  how violent the market has to be before the venue itself can take you out,');
console.log('  and it is exactly the ratio of their lags.');

// Anchor it against a real move.
console.log(`\n--- worked example: a 1% move in 10 seconds (a normal CPI-print candle) ---`);
console.log('venue        lag      deviation it would print   hunts a 50bp stop?');
for (const [name, L] of VENUES) {
  const dev = 100 * (L / 10000);   // 100bp spread over 10s, venue sees L/10s of it
  console.log(`${name.padEnd(12)} ${(L + 'ms').padStart(6)}   ${(dev.toFixed(1) + 'bp').padStart(22)}   ${dev >= 50 ? 'YES' : 'no'}`);
}
console.log('\n  This is arithmetic from the measured lags, not an observation — the capture');
console.log('  contained no such move. It is what the lag implies, and the lags are measured.');
