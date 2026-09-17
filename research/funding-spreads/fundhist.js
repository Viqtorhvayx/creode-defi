// Pull settled funding history from every perp DEX that exposes it, normalise
// everything to a single unit, and align it on an hourly grid.
//
// NORMALISATION IS THE WHOLE JOB. Three traps, all of which silently produce a
// spectacular fake spread:
//   1. INTERVAL. Some venues settle hourly, some every 8 hours. Comparing an 8h
//      rate against an hourly one overstates it by 8x. Every interval below is
//      confirmed from the spacing of the venue's own settlement timestamps, not
//      from docs.
//   2. UNITS. Lighter and GRVT quote PERCENT; everyone else quotes a fraction.
//      That is a 100x error. Lighter's own `value` field confirms it: a rate of
//      0.0010 on a ~$76k position pays $0.77, which is 0.001% not 0.1%.
//      GRVT states funding_interval_hours inline and quotes percent alongside.
//   3. SIGN. Lighter reports magnitude plus a `direction`, not a signed rate.
//
// Output: everything as an HOURLY FRACTION, positive meaning longs pay shorts.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const DAY = 86400000;
const SINCE = Date.now() - 30 * DAY;
const SYM = process.env.SYM || 'BTC';

// Per-venue symbol naming
const P = {
  hyperliquid: SYM, binance: `${SYM}USDT`, aster: `${SYM}USDT`, okx: `${SYM}-USDT-SWAP`,
  dydx: `${SYM}-USD`, backpack: `${SYM}_USDC_PERP`, paradex: `${SYM}-USD-PERP`,
  orderly: `PERP_${SYM}_USDC`, aevo: `${SYM}-PERP`, apex: `${SYM}-USDT`,
  extended: `${SYM}-USD`, grvt: `${SYM}_USDT_Perp`,
};
const LIGHTER_MARKET = { BTC: 1, ETH: 0, SOL: 2 };

