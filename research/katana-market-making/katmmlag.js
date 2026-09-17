// Does market making Katana pay?
//
// Per unit of maker volume you earn:      half the spread
//                        you pay:         the maker fee
//                        you lose:        adverse selection
//
// ADVERSE SELECTION is measured from the venue's own prints. Every fill carries
// `makerSide`. If makerSide is "sell", a taker lifted the maker's ask and the
// maker is now short — so a rising mid afterwards is a loss. Average that move,
// signed against the maker, and you have the cost that does not appear in any
// fee table and sinks most market-making ideas.
//
// A nuance worth watching for: uninformed flow (bots farming volume rewards)
// carries near-zero adverse selection, which is exactly what a maker wants. So
// a venue full of wash volume can be a BETTER place to quote, not a worse one.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const rows = fs.readFileSync(`${S}/katmm.jsonl`, 'utf8').split('\n').filter(Boolean)
  .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);

const MAKER_BP = 0.0000475 * 1e4;   // 0.475bp per side
const HORIZONS = [2000, 5000, 15000, 30000];

const books = {}, fills = {};
for (const r of rows) {
  if (r.k === 'book') (books[r.m] ||= []).push(r);
  else if (r.k === 'fill') (fills[r.m] ||= []).push(r);
}
for (const m of Object.keys(books)) books[m].sort((a, b) => a.t - b.t);

const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);

function midAt(m, t) {
  const b = books[m];
  if (!b || !b.length || t < b[0].t || t > b[b.length - 1].t) return NaN;
  let lo = 0, hi = b.length - 1;
  while (lo < hi) { const k = (lo + hi + 1) >> 1; if (b[k].t <= t) lo = k; else hi = k - 1; }
  return (b[lo].bid + b[lo].ask) / 2;
}

console.log(`\n${'='.repeat(92)}`);
console.log('Katana market making — spread capture vs fees vs adverse selection');
console.log('='.repeat(92));
console.log('\nmarket      fills  spread_bp  halfSpr  fee   advSel@5s  advSel@30s   NET per $ maker volume');

const summary = [];
for (const m of Object.keys(books).sort()) {
  const bk = books[m], fl = (fills[m] || []).filter((f) => Number.isFinite(f.t));
  if (!bk.length) continue;
  const spreads = bk.map((r) => 1e4 * (r.ask - r.bid) / ((r.ask + r.bid) / 2));
  const sp = med(spreads);

  const adv = {};
  for (const h of HORIZONS) {
    const vals = [];
    for (const f of fl) {
      const m0 = midAt(m, f.t), m1 = midAt(m, f.t + h);
      if (!Number.isFinite(m0) || !Number.isFinite(m1) || m0 <= 0) continue;
      // makerSide 'sell' => maker is short => a rising mid hurts them
      const dir = f.makerSide === 'sell' ? 1 : -1;
      vals.push(dir * 1e4 * (m1 - m0) / m0);
    }
    adv[h] = vals.length >= 8 ? mean(vals) : NaN;
  }

  const half = sp / 2;
  const a5 = adv[5000], a30 = adv[30000];
  const net = Number.isFinite(a30) ? half - MAKER_BP - a30 : NaN;
  summary.push({ m, sp, half, a5, a30, net, n: fl.length });
  console.log(`${m.padEnd(11)} ${String(fl.length).padStart(5)}  ${sp.toFixed(2).padStart(8)}  ` +
    `${half.toFixed(2).padStart(7)}  ${MAKER_BP.toFixed(2)}  ${(Number.isFinite(a5) ? a5.toFixed(2) : '  n/a').padStart(9)}  ` +
    `${(Number.isFinite(a30) ? a30.toFixed(2) : '  n/a').padStart(10)}   ${(Number.isFinite(net) ? (net >= 0 ? '+' : '') + net.toFixed(2) + 'bp' : 'n/a').padStart(9)}`);
}

// --- is the flow informed or is it wash volume? ---
console.log('\n--- what kind of flow is this? ---');
console.log('market      trades  median$  p90$   size spread   arrival regularity   read');
for (const m of Object.keys(fills).sort()) {
  const fl = fills[m];
  if (fl.length < 12) continue;
  const usd = fl.map((f) => f.usd).sort((a, b) => a - b);
  const q = (p) => usd[Math.floor(usd.length * p)];
  const ratio = q(0.9) / (q(0.1) || 1);
  const ts = fl.map((f) => f.t).sort((a, b) => a - b);
  const gaps = []; for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > 0) gaps.push(ts[i] - ts[i - 1]);
  const gm = med(gaps), gsd = Math.sqrt(mean(gaps.map((g) => (g - mean(gaps)) ** 2)));
  const cv = gsd / (mean(gaps) || 1);
  // real retail flow is fat-tailed in size and bursty in time
  const read = ratio < 2.5 && usd.length > 20 ? 'uniform sizes — looks like reward farming' : 'varied — looks organic';
  console.log(`${m.padEnd(11)} ${String(fl.length).padStart(6)}  ${q(0.5).toFixed(0).padStart(7)}  ${q(0.9).toFixed(0).padStart(5)}  ` +
    `${ratio.toFixed(1).padStart(6)}x   ${(gm / 1000).toFixed(1).padStart(6)}s  cv ${cv.toFixed(2).padStart(5)}   ${read}`);
}

console.log('\n(NET is per dollar of maker volume: half the spread, minus the maker fee,');
console.log(' minus adverse selection at 30s. Positive means quoting made money on these');
console.log(' fills. It excludes inventory risk, latency, and the cost of being picked off');
console.log(' during a move you could not cancel into.)');
