// What a measured lag is actually worth.
//
// Setup: a venue publishes a price that is L ms stale. You can see the live
// price. You buy the stale side, and close once the venue catches up.
//   gross per round trip = |move over L| − full spread − fees
// The spread is crossed twice (in and out), so it is subtracted whole.
//
// The part that decides everything is REACTION TIME. You do not get the full L.
// You get L minus however long it takes you to see the move and land an order.
// A browser watching a websocket and firing an Arbitrum transaction is not
// operating in single-digit milliseconds. So the usable window is L − react,
// and when react >= L there is nothing there at all, whatever L says.
const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RED = JSON.parse(fs.readFileSync(process.argv[2] || `${SCRATCH}/reduced2.json`, 'utf8'));

const key = Object.keys(RED).find((k) => k.startsWith('binance-perp|'));
const o = RED[key];
const pts = [];
for (let i = 0; i < o.m.length; i++) {
  const s = o.s[i] != null && Math.abs(o.t[i] - o.s[i]) < 60000 ? o.s[i] : o.t[i];
  pts.push([s, o.m[i]]);
}
pts.sort((a, b) => a[0] - b[0]);
const t = Float64Array.from(pts.map((p) => p[0]));
const m = Float64Array.from(pts.map((p) => p[1]));
const at = (x) => {
  if (x < t[0] || x > t[t.length - 1]) return NaN;
  let lo = 0, hi = t.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (t[mid] <= x) lo = mid; else hi = mid - 1; }
  return m[lo];
};
const span = [t[0] + 10000, t[t.length - 1] - 1000];
const PX = m[Math.floor(m.length / 2)];
const N = 60000;

function moveDist(win) {
  const a = [];
  for (let i = 0; i < N; i++) {
    const x = span[0] + Math.random() * (span[1] - span[0]);
    const p1 = at(x), p0 = at(x - win);
    if (Number.isFinite(p0) && Number.isFinite(p1)) a.push(Math.abs(p1 - p0));
  }
  return a.sort((p, q) => p - q);
}

console.log(`\nBTC ~$${PX.toFixed(0)}  ·  ${((span[1] - span[0]) / 60000).toFixed(1)} min of Binance perp tape\n`);
console.log('OSTIUM — the one venue here where the lagging price IS the fill price.');
console.log(`  measured lag  650ms (level test) / 879ms (event study)`);
console.log(`  measured spread  $13.10 (1.7bp), p90 $16.88\n`);

const SPREAD = 13.10;
console.log('usable window after your own reaction time, at various fee levels:');
console.log('  react   window   hit-rate(fee 0)  hit(+2bp)  hit(+5bp)   E[net]/trade @2bp');
for (const react of [0, 100, 250, 500, 750]) {
  const win = 650 - react;
  if (win <= 0) {
    console.log(`  ${String(react).padStart(4)}ms  ${String(win).padStart(6)}ms   — the venue has already caught up before you can act —`);
    continue;
  }
  const a = moveDist(win);
  const hr = (c) => (100 * a.filter((x) => x > c).length / a.length).toFixed(2) + '%';
  const c2 = SPREAD + 0.0002 * PX;
  const net = a.reduce((s, x) => s + (x - c2), 0) / a.length;   // you pay the cost every attempt
  console.log(`  ${String(react).padStart(4)}ms  ${String(win).padStart(6)}ms   ${hr(SPREAD).padStart(13)}  ${hr(c2).padStart(9)}  ${hr(SPREAD + 0.0005 * PX).padStart(9)}   $${net.toFixed(2).padStart(8)}`);
}

console.log('\nSame question for the biggest lag found anywhere in this study:');
console.log('HOTSTUFF ORACLE — lag 4900ms, but it is NOT the fill price. Shown only');
console.log('to size what you would be giving up if it ever were fillable.');
const b = moveDist(4900);
for (const [label, cost] of [['spread-free', 0.0001 * PX], ['+5bp cost', 0.0006 * PX]]) {
  const hits = b.filter((x) => x > cost).length;
  const net = b.reduce((s, x) => s + (x - cost), 0) / b.length;
  console.log(`  ${label.padEnd(12)} cost $${cost.toFixed(2).padStart(6)}   hit ${(100 * hits / b.length).toFixed(1)}%   E[net]/trade $${net.toFixed(2)}`);
}

console.log('\nAnd the honest control — what the SAME calculation says about a venue');
console.log('that ties with Binance (Bitget, lag 0ms):');
const z = moveDist(1);
console.log(`  median |move| over its lag window: $${z[Math.floor(z.length / 2)].toFixed(2)} — there is no window.`);