async function j(url, opts) {
  const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
const post = (url, body) => j(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// Each loader returns [{ t, hourly }] where hourly is a signed fraction per hour.
const LOADERS = {
  // --- hourly venues: rate used as-is ---
  hyperliquid: async () => (await post('https://api.hyperliquid.xyz/info',
    { type: 'fundingHistory', coin: P.hyperliquid, startTime: SINCE }))
    .map((r) => ({ t: r.time, hourly: Number(r.fundingRate) })),

  dydx: async () => {
    const out = [];
    let before = null;
    for (let page = 0; page < 6; page++) {
      const u = `https://indexer.dydx.trade/v4/historicalFunding/${P.dydx}?limit=200` +
        (before ? `&effectiveBeforeOrAt=${encodeURIComponent(before)}` : '');
      const d = await j(u);
      const rows = d.historicalFunding || [];
      if (!rows.length) break;
      for (const r of rows) out.push({ t: Date.parse(r.effectiveAt), hourly: Number(r.rate) });
      before = rows[rows.length - 1].effectiveAt;
      if (Date.parse(before) < SINCE) break;
    }
    return out;
  },

  backpack: async () => {
    const out = [];
    for (let off = 0; off < 800; off += 200) {
      const d = await j(`https://api.backpack.exchange/api/v1/fundingRates?symbol=${P.backpack}&limit=200&offset=${off}`);
      if (!d.length) break;
      for (const r of d) out.push({ t: Date.parse(r.intervalEndTimestamp + 'Z'), hourly: Number(r.fundingRate) });
      if (d.length < 200) break;
    }
    return out;
  },

  // aevo rejects large limits, so page backwards 50 settlements at a time
  aevo: async () => {
    const out = [];
    let end = Date.now();
    for (let page = 0; page < 20; page++) {
      const d = await j(`https://api.aevo.xyz/funding-history?instrument_name=${P.aevo}&start_time=${SINCE * 1e6}&end_time=${end * 1e6}&limit=50`);
      const rows = d.funding_history || [];
      if (!rows.length) break;
      for (const r of rows) out.push({ t: Number(r[1]) / 1e6, hourly: Number(r[2]) });
      const oldest = Math.min(...rows.map((r) => Number(r[1]) / 1e6));
      if (oldest <= SINCE || oldest >= end) break;
      end = oldest - 1;
    }
    return out;
  },

  apex: async () => {
    const out = [];
    for (let page = 0; page < 12; page++) {
      const d = await j(`https://omni.apex.exchange/api/v3/history-funding?symbol=${P.apex}&limit=100&page=${page}`);
      const rows = d?.data?.historyFunds || [];
      if (!rows.length) break;
      for (const r of rows) out.push({ t: Number(r.fundingTimestamp), hourly: Number(r.rate) });
      if (Math.min(...rows.map((r) => Number(r.fundingTimestamp))) <= SINCE) break;
    }
    return out;
  },

  extended: async () => (await j(`https://api.starknet.extended.exchange/api/v1/info/${P.extended}/funding?startTime=${SINCE}&endTime=${Date.now()}&limit=1000`))
    .data.map((r) => ({ t: Number(r.T), hourly: Number(r.f) })),

  hibachi: async () => (await j(`https://data-api.hibachi.xyz/market/data/funding-rates?symbol=${SYM}/USDT-P`))
    .data.map((r) => ({ t: Number(r.fundingTimestamp) * 1000, hourly: Number(r.fundingRate) })),

  // percent -> fraction, and the sign lives in `direction`
  lighter: async () => {
    const mid = LIGHTER_MARKET[SYM];
    if (mid == null) return [];
    const d = await j(`https://mainnet.zklighter.elliot.ai/api/v1/fundings?market_id=${mid}&resolution=1h&start_timestamp=${SINCE}&end_timestamp=${Date.now()}&count_back=720`);
    return (d.fundings || []).map((r) => ({
      t: Number(r.timestamp) * 1000,
      hourly: (Number(r.rate) / 100) * (String(r.direction).toLowerCase() === 'short' ? -1 : 1),
    }));
  },

  // --- 8-hourly venues: divide by 8 to get an hourly rate ---
  binance: async () => (await j(`https://www.binance.com/fapi/v1/fundingRate?symbol=${P.binance}&startTime=${SINCE}&limit=1000`))
    .map((r) => ({ t: r.fundingTime, hourly: Number(r.fundingRate) / 8, span: 8 })),

  aster: async () => (await j(`https://fapi.asterdex.com/fapi/v1/fundingRate?symbol=${P.aster}&startTime=${SINCE}&limit=1000`))
    .map((r) => ({ t: r.fundingTime, hourly: Number(r.fundingRate) / 8, span: 8 })),

  okx: async () => {
    const out = [];
    let before = Date.now();
    for (let page = 0; page < 6; page++) {
      const d = await j(`https://www.okx.com/api/v5/public/funding-rate-history?instId=${P.okx}&limit=100&before=&after=${before}`);
      const rows = d.data || [];
      if (!rows.length) break;
      for (const r of rows) out.push({ t: Number(r.fundingTime), hourly: Number(r.realizedRate ?? r.fundingRate) / 8, span: 8 });
      before = Number(rows[rows.length - 1].fundingTime);
      if (before < SINCE) break;
    }
    return out;
  },

  orderly: async () => (await j(`https://api.orderly.org/v1/public/funding_rate_history?symbol=${P.orderly}&page_size=500`))
    .data.rows.map((r) => ({ t: r.funding_rate_timestamp, hourly: Number(r.funding_rate) / 8, span: 8 })),

  // Paradex republishes funding every ~5 seconds rather than settling on a
  // schedule, so 30 days is hundreds of thousands of rows and out of reach.
  // Take a short recent window and label it as such — it is a snapshot of their
  // current rate, not a comparable 30-day mean.
  paradex: async () => {
    const out = [];
    let next = null;
    for (let page = 0; page < 40; page++) {
      const u = `https://api.prod.paradex.trade/v1/funding/data?market=${P.paradex}&page_size=200` + (next ? `&cursor=${encodeURIComponent(next)}` : '');
      const d = await j(u);
      const rows = d.results || [];
      if (!rows.length) break;
      for (const r of rows) {
        const hrs = Number(r.funding_period_hours) || 8;
        out.push({ t: Number(r.created_at), hourly: Number(r.funding_rate_8h) / hrs, span: hrs });
      }
      next = d.next;
      if (!next || out[out.length - 1].t < SINCE) break;
    }
    return out;
  },

  // percent AND 8-hourly
  grvt: async () => (await post('https://market-data.grvt.io/full/v1/funding', { instrument: P.grvt, limit: 500 }))
    .result.map((r) => {
      const hrs = Number(r.funding_interval_hours) || 8;
      return { t: Number(r.funding_time) / 1e6, hourly: (Number(r.funding_rate) / 100) / hrs, span: hrs };
    }),
};

(async () => {
  const out = {};
  for (const [name, fn] of Object.entries(LOADERS)) {
    try {
      let rows = (await fn()).filter((r) => Number.isFinite(r.t) && Number.isFinite(r.hourly) && r.t >= SINCE);
      rows.sort((a, b) => a.t - b.t);
      // dedupe by timestamp
      const seen = new Set();
      rows = rows.filter((r) => { const k = Math.round(r.t / 60000); if (seen.has(k)) return false; seen.add(k); return true; });
      if (rows.length < 5) { console.log(`-- ${name.padEnd(12)} only ${rows.length} rows`); continue; }
      const gaps = [];
      for (let i = 1; i < rows.length; i++) gaps.push(rows[i].t - rows[i - 1].t);
      gaps.sort((a, b) => a - b);
      const medGap = gaps[gaps.length >> 1];
      const days = (rows[rows.length - 1].t - rows[0].t) / DAY;
      const mean = rows.reduce((s, r) => s + r.hourly, 0) / rows.length;
      out[name] = { rows, medGapH: medGap / 3600000, days };
      console.log(`OK ${name.padEnd(12)} ${String(rows.length).padStart(4)} settlements  every ${(medGap / 3600000).toFixed(2)}h  ` +
        `spanning ${days.toFixed(1)}d   mean ${(mean * 24 * 365 * 100).toFixed(2)}%/yr`);
    } catch (e) {
      console.log(`-- ${name.padEnd(12)} ${String(e.message).slice(0, 60)}`);
    }
  }
  fs.writeFileSync(`${S}/funding_${SYM}.json`, JSON.stringify(out));
  console.log(`\nwrote funding_${SYM}.json`);
})();
