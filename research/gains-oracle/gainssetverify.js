// Does the recovered set actually change anything?
//
// Two questions the subset search does not answer on its own:
//
//   1. Gains' print sits ~0.07bp from the nearest readable book — above the
//      rounding floor, so it is landing BETWEEN books rather than on one. That
//      is what a median over a set containing members we cannot read looks
//      like. But it is also what a trimmed mean looks like. Test both.
//
//   2. The product test. The old equal-median over four books fit $2.13 and
//      beat their current print 29.3% of the time. If the recovered set does
//      not move that number, the recovery is interesting and useless.
const fs = require('fs');
const S = __dirname;
const rows = fs.readFileSync(`${S}/set.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const feeds = {};
for (const r of rows) {
  if (r.f === 'gains-hb') continue;
  const a = (feeds[r.f] ||= []);
  if (a.length && a[a.length - 1].m === r.m) continue;
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
const USD = new Set(['coinbase', 'kraken', 'bitstamp', 'bitfinex', 'gemini', 'cryptocom']);
const rateAt = stepper(feeds['usdtusd'].length > 20 ? feeds['usdtusd'] : feeds['usdtusd-kr']);
const bookAt = (k) => {
  const raw = stepper(feeds[k]);
  return USD.has(k) ? raw : (t) => { const p = raw(t), r = rateAt(t); return Number.isFinite(p) && Number.isFinite(r) ? p * r : NaN; };
};

// The two candidate sets: what shipped, and what the subset search recovered.
const OLD = ['binance-t', 'bybit-t', 'coinbase', 'kraken'];
const NEW = ['coinbase', 'kraken', 'binance-t', 'bybit-t', 'bitget-t', 'gate-t'];

const agg = {
  median: (v) => { const h = v.length >> 1; return v.length % 2 ? v[h] : (v[h - 1] + v[h]) / 2; },
  // A median over 7 members where we can see 5 lands between our middle two
  // more often than on one of them. A trimmed mean is the natural stand-in for
  // "the middle of the pack" when the pack is partly invisible.
  trimmed: (v) => {
    if (v.length < 5) return agg.median(v);
    const c = v.slice(1, -1);
    return c.reduce((s, x) => s + x, 0) / c.length;
  },
  mean: (v) => v.reduce((s, x) => s + x, 0) / v.length,
};

const build = (names, how) => {
  const ats = names.map(bookAt);
  return (t) => {
    const v = [];
    for (const f of ats) { const p = f(t); if (Number.isFinite(p)) v.push(p); }
    if (v.length < 3) return NaN;
    v.sort((a, b) => a - b);
    return agg[how](v);
  };
};

const G = feeds['gains'], ref = feeds['binance-perp'];
const refAt = stepper(ref);
const span = [Math.max(G[0].t, ref[0].t) + 60000, Math.min(G[G.length - 1].t, ref[ref.length - 1].t) - 30000];
const ev = G.filter((e) => e.t >= span[0] && e.t <= span[1]);
const moves = ev.map((e) => { const a = refAt(e.t - 2000), b = refAt(e.t + 2000); return Number.isFinite(a) && Number.isFinite(b) ? Math.abs(b - a) : 0; });
const cut = median(moves.filter((m) => m > 0));
const act = ev.filter((_, i) => moves[i] >= cut && moves[i] > 0);

const LAGS = []; for (let l = -1000; l <= 2000; l += 50) LAGS.push(l);
function fit(at) {
  let best = null;
  for (const lag of LAGS) {
    const d = [];
    for (const e of act) { const v = at(e.t - lag); if (Number.isFinite(v)) d.push(e.m - v); }
    if (d.length < 30) continue;
    const bas = median(d);
    const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
    if (!best || err < best.err) best = { lag, err, basis: bas };
  }
  return best;
}

console.log(`\nScored on ${act.length} active Gains prints of ${ev.length}.\n`);
console.log('set          aggregation   LAG      fit($)   basis($)');
for (const [label, names] of [['shipped', OLD], ['recovered', NEW]]) {
  for (const how of ['median', 'trimmed', 'mean']) {
    const r = fit(build(names, how));
    if (!r) continue;
    console.log(`${label.padEnd(12)} ${how.padEnd(12)} ${((r.lag >= 0 ? '+' : '') + r.lag + 'ms').padStart(7)}  ${r.err.toFixed(3).padStart(7)}   ${r.basis.toFixed(2).padStart(8)}`);
  }
}

// --- the product test ----------------------------------------------------
// At the instant just before Gains publishes print k+1, is our value closer to
// what they are about to print than their own displayed print k is? This is the
// only question that decides whether the replication is worth showing.
console.log('\n--- do we know their next print before they publish it? ---');
//
// Run twice: raw, and after removing a rolling basis.
//
// The basis is a persistent level offset between our composite and their
// number — different source set, a USDT rate that is not exactly theirs. It is
// not lag and it is not error in any useful sense, because it can be calibrated
// away live from the last N publishes. Scoring it as error would be scoring our
// choice of units. The rolling window is deliberately short and strictly
// backward-looking: it only ever uses publishes that already happened, so it
// cannot see the print it is being asked to predict.
const BASIS_N = 40;
console.log('set          aggregation  basis      wins     mean |err| ours   theirs');
for (const [label, names] of [['shipped', OLD], ['recovered', NEW]]) {
  for (const how of ['median', 'trimmed']) {
    for (const correct of [false, true]) {
      const at = build(names, how);
      let win = 0, tot = 0, ourE = 0, theirE = 0;
      const hist = [];
      for (let k = 1; k < G.length; k++) {
        if (G[k].t < span[0] || G[k].t > span[1]) continue;
        const ours = at(G[k].t - 30);
        if (!Number.isFinite(ours)) continue;
        const bias = correct && hist.length >= 10 ? median(hist.slice(-BASIS_N)) : 0;
        const a = Math.abs(ours + bias - G[k].m), b = Math.abs(G[k - 1].m - G[k].m);
        hist.push(G[k].m - ours);           // observed only after the fact
        if (b === 0) continue;
        tot++; ourE += a; theirE += b;
        if (a < b) win++;
      }
      console.log(`${label.padEnd(12)} ${how.padEnd(11)} ${(correct ? 'removed' : 'raw    ').padEnd(9)} ${(100 * win / tot).toFixed(1).padStart(5)}%    $${(ourE / tot).toFixed(2).padStart(6)}        $${(theirE / tot).toFixed(2)}   (n=${tot})`);
    }
  }
}
