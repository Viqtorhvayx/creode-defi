// Gains' price feed vs the CEX tape, using the same level test and the same
// guards as research/lead-lag and research/new-venue-screen:
//
//   for each value Gains publishes, which PAST value of the reference best
//   reproduces it. Positive lag = Gains trails.
//
// Not cross-correlation on a resampled grid — that manufactures a lead out of
// a venue's own publish interval, which is exactly the mistake this project
// spent a week not making.
//
// Guards:
//   self-control   the reference against itself must read 0ms
//   placebo        the same test against a +90s shifted reference finds nothing
//   well depth     how much better the minimum is than a typical lag
//   activity       a flat tape carries no timing information; keep the busy half
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/gains.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) {
  if (r.f === 'gains-hb') continue;
  const a = (feeds[r.f] ||= []);
  if (a.length && a[a.length - 1].m === r.m) continue; // level changes only
  a.push({ t: r.l, m: r.m });
}
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

const LAGS = []; for (let l = -2000; l <= 12000; l += 50) LAGS.push(l);

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

const ref = feeds['binance-perp'];
const refAt = stepper(ref);
const span = [ref[0].t + 30000, ref[ref.length - 1].t - 30000];
const dur = (ref[ref.length - 1].t - ref[0].t) / 60000;

console.log(`\n${'='.repeat(88)}`);
console.log(`Gains (backend-pricing.eu.gains.trade/v3) vs the CEX tape — ${dur.toFixed(1)} min, ${ref.length} Binance perp changes`);
console.log('='.repeat(88));

// --- cadence -------------------------------------------------------------
console.log('\n--- publish cadence ---');
for (const k of ['gains-btc', 'gains-eth']) {
  const f = feeds[k]; if (!f) continue;
  const g = []; for (let i = 1; i < f.length; i++) g.push(f[i].t - f[i - 1].t);
  g.sort((a, b) => a - b);
  console.log(`${k.padEnd(10)} ${String(f.length).padStart(5)} changes   median gap ${median(g).toFixed(0)}ms   p10 ${g[Math.floor(g.length * 0.1)]}ms  p90 ${g[Math.floor(g.length * 0.9)]}ms`);
}

// --- the lag, BTC, against every reference we captured -------------------
console.log('\n--- which reference best explains the Gains BTC print, and by how long does it trail? ---');
console.log('reference          n    LAG        fit($)   basis($)   well');
const refs = Object.keys(feeds).filter((k) => !k.startsWith('gains') && !k.endsWith('-eth') && !k.startsWith('usdtusd'));
const results = [];
for (const rk of refs) {
  const f = feeds[rk];
  if (!f || f.length < 100) { console.log(`${rk.padEnd(16)} ${String(f ? f.length : 0).padStart(5)}   (too thin)`); continue; }
  const at = stepper(f);
  const sp = [Math.max(span[0], f[0].t + 30000), Math.min(span[1], f[f.length - 1].t - 30000)];
  const r = test(feeds['gains-btc'], at, sp);
  if (!r) { console.log(`${rk.padEnd(16)}   (not identified)`); continue; }
  console.log(`${rk.padEnd(16)} ${String(r.n).padStart(5)}  ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(8)}   ${r.err.toFixed(2).padStart(6)}   ${r.basis.toFixed(2).padStart(8)}   ${(r.depth * 100).toFixed(0).padStart(3)}%`);
  results.push({ rk, ...r });
}

