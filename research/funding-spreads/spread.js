// Pairwise funding spreads, and whether they are worth anything.
//
// A funding carry trade is: long the venue with LOW funding, short the venue
// with HIGH funding, same size, same asset. Price risk cancels. You collect the
// difference in funding for as long as you hold.
//
// The mean spread is the easy half. The half that decides it:
//   PERSISTENCE — a spread that averages +10%/yr by flipping between +40 and
//     -20 is not harvestable, because you cannot hold through the flips without
//     the mean being an accident of when you started.
//   BREAK-EVEN — fees are paid once, carry accrues per hour. So the question is
//     how many days you must hold before the carry covers getting in and out.
//   WORST WINDOW — the realistic downside, measured as the worst rolling 7-day
//     stretch rather than assumed away.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const SYM = process.env.SYM || 'BTC';
const D = JSON.parse(fs.readFileSync(`${S}/funding_${SYM}.json`, 'utf8'));
const HOUR = 3600000;
const ANN = 24 * 365 * 100;   // hourly fraction -> % per year

// Expand each venue onto an hourly grid. An 8-hourly settlement covers the 8
// hours that preceded it, so its hourly rate is credited to each of them.
const grid = {};
for (const [name, v] of Object.entries(D)) {
  const g = new Map();
  const span = v.medGapH >= 4 ? 8 : 1;
  for (const r of v.rows) {
    const h0 = Math.floor(r.t / HOUR);
    for (let k = 0; k < span; k++) g.set(h0 - k, r.hourly);
  }
  grid[name] = g;
}

const names = Object.keys(grid).sort();
const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

console.log(`\n${'='.repeat(78)}`);
console.log(`${SYM} funding, 30 days, normalised to an hourly rate then annualised`);
console.log('='.repeat(78));
console.log('\nvenue           hours   mean %/yr   median %/yr   %hours positive   settle');
for (const n of names) {
  const vals = [...grid[n].values()];
  const raw = D[n];
  const mean = vals.reduce((s, x) => s + x, 0) / vals.length;
  console.log(`${n.padEnd(14)} ${String(vals.length).padStart(5)}   ${(mean * ANN).toFixed(2).padStart(9)}   ${(median(vals) * ANN).toFixed(2).padStart(11)}   ` +
    `${(100 * vals.filter((x) => x > 0).length / vals.length).toFixed(0).padStart(14)}%   ${raw.medGapH >= 4 ? '8h' : '1h'}`);
}

// ---- pairwise ----
const pairs = [];
for (let i = 0; i < names.length; i++) {
  for (let k = 0; k < names.length; k++) {
    if (i === k) continue;
    const A = grid[names[i]], B = grid[names[k]];   // short A, long B  => collect A - B
    const hs = [...A.keys()].filter((h) => B.has(h)).sort((a, b) => a - b);
    if (hs.length < 24 * 7) continue;
    const d = hs.map((h) => A.get(h) - B.get(h));
    const mean = d.reduce((s, x) => s + x, 0) / d.length;
    if (mean <= 0) continue;                         // keep the profitable orientation only

    // Persistence must be counted on INDEPENDENT observations. An 8-hourly
    // venue expanded onto an hourly grid repeats each settlement eight times,
    // which would turn 60 real observations into 480 and make any agreement
    // look eight times more convincing than it is. Step by the coarser of the
    // two venues' settlement periods.
    const stepH = Math.max(D[names[i]].medGapH >= 4 ? 8 : 1, D[names[k]].medGapH >= 4 ? 8 : 1);
    const indep = [];
    for (let z = 0; z < d.length; z += stepH) indep.push(d[z]);
    const pos = indep.filter((x) => x > 0).length / indep.length;
    const nIndep = indep.length;
    // worst rolling 7-day stretch of the carry
    let worst = Infinity;
    const W = 24 * 7;
    if (d.length >= W) {
      let run = d.slice(0, W).reduce((s, x) => s + x, 0);
      worst = run;
      for (let z = W; z < d.length; z++) { run += d[z] - d[z - W]; if (run < worst) worst = run; }
    }
    pairs.push({ short: names[i], long: names[k], hours: hs.length, nIndep, mean, pos, worstWeek: worst });
  }
}
pairs.sort((a, b) => b.mean - a.mean);

console.log(`\n${'='.repeat(78)}`);
console.log('Best pairs — SHORT the high-funding venue, LONG the low one, delta neutral');
console.log('='.repeat(78));
console.log('\nshort           long            hrs   obs   carry %/yr   same-sign   worst 7d   breakeven days');
console.log('                                                                                  @10bp  @30bp');
for (const p of pairs.slice(0, 14)) {
  const annual = p.mean * ANN;
  // fees are paid once; carry accrues hourly. days to cover a round trip:
  const beDays = (bp) => (p.mean > 0 ? (bp / 1e4) / (p.mean * 24) : Infinity);
  console.log(`${p.short.padEnd(15)} ${p.long.padEnd(15)} ${String(p.hours).padStart(4)} ${String(p.nIndep).padStart(5)}  ${annual.toFixed(2).padStart(10)}   ${(100 * p.pos).toFixed(0).padStart(8)}%   ` +
    `${(p.worstWeek * 100).toFixed(3).padStart(7)}%   ${beDays(10).toFixed(1).padStart(6)} ${beDays(30).toFixed(1).padStart(6)}`);
}

console.log(`\n(carry %/yr is the annualised funding difference. "same-sign" is the share of`);
console.log(` hours the spread pointed the way its mean says — below ~70% the mean is an`);
console.log(` average of flips, not a position you can sit in. "worst 7d" is the worst the`);
console.log(` carry did over any rolling week, as a fraction of notional, per leg.`);
console.log(` breakeven days = how long you must hold before the carry covers a round trip`);
console.log(` at 10bp and 30bp of total cost across both legs, in and out.)`);
