// Is there skill in perp trading, or only variance?
//
// Hyperliquid publishes a leaderboard covering 45,530 accounts with PnL, ROI
// and volume over day / week / month / all-time windows. That is the largest
// public record of perp trader outcomes available anywhere, and it answers the
// question that actually decides whether "smart trading" is a plan:
//
//   does past performance predict future performance?
//
// If it does not, then picking a strategy on the basis of what worked recently
// is picking noise, and no amount of venue research changes that.
//
// THE TEST. The windows nest — all-time contains month, month contains week —
// so they cannot be compared directly without double counting. Subtracting
// gives disjoint periods:
//
//   earlier  = allTime − month   (everything before the last month)
//   recent   = month             (the last month)
//
// Rank traders on `earlier`, then look at what they did during `recent`. The
// periods share no trades, so any relationship is genuine persistence and not
// an artifact of the same PnL appearing on both sides.
const fs = require('fs');
const S = __dirname;
const raw = JSON.parse(fs.readFileSync(`${S}/hlb.json`, 'utf8'));
const rows = raw.leaderboardRows || raw;

const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : NaN; };
const win = (r, name) => {
  const w = (r.windowPerformances || []).find((p) => p[0] === name);
  return w ? { pnl: num(w[1].pnl), roi: num(w[1].roi), vlm: num(w[1].vlm) } : null;
};
const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
const sum = (a) => a.reduce((s, x) => s + x, 0);
const mean = (a) => (a.length ? sum(a) / a.length : NaN);
const usd = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

const T = [];
for (const r of rows) {
  const a = win(r, 'allTime'), m = win(r, 'month'), w = win(r, 'week'), d = win(r, 'day');
  if (!a || !m || !w || !d) continue;
  const av = num(r.accountValue);
  if (!Number.isFinite(av)) continue;
  T.push({ addr: r.ethAddress, av, a, m, w, d, earlier: a.pnl - m.pnl, earlierVlm: a.vlm - m.vlm });
}

console.log(`\n${'='.repeat(88)}`);
console.log(`Hyperliquid leaderboard — ${T.length} accounts with complete windows (of ${rows.length})`);
console.log('='.repeat(88));

// --- 1. how many make money at all? --------------------------------------
const up = T.filter((t) => t.a.pnl > 0);
console.log(`\n--- 1. all-time outcomes ---`);
console.log(`  profitable all-time : ${up.length} (${(100 * up.length / T.length).toFixed(1)}%)`);
console.log(`  total PnL across everyone: ${usd(sum(T.map((t) => t.a.pnl)))}`);
const pos = T.filter((t) => t.a.pnl > 0).map((t) => t.a.pnl).sort((x, y) => y - x);
const totUp = sum(pos);
let acc = 0, k = 0;
for (const p of pos) { acc += p; k++; if (acc >= 0.8 * totUp) break; }
console.log(`  80% of all profit is held by ${k} accounts — ${(100 * k / T.length).toFixed(2)}% of traders`);
console.log(`  median all-time PnL: ${usd(q(T.map((t) => t.a.pnl), 0.5))}   p90 ${usd(q(T.map((t) => t.a.pnl), 0.9))}   p99 ${usd(q(T.map((t) => t.a.pnl), 0.99))}`);

// --- 2. THE PERSISTENCE TEST ---------------------------------------------
// Only accounts that actually traded in both periods can be tested.
const act = T.filter((t) => t.earlierVlm > 10000 && t.m.vlm > 10000);
console.log(`\n--- 2. does past performance predict future? ---`);
console.log(`  ${act.length} accounts traded meaningfully in BOTH the earlier period and the last month`);

const byEarlier = act.slice().sort((a, b) => b.earlier - a.earlier);
const dec = Math.floor(byEarlier.length / 10);
console.log('\n  ranked by PnL BEFORE the last month, then their PnL DURING it:');
console.log('  decile (by past)   n     median past PnL    median month PnL   % up in month   mean month ROI');
for (let i = 0; i < 10; i++) {
  const g = byEarlier.slice(i * dec, (i + 1) * dec);
  if (!g.length) continue;
  const label = i === 0 ? 'top 10%' : i === 9 ? 'bottom 10%' : `${i * 10}-${(i + 1) * 10}%`;
  console.log(`  ${label.padEnd(18)} ${String(g.length).padStart(4)}  ${usd(q(g.map((t) => t.earlier), 0.5)).padStart(14)}   ${usd(q(g.map((t) => t.m.pnl), 0.5)).padStart(16)}   ${(100 * g.filter((t) => t.m.pnl > 0).length / g.length).toFixed(1).padStart(11)}%   ${(100 * mean(g.map((t) => t.m.roi))).toFixed(2).padStart(12)}%`);
}