// --- the composite: Gains takes a median across exchanges, so we should too --
// gTrade's oracle is documented as a median of up to 8 exchange prices, taken
// by a custom Chainlink DON. If that is what the feed is, a median across the
// spot books we can read should fit it BETTER than any single book does — and
// the amount better is how much of their formula we have recovered.
//
// The first run of this got it wrong in a way worth keeping written down: the
// median was taken over a MIXTURE of USDT-quoted books (Binance, Bybit) and
// USD-quoted books (Coinbase, Kraken). On BTC those two clusters sit ~$70
// apart, so the median flipped between them tick by tick and the composite fit
// $3.19 where a single book fit $1.89. A median is only meaningful over values
// in the same units.
{
  const USDT = ['binance-spot', 'bybit-spot'];
  const USD = ['coinbase-spot', 'kraken-spot'];
  const rateFeed = feeds['usdtusd'] && feeds['usdtusd'].length > 20 ? feeds['usdtusd']
    : (feeds['usdtusd-kraken'] && feeds['usdtusd-kraken'].length > 20 ? feeds['usdtusd-kraken'] : null);
  const SRC = [...USDT, ...USD];
  const have = SRC.filter((s) => feeds[s] && feeds[s].length > 60);
  if (!rateFeed) console.log('\n(no USDT/USD feed in this capture — composite skipped, see note in gainscap.js)');
  if (rateFeed && have.length >= 3) {
    const rateAt = stepper(rateFeed);
    const ats = have.map((s) => {
      const f = stepper(feeds[s]);
      if (USD.includes(s)) return f;
      return (t) => { const p = f(t), r = rateAt(t); return Number.isFinite(p) && Number.isFinite(r) ? p * r : NaN; };
    });
    {
      const r0 = rateFeed.map((r) => r.m).sort((a, b) => a - b);
      console.log(`\nUSDT/USD over the capture: median ${r0[r0.length >> 1].toFixed(6)}  min ${r0[0].toFixed(6)}  max ${r0[r0.length - 1].toFixed(6)}  (${rateFeed.length} changes)`);
    }
    // Evaluate the composite on the Binance perp clock: it is the densest tape
    // we have, so it defines the instants, not any one of the composite legs.
    const comp = [];
    for (const e of ref) {
      const v = ats.map((f) => f(e.t)).filter(Number.isFinite);
      if (v.length < 3) continue;
      v.sort((a, b) => a - b);
      const m = v.length % 2 ? v[v.length >> 1] : (v[(v.length >> 1) - 1] + v[v.length >> 1]) / 2;
      if (comp.length && comp[comp.length - 1].m === m) continue;
      comp.push({ t: e.t, m });
    }
    feeds['composite'] = comp;
    const r = test(feeds['gains-btc'], stepper(comp), span);
    console.log(`\ncomposite median of ${have.join(', ')}`);
    console.log(`${'composite'.padEnd(16)} ${String(r ? r.n : 0).padStart(5)}  ${r ? ((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(8) : '   n/a'}   ${r ? r.err.toFixed(2).padStart(6) : ''}   ${r ? r.basis.toFixed(2).padStart(8) : ''}   ${r ? (r.depth * 100).toFixed(0).padStart(3) + '%' : ''}`);
    if (r) results.push({ rk: 'composite', ...r });
  }
}

// --- ETH, against Binance perp ETH ---------------------------------------
if (feeds['binance-perp-eth'] && feeds['gains-eth']) {
  const at = stepper(feeds['binance-perp-eth']);
  const e = feeds['binance-perp-eth'];
  const sp = [e[0].t + 30000, e[e.length - 1].t - 30000];
  const r = test(feeds['gains-eth'], at, sp);
  console.log(`\nETH: gains-eth vs binance-perp-eth   ${r ? ((r.lag >= 0 ? '+' : '') + r.lag) + 'ms   fit $' + r.err.toFixed(2) + '   well ' + (r.depth * 100).toFixed(0) + '%' : 'not identified'}`);
}

// --- guards --------------------------------------------------------------
console.log('\n--- guards ---');
const self = test(ref.filter((_, i) => i % 4 === 0), refAt, span);
console.log(`self-control (Binance perp vs itself)   ${self ? (self.lag >= 0 ? '+' : '') + self.lag + 'ms   well ' + (self.depth * 100).toFixed(0) + '%' : 'n/a'}`);
const pl = stepper(ref, -90000);
const p = test(feeds['gains-btc'], pl, span);
console.log(`placebo (+90s shifted reference)        ${p ? (p.lag >= 0 ? '+' : '') + p.lag + 'ms   well ' + (p.depth * 100).toFixed(0) + '%' : 'not identified — good'}`);

// Reciprocity: measure the reference against Gains. If Gains trails Binance by
// L, Binance against Gains must read about -L.
const gAt = stepper(feeds['gains-btc']);
const recip = test(ref.filter((_, i) => i % 4 === 0), gAt, span);
console.log(`reciprocity (Binance measured vs Gains) ${recip ? (recip.lag >= 0 ? '+' : '') + recip.lag + 'ms   well ' + (recip.depth * 100).toFixed(0) + '%' : 'n/a'}`);

