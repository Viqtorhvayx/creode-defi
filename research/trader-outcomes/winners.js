// Who actually makes money trading a perp DEX, and what do they do differently?
//
// Gains publishes every settled trade with the trader's address, the market,
// the leverage, the size, the close reason and the realized PnL. That is an
// unusually complete record of a venue's whole population, and it answers a
// question that is normally unanswerable: not "what should you trade" but
// "what do the people who win here actually do".
//
// The honest hazard, stated first: 72 hours is their maximum history window,
// and over 72 hours a good trader and a lucky one look identical. So this
// deliberately does not crown winners. It compares the TOP and BOTTOM groups on
// behaviour that is stable within a session — leverage, holding time, market
// choice, order type, how trades end — and reports only differences large
// enough to survive the sample being short.
const fs = require('fs');
const S = __dirname;
const rd = (f) => { try { const j = JSON.parse(fs.readFileSync(`${S}/${f}`, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } };
const rows = [...rd('th72_arb.json'), ...rd('th72_base.json')];

const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
const sum = (a) => a.reduce((s, x) => s + x, 0);
const mean = (a) => (a.length ? sum(a) / a.length : NaN);
const usd = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

const OPENS = new Set(['TradeOpenedMarket', 'TradeOpenedLimit']);
const CLOSES = new Set(['TradeClosedMarket', 'TradeClosedLIQ', 'TradeClosedTP', 'TradeClosedSL']);

// --- match opens to closes so holding time is real, not assumed -----------
// A position is keyed by address + collateral + trade index; Gains reuses
// tradeIndex per address, so the open is the most recent unmatched one.
const open = new Map();
const trades = [];
const asc = rows.slice().sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
for (const r of asc) {
  const key = `${r.address}|${r.collateralIndex}|${r.tradeIndex}`;
  if (OPENS.has(r.action)) { open.set(key, r); continue; }
  if (!CLOSES.has(r.action)) continue;
  const o = open.get(key);
  const c = Number(r.collateralPriceUsd) || 1;
  const pnl = Number(r.pnl_net) * c;
  if (!Number.isFinite(pnl)) continue;
  trades.push({
    addr: r.address,
    pair: r.pair,
    long: Number(r.long) === 1,
    lev: Number(o?.leverage ?? r.leverage) || null,
    size: (Number(o?.size ?? r.size) || 0) * c,
    pnl,
    how: r.action,
    viaLimit: o?.action === 'TradeOpenedLimit',
    heldMs: o ? Date.parse(r.date) - Date.parse(o.date) : null,
  });
  open.delete(key);
}

console.log(`\n${'='.repeat(88)}`);
console.log(`Gains, 72h — ${rows.length} events, ${trades.length} round trips matched open-to-close`);
console.log(`${asc[0]?.date} .. ${asc[asc.length - 1]?.date}`);
console.log('='.repeat(88));

// --- the population -------------------------------------------------------
const byAddr = new Map();
for (const t of trades) {
  const e = byAddr.get(t.addr) || { n: 0, pnl: 0, wins: 0, vol: 0, t: [] };
  e.n++; e.pnl += t.pnl; e.vol += t.size; if (t.pnl > 0) e.wins++;
  e.t.push(t);
  byAddr.set(t.addr, e);
}
const addrs = [...byAddr.entries()].map(([a, e]) => ({ addr: a, ...e }));
console.log(`\n--- the population ---`);
console.log(`  ${addrs.length} addresses traded. Net across all of them: ${usd(sum(addrs.map((a) => a.pnl)))}`);
const prof = addrs.filter((a) => a.pnl > 0);
console.log(`  ${prof.length} finished up (${(100 * prof.length / addrs.length).toFixed(1)}%), ${addrs.length - prof.length} finished down`);
console.log(`  PnL is top-heavy: the best address made ${usd(Math.max(...addrs.map((a) => a.pnl)))}, the worst ${usd(Math.min(...addrs.map((a) => a.pnl)))}`);

// Concentration: how much of all profit comes from how few addresses?
const sorted = addrs.slice().sort((a, b) => b.pnl - a.pnl);
const totalUp = sum(sorted.filter((a) => a.pnl > 0).map((a) => a.pnl));
let acc = 0, k = 0;
for (const a of sorted) { if (a.pnl <= 0) break; acc += a.pnl; k++; if (acc >= 0.8 * totalUp) break; }
console.log(`  80% of all winnings went to ${k} addresses (${(100 * k / addrs.length).toFixed(1)}% of traders)`);

// --- serious participants only -------------------------------------------
// One trade says nothing. Require enough round trips that behaviour is visible.
const MIN = 8;
const ser = addrs.filter((a) => a.n >= MIN).sort((a, b) => b.pnl - a.pnl);
console.log(`\n--- traders with ${MIN}+ round trips: ${ser.length} addresses, ${sum(ser.map((a) => a.n))} trades ---`);
const cut = Math.max(5, Math.floor(ser.length * 0.2));
const top = ser.slice(0, cut), bot = ser.slice(-cut);
const flat = (g) => g.flatMap((a) => a.t);
const T = flat(top), B = flat(bot);
console.log(`  comparing the top ${cut} (${usd(sum(top.map((a) => a.pnl)))} combined) with the bottom ${cut} (${usd(sum(bot.map((a) => a.pnl)))})`);

const row = (label, fT, fB, fmt = (x) => x.toFixed(2)) => {
  const a = T.map(fT).filter((x) => Number.isFinite(x));
  const b = B.map(fB ?? fT).filter((x) => Number.isFinite(x));
  console.log(`  ${label.padEnd(30)} ${fmt(mean(a)).padStart(12)}   ${fmt(mean(b)).padStart(12)}`);
};
console.log(`\n  ${'behaviour'.padEnd(30)} ${'TOP'.padStart(12)}   ${'BOTTOM'.padStart(12)}`);
row('leverage used (mean)', (t) => t.lev);
row('position size $ (mean)', (t) => t.size, null, usd);
row('hold time, minutes (mean)', (t) => (t.heldMs != null ? t.heldMs / 60000 : NaN));
console.log(`  ${'hold time, minutes (median)'.padEnd(30)} ${q(T.map((t) => t.heldMs / 60000).filter(Number.isFinite), 0.5).toFixed(1).padStart(12)}   ${q(B.map((t) => t.heldMs / 60000).filter(Number.isFinite), 0.5).toFixed(1).padStart(12)}`);
const pct = (g, f) => (100 * g.filter(f).length / g.length);
const cmp = (label, f) => console.log(`  ${label.padEnd(30)} ${(pct(T, f).toFixed(1) + '%').padStart(12)}   ${(pct(B, f).toFixed(1) + '%').padStart(12)}`);
cmp('win rate', (t) => t.pnl > 0);
cmp('opened with a limit order', (t) => t.viaLimit);
cmp('ended in liquidation', (t) => t.how === 'TradeClosedLIQ');
cmp('ended on a stop loss', (t) => t.how === 'TradeClosedSL');
cmp('ended on a take profit', (t) => t.how === 'TradeClosedTP');
cmp('closed manually', (t) => t.how === 'TradeClosedMarket');
cmp('went long', (t) => t.long);
cmp('leverage over 50x', (t) => t.lev > 50);
cmp('held under 5 minutes', (t) => t.heldMs != null && t.heldMs < 300000);
cmp('held over 4 hours', (t) => t.heldMs != null && t.heldMs > 4 * 3600e3);

// The asymmetry that actually decides a PnL curve.
const avgWin = (g) => mean(g.filter((t) => t.pnl > 0).map((t) => t.pnl));
const avgLoss = (g) => mean(g.filter((t) => t.pnl < 0).map((t) => t.pnl));
console.log(`\n  ${'average winning trade'.padEnd(30)} ${usd(avgWin(T)).padStart(12)}   ${usd(avgWin(B)).padStart(12)}`);
console.log(`  ${'average losing trade'.padEnd(30)} ${usd(avgLoss(T)).padStart(12)}   ${usd(avgLoss(B)).padStart(12)}`);
console.log(`  ${'win/loss size ratio'.padEnd(30)} ${(avgWin(T) / -avgLoss(T)).toFixed(2).padStart(12)}   ${(avgWin(B) / -avgLoss(B)).toFixed(2).padStart(12)}`);

// --- does leverage help or hurt, across everyone? ------------------------
console.log(`\n--- outcome by leverage bucket, all ${trades.length} round trips ---`);
console.log('  leverage        trades    win rate   mean PnL    total PnL');
for (const [lo, hi] of [[0, 5], [5, 10], [10, 25], [25, 50], [50, 100], [100, 1e9]]) {
  const g = trades.filter((t) => t.lev > lo && t.lev <= hi);
  if (g.length < 30) continue;
  const label = hi > 1e8 ? `${lo}x+` : `${lo}-${hi}x`;
  console.log(`  ${label.padEnd(14)} ${String(g.length).padStart(6)}   ${(100 * g.filter((t) => t.pnl > 0).length / g.length).toFixed(1).padStart(7)}%  ${usd(mean(g.map((t) => t.pnl))).padStart(9)}  ${usd(sum(g.map((t) => t.pnl))).padStart(11)}`);
}

// --- does holding longer help? -------------------------------------------
console.log(`\n--- outcome by holding time, all matched round trips ---`);
console.log('  held            trades    win rate   mean PnL    total PnL');
for (const [lo, hi, label] of [[0, 60e3, 'under 1 min'], [60e3, 300e3, '1-5 min'], [300e3, 1800e3, '5-30 min'], [1800e3, 7200e3, '30min-2h'], [7200e3, 86400e3, '2-24h'], [86400e3, 1e12, 'over 24h']]) {
  const g = trades.filter((t) => t.heldMs != null && t.heldMs > lo && t.heldMs <= hi);
  if (g.length < 30) continue;
  console.log(`  ${label.padEnd(14)} ${String(g.length).padStart(6)}   ${(100 * g.filter((t) => t.pnl > 0).length / g.length).toFixed(1).padStart(7)}%  ${usd(mean(g.map((t) => t.pnl))).padStart(9)}  ${usd(sum(g.map((t) => t.pnl))).padStart(11)}`);
}

// --- which markets pay the people trading them? --------------------------
console.log(`\n--- market outcomes (20+ round trips) ---`);
console.log('  pair            trades   win rate    total PnL   mean lev');
const byPair = {};
for (const t of trades) (byPair[t.pair] ||= []).push(t);
Object.entries(byPair).filter(([, g]) => g.length >= 20)
  .sort((a, b) => sum(b[1].map((t) => t.pnl)) - sum(a[1].map((t) => t.pnl)))
  .slice(0, 14)
  .forEach(([p, g]) => console.log(`  ${p.padEnd(15)} ${String(g.length).padStart(5)}   ${(100 * g.filter((t) => t.pnl > 0).length / g.length).toFixed(1).padStart(7)}%  ${usd(sum(g.map((t) => t.pnl))).padStart(11)}   ${mean(g.map((t) => t.lev).filter(Number.isFinite)).toFixed(0).padStart(6)}x`));
