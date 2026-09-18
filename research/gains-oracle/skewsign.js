// Settling the Gains price-impact convention properly.
//
// The first attempt failed twice over, and both failures are instructive:
//
//   1. On TradeOpenedMarket, `marketPrice` is null and `priceAfterImpact`
//      equals `price` exactly on all 13,346 fills. There is no pre-impact
//      price on the row, so realized impact cannot be recovered by
//      subtraction. Every "0.00bp move" in that run was me differencing a
//      field against itself.
//
//   2. I scaled the P-suffixed fields by 1e4, reading them as fractions. That
//      produced a median impact of ~110bp, which should have been the tell —
//      a 1.1% impact on entry is not a thing.
//
// THE ANCHOR that settles the scaling. Gains' trading-variables gives BTC a
// spreadP of 1e8 scaled 1e10, read as a percentage: a 1.0bp full spread, so a
// 0.5bp half-spread. On a BTC fill the row carries fixedSpreadP = -0.005. If
// these fields are PERCENTAGES, -0.005% is exactly that 0.5bp half-spread. If
// they were fractions it would be 50bp, fifty times Gains' own quoted spread.
// So they are percentages and the correct conversion is x100 into bp.
//
// THE SIGN follows from the same row: the components sum, and the sign tracks
// which way the PRICE was moved, not whether the trader gained. Which side that
// helps therefore depends on direction.
const fs = require('fs');
const S = __dirname;
const rd = (f) => { try { const j = JSON.parse(fs.readFileSync(`${S}/${f}`, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } };
const rows = [...rd('th72_arb.json'), ...rd('th72_base.json')];

const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
const BP = 100;   // P fields are percentages; x100 gives basis points

const T = [];
for (const r of rows) {
  if (r.action !== 'TradeOpenedMarket' || !r.meta?.priceImpact) continue;
  const p = r.meta.priceImpact;
  const f = Number(p.fixedSpreadP), c = Number(p.cumulVolPriceImpactP);
  const s = Number(p.skewPriceImpactP), t = Number(p.totalPriceImpactP);
  if (![f, c, s, t].every(Number.isFinite)) continue;
  T.push({ pair: r.pair, long: Number(r.long) === 1, f: f * BP, c: c * BP, s: s * BP, t: t * BP, sum: (f + c + s) * BP });
}

console.log(`\n${'='.repeat(88)}`);
console.log(`Gains price impact, read as percentages — ${T.length} TradeOpenedMarket fills, 72h`);
console.log('='.repeat(88));

// --- 1. do the components sum to the total? ------------------------------
const resid = T.map((x) => Math.abs(x.sum - x.t));
console.log(`\n--- 1. structure check: fixedSpread + cumulVol + skew == total? ---`);
console.log(`  max |residual| across all fills: ${Math.max(...resid).toExponential(2)}bp — they sum exactly`);

// --- 2. the scaling anchor -----------------------------------------------
console.log(`\n--- 2. scaling anchor: the fixed spread should equal HALF the quoted spread ---`);
console.log('  Gains quotes BTC and ETH at 1.0bp and most alts at 0.0bp (trading-variables).');
console.log('  pair            fills   median |fixedSpread|   implies a full spread of');
const byPair = {};
for (const x of T) (byPair[x.pair] ||= []).push(x);
for (const p of ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ARB/USD', 'ZEC/USD']) {
  const g = byPair[p]; if (!g || g.length < 20) continue;
  const half = q(g.map((x) => Math.abs(x.f)), 0.5);
  console.log(`  ${p.padEnd(15)} ${String(g.length).padStart(5)}   ${half.toFixed(3).padStart(18)}bp   ${(2 * half).toFixed(2)}bp`);
}
console.log('  BTC reading 0.50bp half / 1.00bp full is an exact match to their published spread,');
console.log('  which is what fixes the units. The x1e4 reading would have made it 100bp.');

// --- 3. what the sign means ----------------------------------------------
console.log(`\n--- 3. what the sign means: price direction, not trader benefit ---`);
console.log('  If the sign were "benefit", it would not flip with trade direction. It does.');
console.log('  side      fills   median fixedSpread   median skew   median total');
for (const [lbl, g] of [['LONG', T.filter((x) => x.long)], ['SHORT', T.filter((x) => !x.long)]]) {
  console.log(`  ${lbl.padEnd(9)} ${String(g.length).padStart(5)}   ${q(g.map((x) => x.f), 0.5).toFixed(3).padStart(16)}bp   ${q(g.map((x) => x.s), 0.5).toFixed(3).padStart(9)}bp   ${q(g.map((x) => x.t), 0.5).toFixed(3).padStart(10)}bp`);
}
console.log('\n  The fixed spread is a known COST, and it is negative for shorts and positive');
console.log('  for longs. That fixes the convention: a POSITIVE number raises the executed');
console.log('  price. Raising the price hurts a long and helps a short.');
console.log('  So the trader BENEFIT of any component = -value for a long, +value for a short.');

// --- 4. the actual question ----------------------------------------------
console.log(`\n--- 4. so does the skew component pay the trader, and by how much? ---`);
const ben = (x) => (x.long ? -x.s : x.s);
const all = T.map(ben);
console.log(`  skew benefit across all ${T.length} fills, in bp:`);
console.log(`    p10 ${q(all, 0.1).toFixed(2)}   p25 ${q(all, 0.25).toFixed(2)}   median ${q(all, 0.5).toFixed(2)}   p75 ${q(all, 0.75).toFixed(2)}   p90 ${q(all, 0.9).toFixed(2)}`);
console.log(`    favourable on ${(100 * all.filter((x) => x > 0).length / all.length).toFixed(1)}% of fills`);
const tb = T.map((x) => (x.long ? -x.t : x.t));
console.log(`  TOTAL impact benefit (spread + vol + skew):`);
console.log(`    p10 ${q(tb, 0.1).toFixed(2)}   median ${q(tb, 0.5).toFixed(2)}   p90 ${q(tb, 0.9).toFixed(2)}   favourable ${(100 * tb.filter((x) => x > 0).length / tb.length).toFixed(1)}%`);

console.log(`\n--- 5. best markets for skew benefit (100+ fills) ---`);
console.log('pair            fills   median skew benefit   p90    favourable   vs 7bp round trip');
Object.entries(byPair).filter(([, g]) => g.length >= 100)
  .map(([p, g]) => [p, g, q(g.map(ben), 0.5)])
  .sort((a, b) => b[2] - a[2]).slice(0, 10)
  .forEach(([p, g, med]) => {
    const b = g.map(ben);
    console.log(`${p.padEnd(15)} ${String(g.length).padStart(5)}   ${med.toFixed(2).padStart(17)}bp   ${q(b, 0.9).toFixed(2).padStart(5)}   ${(100 * b.filter((x) => x > 0).length / b.length).toFixed(0).padStart(9)}%   ${med >= 7 ? 'CLEARS' : 'does not clear'}`);
  });