// --- the product claim, stated as a testable question ---------------------
// At the instant just before Gains publishes print k+1, is OUR continuously
// recomputed value closer to what they are about to print than their own
// currently-displayed print k is? If yes, we knew their next number before they
// did, and by how much is the honest measure of the lead.
if (feeds['composite']) {
  const g = feeds['gains-btc'], cAt = stepper(feeds['composite']);
  let win = 0, tot = 0, ourErr = 0, theirErr = 0;
  for (let k = 1; k < g.length; k++) {
    const t = g[k].t - 30; // just before their print lands
    const ours = cAt(t);
    if (!Number.isFinite(ours)) continue;
    const a = Math.abs(ours - g[k].m), b = Math.abs(g[k - 1].m - g[k].m);
    if (b === 0) continue; // their price did not change; nothing to anticipate
    tot++; ourErr += a; theirErr += b;
    if (a < b) win++;
  }
  console.log(`\n--- do we know their next print before they publish it? ---`);
  console.log(`  ${tot} publishes where their price actually moved`);
  console.log(`  our replication is closer to their NEXT print than their CURRENT one  ${(100 * win / tot).toFixed(1)}% of the time`);
  console.log(`  mean |error| vs their next print:  ours $${(ourErr / tot).toFixed(2)}   their displayed print $${(theirErr / tot).toFixed(2)}`);
}

// --- how stale is their screen at a random moment? ------------------------
// The fitted lag says how far behind the tape a FRESH print is. What a trader
// actually looks at is a print of some age, because they only republish every
// ~505ms and skip publishes when nothing changed. Total staleness at a random
// instant = fitted lag + age of the print on screen.
{
  const g = feeds['gains-btc'];
  const ages = [];
  const t0 = g[0].t, t1 = g[g.length - 1].t;
  let j = 0;
  for (let t = t0; t < t1; t += 25) {
    while (j + 1 < g.length && g[j + 1].t <= t) j++;
    ages.push(t - g[j].t);
  }
  ages.sort((a, b) => a - b);
  const q = (f) => ages[Math.floor(ages.length * f)];
  console.log(`\n--- age of the print on their screen, sampled every 25ms ---`);
  console.log(`  median ${q(0.5)}ms   p75 ${q(0.75)}ms   p90 ${q(0.9)}ms   p99 ${q(0.99)}ms   max ${ages[ages.length - 1]}ms`);
}

// --- how stale is a Gains print at the moment it is superseded? ----------
const best = results.filter((r) => r.rk === 'binance-perp')[0];
if (best) {
  console.log(`\n--- what the ${best.lag}ms is worth ---`);
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
    return a.sort((q, r) => q - r);
  };
  console.log(`BTC ~$${px.toFixed(0)}.  How far it travels inside a window:`);
  console.log('window    median      p90      p99      max');
  const W = [best.lag, Math.round(best.lag * 0.7), Math.round(best.lag / 2), 500];
  const D = {};
  for (const w of W) {
    if (w <= 0) continue;
    const a = dist(w); D[w] = a;
    const q = (f) => a[Math.floor(a.length * f)];
    console.log(`${String(w).padStart(5)}ms  $${q(0.5).toFixed(2).padStart(7)}  $${q(0.9).toFixed(2).padStart(7)}  $${q(0.99).toFixed(2).padStart(7)}  $${a[a.length - 1].toFixed(2).padStart(7)}`);
  }
  // Gains BTC: 1.0bp spread (spreadP 1e8/1e10) + 3.5bp/side fee
  const costBp = 1.0 + 2 * 3.5;
  const cost = (costBp / 1e4) * px;
  console.log(`\nRound trip on Gains BTC = 1.0bp spread + 2x3.5bp fee = ${costBp.toFixed(1)}bp = $${cost.toFixed(2)}`);
  console.log('reaction   usable    hit-rate   avg gross edge when hit');
  for (const react of [0, 300, 600, 1000]) {
    const usable = best.lag - react;
    if (usable <= 0) continue;
    const k = W.filter((w) => w > 0).reduce((b, w) => (Math.abs(w - usable) < Math.abs(b - usable) ? w : b));
    const a = D[k];
    const hits = a.filter((x) => x > cost);
    const edge = hits.length ? hits.reduce((s, x) => s + x - cost, 0) / hits.length : 0;
    console.log(`${String(react).padStart(5)}ms   ${String(usable).padStart(5)}ms   ${(100 * hits.length / a.length).toFixed(2).padStart(7)}%   ${hits.length ? '$' + edge.toFixed(2) : '—'}   (nearest measured window ${k}ms)`);
  }
}
