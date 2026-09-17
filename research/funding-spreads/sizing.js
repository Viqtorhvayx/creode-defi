// What does the carry trade actually cost to put on and take off, at size?
//
// The funding spread is only half the trade. The other half is that you must
// cross two books to enter and two to exit, and one of those books may be thin.
// This walks the real order books and prices the full round trip, so the carry
// can be compared against what it costs to capture it.
const LEGS = {
  hyperliquid: async () => {
    const r = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'l2Book', coin: 'BTC' }),
    });
    const d = await r.json();
    return {
      bids: d.levels[0].map((l) => [Number(l.px), Number(l.sz)]),
      asks: d.levels[1].map((l) => [Number(l.px), Number(l.sz)]),
    };
  },
  dydx: async () => {
    const d = await (await fetch('https://indexer.dydx.trade/v4/orderbooks/perpetualMarket/BTC-USD')).json();
    return {
      bids: d.bids.map((l) => [Number(l.price), Number(l.size)]).sort((a, b) => b[0] - a[0]),
      asks: d.asks.map((l) => [Number(l.price), Number(l.size)]).sort((a, b) => a[0] - b[0]),
    };
  },
  backpack: async () => {
    const d = await (await fetch('https://api.backpack.exchange/api/v1/depth?symbol=BTC_USDC_PERP')).json();
    return {
      bids: d.bids.map((l) => [Number(l[0]), Number(l[1])]).sort((a, b) => b[0] - a[0]),
      asks: d.asks.map((l) => [Number(l[0]), Number(l[1])]).sort((a, b) => a[0] - b[0]),
    };
  },
  extended: async () => {
    const d = await (await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD/orderbook')).json();
    const b = d?.data?.bid ?? [], a = d?.data?.ask ?? [];
    return {
      bids: b.map((l) => [Number(l.price), Number(l.qty)]).sort((x, y) => y[0] - x[0]),
      asks: a.map((l) => [Number(l.price), Number(l.qty)]).sort((x, y) => x[0] - y[0]),
    };
  },
};

/** VWAP slippage in bp for trading `usd` notional against one side. */
function slip(levels, usd, mid) {
  let need = usd, cost = 0, got = 0;
  for (const [px, sz] of levels) {
    const avail = px * sz;
    const take = Math.min(avail, need);
    cost += take; got += take / px; need -= take;
    if (need <= 0) break;
  }
  if (need > 0) return null;                    // book cannot absorb it
  const vwap = cost / got;
  return 1e4 * Math.abs(vwap - mid) / mid;
}

(async () => {
  const books = {};
  for (const [n, f] of Object.entries(LEGS)) {
    try { books[n] = await f(); } catch (e) { console.log(`-- ${n}: ${e.message}`); }
  }
  const SIZES = [10e3, 25e3, 50e3, 100e3, 250e3, 500e3];
  console.log('\nRound-trip slippage by notional (VWAP vs mid, basis points)\n');
  console.log('venue          side      $10k   $25k   $50k  $100k  $250k  $500k');
  for (const [n, b] of Object.entries(books)) {
    if (!b.bids.length || !b.asks.length) continue;
    const mid = (b.bids[0][0] + b.asks[0][0]) / 2;
    for (const [label, side] of [['buy (asks)', b.asks], ['sell (bids)', b.bids]]) {
      const cells = SIZES.map((s) => {
        const v = slip(side, s, mid);
        return (v == null ? 'n/a' : v.toFixed(1)).padStart(6);
      });
      console.log(`${n.padEnd(14)} ${label.padEnd(11)} ${cells.join(' ')}`);
    }
  }

  console.log('\n\nFull cost of the carry trade: short Hyperliquid + long dYdX\n');
  console.log('(enter: sell HL + buy dYdX. exit: buy HL + sell dYdX. fees on top.)\n');
  console.log(' notional   HL sell  dYdX buy   HL buy  dYdX sell   slippage  +fees   breakeven');
  console.log('                                                    total    (20bp)     days');
  const hl = books.hyperliquid, dy = books.dydx;
  if (hl && dy) {
    const hlMid = (hl.bids[0][0] + hl.asks[0][0]) / 2;
    const dyMid = (dy.bids[0][0] + dy.asks[0][0]) / 2;
    const CARRY_ANNUAL = 0.1054;               // measured HL-dYdX spread, 30 days
    const carryPerDay = CARRY_ANNUAL / 365;
    for (const s of SIZES) {
      const a = slip(hl.bids, s, hlMid), b = slip(dy.asks, s, dyMid);
      const c = slip(hl.asks, s, hlMid), d = slip(dy.bids, s, dyMid);
      const parts = [a, b, c, d];
      const cells = parts.map((v) => (v == null ? '  n/a' : v.toFixed(1).padStart(5)));
      if (parts.some((v) => v == null)) {
        console.log(`$${(s / 1000).toFixed(0).padStart(4)}k     ${cells.join('    ')}       — book too thin to exit —`);
        continue;
      }
      const totalBp = parts.reduce((x, y) => x + y, 0);
      const withFees = totalBp + 20;
      const days = (withFees / 1e4) / carryPerDay;
      console.log(`$${(s / 1000).toFixed(0).padStart(4)}k     ${cells.join('    ')}    ${totalBp.toFixed(1).padStart(6)}  ${withFees.toFixed(1).padStart(6)}   ${days.toFixed(1).padStart(7)}`);
    }
  }
})();
