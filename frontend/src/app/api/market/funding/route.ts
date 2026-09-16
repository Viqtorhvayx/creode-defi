import { NextResponse } from 'next/server';

/* Route: /api/market/funding?symbol=BTC
 *
 * Current funding rate from every perp DEX we can read, normalised to a single
 * unit so they can actually be compared.
 *
 * NORMALISATION IS THE WHOLE JOB, and it is why this lives server-side in one
 * place rather than being done ad hoc in the UI. Three traps, each of which
 * silently manufactures a spectacular fake spread:
 *
 *   INTERVAL — Hyperliquid, dYdX, Backpack, Extended, Lighter, ApeX and Hibachi
 *     settle hourly. Binance, Aster, OKX, Orderly, Paradex and GRVT settle every
 *     8 hours. Comparing the two directly overstates by 8x. Every interval below
 *     was confirmed from the spacing of that venue's own settlement timestamps,
 *     not from its documentation.
 *   UNITS — Lighter and GRVT quote PERCENT; everyone else quotes a fraction.
 *     That is a 100x error. Lighter's own `value` field settles it: a rate of
 *     0.0010 on a ~$76k position pays $0.77, so the rate is 0.001%, not 0.1%.
 *   SIGN — Lighter publishes a magnitude plus a `direction` field rather than a
 *     signed rate.
 *
 * Everything returned is an HOURLY FRACTION, positive meaning longs pay shorts.
 * See research/funding-spreads/ for the 30-day study this came from.
 *
 * runtime='edge' matches the other market routes; all venues go out in parallel
 * so the route costs roughly one round trip rather than thirteen. */
export const runtime = 'edge';

type Asset = 'BTC' | 'ETH' | 'SOL';

const LIGHTER_MARKET: Record<Asset, number> = { BTC: 1, ETH: 0, SOL: 2 };

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Each reader returns the venue's funding as an hourly signed fraction. */
const READERS: Record<string, (s: Asset) => Promise<number | null>> = {
  // ---- hourly venues ----
  hyperliquid: async (s) => {
    const r = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'metaAndAssetCtxs' }), cache: 'no-store',
    });
    if (!r.ok) return null;
    const [meta, ctxs] = await r.json();
    const i = meta?.universe?.findIndex((u: { name: string }) => u.name === s);
    if (i == null || i < 0) return null;
    return num(ctxs?.[i]?.funding);
  },
  dydx: async (s) => {
    const r = await fetch(`https://indexer.dydx.trade/v4/perpetualMarkets?ticker=${s}-USD`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return num(d?.markets?.[`${s}-USD`]?.nextFundingRate);
  },
  backpack: async (s) => {
    const r = await fetch(`https://api.backpack.exchange/api/v1/markPrices?symbol=${s}_USDC_PERP`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return num(d?.[0]?.fundingRate);
  },
  extended: async (s) => {
    const r = await fetch(`https://api.starknet.extended.exchange/api/v1/info/markets?market=${s}-USD`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return num(d?.data?.[0]?.marketStats?.fundingRate);
  },
  apex: async (s) => {
    const r = await fetch(`https://omni.apex.exchange/api/v3/ticker?symbol=${s}USDT`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return num(d?.data?.[0]?.fundingRate);
  },
  hibachi: async (s) => {
    const r = await fetch(`https://data-api.hibachi.xyz/market/data/prices?symbol=${s}/USDT-P`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return num(d?.fundingRateEstimation?.estimatedFundingRate);
  },
  // percent, and the sign lives in `direction`
  lighter: async (s) => {
    const mid = LIGHTER_MARKET[s];
    if (mid == null) return null;
    const now = Date.now();
    const r = await fetch(
      `https://mainnet.zklighter.elliot.ai/api/v1/fundings?market_id=${mid}&resolution=1h` +
      `&start_timestamp=${now - 6 * 3600_000}&end_timestamp=${now}&count_back=3`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const last = d?.fundings?.[d.fundings.length - 1];
    const v = num(last?.rate);
    if (v == null) return null;
    return (v / 100) * (String(last?.direction).toLowerCase() === 'short' ? -1 : 1);
  },

  // ---- 8-hourly venues: divide by 8 ----
  binance: async (s) => {
    const r = await fetch(`https://www.binance.com/fapi/v1/premiumIndex?symbol=${s}USDT`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = num(d?.lastFundingRate);
    return v == null ? null : v / 8;
  },
  aster: async (s) => {
    const r = await fetch(`https://fapi.asterdex.com/fapi/v1/premiumIndex?symbol=${s}USDT`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = num(d?.lastFundingRate);
    return v == null ? null : v / 8;
  },
  okx: async (s) => {
    const r = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${s}-USDT-SWAP`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = num(d?.data?.[0]?.fundingRate);
    return v == null ? null : v / 8;
  },
  orderly: async (s) => {
    const r = await fetch(`https://api.orderly.org/v1/public/futures/PERP_${s}_USDC`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = num(d?.data?.est_funding_rate);
    return v == null ? null : v / 8;
  },
  paradex: async (s) => {
    const r = await fetch(`https://api.prod.paradex.trade/v1/markets/summary?market=${s}-USD-PERP`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    const v = num(d?.results?.[0]?.funding_rate);
    return v == null ? null : v / 8;
  },
  // percent AND 8-hourly
  grvt: async (s) => {
    const r = await fetch('https://market-data.grvt.io/full/v1/ticker', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instrument: `${s}_USDT_Perp` }), cache: 'no-store',
    });
    if (!r.ok) return null;
    const d = await r.json();
    const res = d?.result ?? d;
    const v = num(res?.funding_rate);
    const hrs = num(res?.funding_interval_hours) ?? 8;
    return v == null ? null : (v / 100) / hrs;
  },
};

const ALL = Object.keys(READERS);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sym = (searchParams.get('symbol') || 'BTC').toUpperCase() as Asset;
    if (!['BTC', 'ETH', 'SOL'].includes(sym)) {
      return NextResponse.json({ error: 'unsupported symbol' }, { status: 400 });
    }

    const settled = await Promise.all(ALL.map(async (id) => {
      try {
        const v = await Promise.race([
          READERS[id](sym),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
        ]);
        return [id, v] as const;
      } catch { return [id, null] as const; }
    }));

    const venues: Record<string, number> = {};
    const missing: string[] = [];
    for (const [id, v] of settled) {
      // A funding rate above ~1%/hour is not a funding rate, it is a parsing
      // mistake. Drop it rather than let it dominate every pair.
      if (v != null && Math.abs(v) < 0.01) venues[id] = v;
      else missing.push(id);
    }

    return NextResponse.json(
      { symbol: sym, venues, missing, time: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[api/market/funding]', e);
    return NextResponse.json({ venues: {}, missing: ALL, time: Date.now() }, { status: 200 });
  }
}
