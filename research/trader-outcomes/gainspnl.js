// Who actually makes money on Gains, and from what?
//
// Latency is settled: their oracle trails by 150-300ms against an 8bp round
// trip, so there is nothing to take there. The remaining question is whether
// anything else on the venue pays, and their own settled-trade history answers
// it directly — every close carries realized PnL, the fees that were charged,
// the funding and borrowing that accrued, and the price impact that was applied.
//
// Aggregating it says three things at once:
//   1. do traders as a group win or lose (i.e. is the VAULT side the paid side)
//   2. what the fee and funding drag actually is per trade
//   3. whether skew price impact PAYS the side that balances the book, which
//      would be an edge that has nothing to do with speed
const fs = require('fs');
const S = __dirname;
const rd = (f) => { try { const j = JSON.parse(fs.readFileSync(`${S}/${f}`, 'utf8')); return Array.isArray(j) ? j : []; } catch { return []; } };
const rows = [...rd('th_42161.json'), ...rd('th_8453.json')];

const q = (a, f) => (a.length ? a.slice().sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor(a.length * f))] : NaN);
const sum = (a) => a.reduce((s, x) => s + x, 0);
const usd = (n) => (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

console.log(`\n${'='.repeat(84)}`);
console.log(`Gains settled trades, 24h — ${rows.length} events across Arbitrum and Base`);
console.log(`${rows[rows.length - 1]?.date} .. ${rows[0]?.date}`);
console.log('='.repeat(84));

const byAction = {};
for (const r of rows) byAction[r.action] = (byAction[r.action] || 0) + 1;
console.log('\nevent types:');
Object.entries(byAction).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k.padEnd(26)} ${v}`));

// --- 1. do traders win or lose? -----------------------------------------
// pnl_net is realized on closing events, denominated in collateral. Collateral
// is a stablecoin on every market here, and collateralPriceUsd is carried on
// each row, so it converts cleanly.
const CLOSES = new Set(['TradeClosedMarket', 'TradeClosedLIQ', 'TradeClosedTP', 'TradeClosedSL', 'TradePosSizeDecrease']);
const closes = rows.filter((r) => CLOSES.has(r.action) && Number.isFinite(Number(r.pnl_net)));
const pnl = closes.map((r) => Number(r.pnl_net) * (Number(r.collateralPriceUsd) || 1));
const winners = pnl.filter((x) => x > 0), losers = pnl.filter((x) => x < 0);

console.log(`\n--- 1. trader PnL over 24h (${closes.length} closing events) ---`);
console.log(`  total realized by traders : ${usd(sum(pnl))}`);
console.log(`  won ${winners.length} (${(100 * winners.length / pnl.length).toFixed(1)}%) totalling ${usd(sum(winners))}`);
console.log(`  lost ${losers.length} (${(100 * losers.length / pnl.length).toFixed(1)}%) totalling ${usd(sum(losers))}`);
console.log(`  median ${usd(q(pnl, 0.5))}   p10 ${usd(q(pnl, 0.1))}   p90 ${usd(q(pnl, 0.9))}`);
console.log(`  ${sum(pnl) < 0 ? 'Traders lost in aggregate, so the VAULT was the paid side.' : 'Traders won in aggregate, so the vault paid out.'}`);

// by close reason — liquidations are where the vault earns most
console.log('\n  by close reason:');
for (const a of ['TradeClosedMarket', 'TradeClosedLIQ', 'TradeClosedTP', 'TradeClosedSL', 'TradePosSizeDecrease']) {
  const g = closes.filter((r) => r.action === a).map((r) => Number(r.pnl_net) * (Number(r.collateralPriceUsd) || 1));
  if (!g.length) continue;
  console.log(`    ${a.padEnd(22)} n=${String(g.length).padStart(5)}  total ${usd(sum(g)).padStart(12)}  median ${usd(q(g, 0.5))}`);
}

// --- 2. what the drag actually is ---------------------------------------
const fees = [], fund = [], borrow = [];
for (const r of closes) {
  const u = r.meta?.uiRealizedPnlData; if (!u) continue;
  const c = Number(r.collateralPriceUsd) || 1;
  if (Number.isFinite(Number(u.realizedTradingFeesCollateral))) fees.push(Number(u.realizedTradingFeesCollateral) * c);
  if (Number.isFinite(Number(u.realizedFundingFeesCollateral))) fund.push(Number(u.realizedFundingFeesCollateral) * c);
  const b = Number(u.realizedNewBorrowingFeesCollateral || 0) + Number(u.realizedOldBorrowingFeesCollateral || 0);
  if (Number.isFinite(b)) borrow.push(b * c);
}
console.log(`\n--- 2. what traders paid (${fees.length} closes carrying a fee breakdown) ---`);
console.log(`  trading fees : ${usd(sum(fees))}   median per close ${usd(q(fees, 0.5))}`);
console.log(`  funding      : ${usd(sum(fund))}   median ${usd(q(fund, 0.5))}   (negative = trader PAID)`);
console.log(`  borrowing    : ${usd(sum(borrow))}  median ${usd(q(borrow, 0.5))}`);
console.log(`  Fees alone are ${(100 * Math.abs(sum(fees)) / Math.abs(sum(losers) || 1)).toFixed(0)}% the size of all trader losses.`);

// --- 3. does balancing the skew pay? ------------------------------------
// Gains applies a skew price impact on entry: if your side reduces the
// imbalance the price improves, if it worsens it the price gets worse. A
// negative skewPriceImpactP on a trade means it was improved. If the
// improvement is systematically available on the light side, that is an edge
// with nothing to do with speed — you are being paid to provide balance.
const OPENS = new Set(['TradeOpenedMarket', 'TradeOpenedLimit', 'TradePosSizeIncrease']);
const skew = [], cumul = [], tot = [];
for (const r of rows) {
  if (!OPENS.has(r.action)) continue;
  const p = r.meta?.priceImpact; if (!p) continue;
  if (Number.isFinite(Number(p.skewPriceImpactP))) skew.push(Number(p.skewPriceImpactP) * 1e4);
  if (Number.isFinite(Number(p.cumulVolPriceImpactP))) cumul.push(Number(p.cumulVolPriceImpactP) * 1e4);
  if (Number.isFinite(Number(p.totalPriceImpactP))) tot.push(Number(p.totalPriceImpactP) * 1e4);
}
console.log(`\n--- 3. price impact on entry, in bp (${skew.length} opening events) ---`);
const show = (n, a) => console.log(`  ${n.padEnd(16)} p10 ${q(a, 0.1).toFixed(2).padStart(7)}  median ${q(a, 0.5).toFixed(2).padStart(7)}  p90 ${q(a, 0.9).toFixed(2).padStart(7)}  favourable ${(100 * a.filter((x) => x < 0).length / a.length).toFixed(0)}%`);
show('skew impact', skew);
show('cumulative vol', cumul);
show('total impact', tot);
console.log('  (negative = the price moved IN the trader\'s favour)');

// --- 4. where the volume is ---------------------------------------------
const byPair = {};
for (const r of closes) {
  const c = Number(r.collateralPriceUsd) || 1;
  const e = (byPair[r.pair] ||= { n: 0, pnl: 0, size: 0 });
  e.n++; e.pnl += Number(r.pnl_net) * c; e.size += Number(r.size || 0) * c;
}
console.log('\n--- 4. biggest markets by closes, and who won them ---');
console.log('pair            closes   trader PnL     notional');
Object.entries(byPair).sort((a, b) => b[1].n - a[1].n).slice(0, 10)
  .forEach(([p, e]) => console.log(`${p.padEnd(15)} ${String(e.n).padStart(5)}  ${usd(e.pnl).padStart(12)}  ${usd(e.size).padStart(12)}`));

// --- 5. counter-trade, which Gains exposes directly ---------------------
const ct = rows.filter((r) => Number(r.isCounterTrade) === 1);
console.log(`\n--- 5. counter-trade events: ${ct.length} of ${rows.length}`);
if (ct.length) {
  const cp = ct.filter((r) => Number.isFinite(Number(r.pnl_net))).map((r) => Number(r.pnl_net) * (Number(r.collateralPriceUsd) || 1));
  if (cp.length) console.log(`  realized PnL on counter-trades: ${usd(sum(cp))} over ${cp.length} closes, median ${usd(q(cp, 0.5))}`);
}
