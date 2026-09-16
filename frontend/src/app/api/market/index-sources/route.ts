import { NextResponse } from 'next/server';

/* Route: /api/market/index-sources?symbol=BTC
 *
 * Reads the CEX spot books that perp DEXes compute their index/oracle prices
 * FROM, and returns every one of them in a single response so the client can
 * apply a venue's own published formula itself.
 *
 * Why this exists: a perp DEX's index price is not an independent observation.
 * It is a fixed function of public CEX spot prices, recomputed and republished
 * on a fixed drumbeat — every 3 seconds on Hyperliquid, roughly every 1-2s
 * elsewhere. Reading the same inputs continuously and applying the same
 * function reproduces their number before they publish it. The lead comes from
 * their publish interval, not from beating any exchange.
 *
 * Server-side for the same reason as cex-fallback: none of these send CORS
 * headers for browser calls. Sources that fail or are blocked from the
 * deploy region are simply reported as unavailable and dropped from the
 * weighted median, which is what the venues themselves do with a dead feed.
 *
 * runtime='edge' matches cex-fallback — measured there at ~165-170ms against
 * ~400-500ms for the Node serverless path, and this route is on the same
 * latency-critical path. All seven upstream calls go out in parallel, so the
 * route costs roughly one round trip, not seven. */
export const runtime = 'edge';

type Src = 'binance' | 'okx' | 'bybit' | 'kraken' | 'kucoin' | 'gate' | 'mexc';

/** Per-source pair naming. Kraken still uses XBT for bitcoin. */
const PAIR: Record<Src, (s: string) => string> = {
  binance: (s) => `${s}USDT`,
  okx: (s) => `${s}-USDT`,
  bybit: (s) => `${s}USDT`,
  kraken: (s) => `${s === 'BTC' ? 'XBT' : s}USDT`,
  kucoin: (s) => `${s}-USDT`,
  gate: (s) => `${s}_USDT`,
  mexc: (s) => `${s}USDT`,
};

const mid = (b: unknown, a: unknown): number | null => {
  const bid = Number(b), ask = Number(a);
  if (!Number.isFinite(bid) || !Number.isFinite(ask) || bid <= 0 || ask <= 0) return null;
  return (bid + ask) / 2;
};

const READERS: Record<Src, (sym: string) => Promise<number | null>> = {
  binance: async (s) => {
    const r = await fetch(`https://data-api.binance.vision/api/v3/ticker/bookTicker?symbol=${PAIR.binance(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return mid(d?.bidPrice, d?.askPrice);
  },
  okx: async (s) => {
    const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${PAIR.okx(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json())?.data?.[0];
    return mid(d?.bidPx, d?.askPx);
  },
  bybit: async (s) => {
    const r = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${PAIR.bybit(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json())?.result?.list?.[0];
    return mid(d?.bid1Price, d?.ask1Price);
  },
  kraken: async (s) => {
    const r = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${PAIR.kraken(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const res = (await r.json())?.result;
    const k = res && Object.keys(res)[0];
    const d = k ? res[k] : null;
    return d ? mid(d.b?.[0], d.a?.[0]) : null;
  },
  kucoin: async (s) => {
    const r = await fetch(`https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${PAIR.kucoin(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json())?.data;
    return mid(d?.bestBid, d?.bestAsk);
  },
  gate: async (s) => {
    const r = await fetch(`https://api.gateio.ws/api/v4/spot/tickers?currency_pair=${PAIR.gate(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = (await r.json())?.[0];
    return mid(d?.highest_bid, d?.lowest_ask);
  },
  mexc: async (s) => {
    const r = await fetch(`https://api.mexc.com/api/v3/ticker/bookTicker?symbol=${PAIR.mexc(s)}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return mid(d?.bidPrice, d?.askPrice);
  },
};

const ALL: Src[] = ['binance', 'okx', 'bybit', 'kraken', 'kucoin', 'gate', 'mexc'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sym = (searchParams.get('symbol') || '').toUpperCase();
    if (!sym) return NextResponse.json({ error: 'missing symbol' }, { status: 400 });

    // Every source in parallel. One slow venue must not hold up the rest, so
    // each gets its own short timeout and a failure just drops that source.
    const settled = await Promise.all(ALL.map(async (src) => {
      try {
        const p = await Promise.race([
          READERS[src](sym),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);
        return [src, p] as const;
      } catch { return [src, null] as const; }
    }));

    const sources: Record<string, number> = {};
    const missing: string[] = [];
    for (const [src, p] of settled) {
      if (p != null) sources[src] = p;
      else missing.push(src);
    }

    return NextResponse.json(
      { symbol: sym, sources, missing, time: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[api/market/index-sources]', e);
    return NextResponse.json({ sources: {}, missing: ALL, time: Date.now() }, { status: 200 });
  }
}
