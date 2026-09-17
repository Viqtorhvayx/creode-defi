// What is GMX's 3.2s execution-price lag actually worth?
//
// The subtlety that decides it: GMX v2 orders are executed by a KEEPER a block
// or two after you submit, at whatever the oracle says THEN. You cannot lock in
// the stale price you can see. So the window you actually get is
//     usable = measured lag − your submit-to-execution latency
// and on Arbitrum that latency is not small.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const rows = fs.readFileSync(`${S}/gmxs.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const ref = rows.filter((r) => r.f === 'binance').sort((a, b) => a.l - b.l);
const T = ref.map((r) => r.l), M = ref.map((r) => r.m);
const at = (t) => {
  if (t < T[0] || t > T[T.length - 1]) return NaN;
  let lo = 0, hi = T.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; }
  return M[lo];
};
const px = M[Math.floor(M.length / 2)];
const span = [T[0] + 10000, T[T.length - 1] - 1000];
const N = 80000;
const dist = (w) => {
  const a = [];
  for (let i = 0; i < N; i++) {
    const x = span[0] + Math.random() * (span[1] - span[0]);
    const p1 = at(x), p0 = at(x - w);
    if (Number.isFinite(p0) && Number.isFinite(p1)) a.push(Math.abs(p1 - p0));
  }
  return a.sort((p, q) => p - q);
};

console.log(`\nGMX v2 — measured lag 3200ms, measured spread 0.40bp. BTC ~$${px.toFixed(0)}`);
console.log(`Binance tape from the same capture: ${ref.length} ticks over ${((T[T.length - 1] - T[0]) / 60000).toFixed(1)} min\n`);

console.log('How far does BTC travel inside the usable window?');
console.log('usable   median   p90      p99      max');
const windows = [3200, 2200, 1200, 700, 200];
const D = {};
for (const w of windows) {
  const a = dist(w); D[w] = a;
  const q = (p) => a[Math.floor(a.length * p)];
  console.log(`${String(w).padStart(5)}ms  $${q(0.5).toFixed(2).padStart(6)}  $${q(0.9).toFixed(2).padStart(6)}  $${q(0.99).toFixed(2).padStart(6)}  $${a[a.length - 1].toFixed(2).padStart(6)}`);
}

console.log('\nShare of moments the move beats the round-trip cost, and the average');
console.log('gross edge when it does. Cost = 0.40bp spread + fees both ways.\n');
console.log('reaction  usable   cost        hit-rate   avg edge when hit');
// GMX v2's published open/close fee is 0.05-0.07% per side; it is not exposed
// on the public API, so it is shown as a range rather than asserted.
for (const [react, feeBpEach] of [[0, 5], [1000, 5], [2000, 5], [0, 7], [1000, 7], [2000, 7]]) {
  const usable = 3200 - react;
  const a = D[windows.reduce((b, w) => (Math.abs(w - usable) < Math.abs(b - usable) ? w : b))];
  const costBp = 0.40 + 2 * feeBpEach;
  const cost = (costBp / 1e4) * px;
  const hits = a.filter((x) => x > cost);
  const edge = hits.length ? hits.reduce((s, x) => s + x - cost, 0) / hits.length : 0;
  console.log(`${String(react).padStart(5)}ms  ${String(usable).padStart(5)}ms  ${costBp.toFixed(1).padStart(5)}bp=$${cost.toFixed(0).padStart(4)}  ${(100 * hits.length / a.length).toFixed(2).padStart(7)}%   ${hits.length ? '$' + edge.toFixed(2) : '—'}`);
}
console.log('\nBreak-even move needed, for reference:');
for (const f of [5, 7]) {
  const c = (0.40 + 2 * f) / 1e4 * px;
  console.log(`  at ${f}bp/side fees: $${c.toFixed(2)} (${((0.40 + 2 * f)).toFixed(1)}bp) inside the usable window`);
}