// Spearman rank correlation between the two disjoint periods.
const rank = (arr, key) => {
  const idx = arr.map((t, i) => [key(t), i]).sort((a, b) => a[0] - b[0]);
  const r = new Array(arr.length);
  idx.forEach(([, i], p) => { r[i] = p; });
  return r;
};
const ra = rank(act, (t) => t.earlier), rb = rank(act, (t) => t.m.pnl);
const n = act.length;
const mra = mean(ra), mrb = mean(rb);
let cov = 0, va = 0, vb = 0;
for (let i = 0; i < n; i++) { const x = ra[i] - mra, y = rb[i] - mrb; cov += x * y; va += x * x; vb += y * y; }
const rho = cov / Math.sqrt(va * vb);
console.log(`\n  Spearman rank correlation, past PnL vs month PnL: ${rho.toFixed(3)}`);
console.log(`  (0 = past tells you nothing. 1 = past fully determines future.)`);

// Same on ROI, which removes account size as a confound.
const ra2 = rank(act, (t) => (t.a.roi - t.m.roi)), rb2 = rank(act, (t) => t.m.roi);
const m1 = mean(ra2), m2 = mean(rb2);
let c2 = 0, v1 = 0, v2 = 0;
for (let i = 0; i < n; i++) { const x = ra2[i] - m1, y = rb2[i] - m2; c2 += x * y; v1 += x * x; v2 += y * y; }
console.log(`  Spearman on ROI instead of dollars:                ${(c2 / Math.sqrt(v1 * v2)).toFixed(3)}`);

// --- 3. does trading MORE help? ------------------------------------------
console.log(`\n--- 3. outcome by how much they trade (all-time) ---`);
console.log('  volume band        accounts   % profitable   median PnL      median ROI');
for (const [lo, hi, label] of [[0, 1e5, '<$100k'], [1e5, 1e6, '$100k-1M'], [1e6, 1e7, '$1M-10M'], [1e7, 1e8, '$10M-100M'], [1e8, 1e9, '$100M-1B'], [1e9, 1e15, '>$1B']]) {
  const g = T.filter((t) => t.a.vlm > lo && t.a.vlm <= hi);
  if (g.length < 50) continue;
  console.log(`  ${label.padEnd(18)} ${String(g.length).padStart(7)}   ${(100 * g.filter((t) => t.a.pnl > 0).length / g.length).toFixed(1).padStart(11)}%   ${usd(q(g.map((t) => t.a.pnl), 0.5)).padStart(11)}   ${(100 * q(g.map((t) => t.a.roi), 0.5)).toFixed(2).padStart(12)}%`);
}

// --- 4. does account size help? ------------------------------------------
console.log(`\n--- 4. outcome by account size ---`);
console.log('  account value      accounts   % profitable   median ROI');
for (const [lo, hi, label] of [[0, 1e3, '<$1k'], [1e3, 1e4, '$1k-10k'], [1e4, 1e5, '$10k-100k'], [1e5, 1e6, '$100k-1M'], [1e6, 1e15, '>$1M']]) {
  const g = T.filter((t) => t.av > lo && t.av <= hi);
  if (g.length < 50) continue;
  console.log(`  ${label.padEnd(18)} ${String(g.length).padStart(7)}   ${(100 * g.filter((t) => t.a.pnl > 0).length / g.length).toFixed(1).padStart(11)}%   ${(100 * q(g.map((t) => t.a.roi), 0.5)).toFixed(2).padStart(10)}%`);
}

// --- 5. the top of the board, out of sample ------------------------------
// The single most useful sanity check: take the accounts that were most
// profitable BEFORE the last month and see how many stayed profitable.
const elite = byEarlier.slice(0, 100);
console.log(`\n--- 5. the 100 most profitable accounts before the last month ---`);
console.log(`  combined PnL before  : ${usd(sum(elite.map((t) => t.earlier)))}`);
console.log(`  combined PnL during  : ${usd(sum(elite.map((t) => t.m.pnl)))}`);
console.log(`  stayed profitable    : ${elite.filter((t) => t.m.pnl > 0).length} of 100`);
console.log(`  median month ROI     : ${(100 * q(elite.map((t) => t.m.roi), 0.5)).toFixed(2)}%`);
const worst = byEarlier.slice(-100);
console.log(`  the 100 WORST before them: combined during ${usd(sum(worst.map((t) => t.m.pnl)))}, ${worst.filter((t) => t.m.pnl > 0).length} of 100 profitable`);
