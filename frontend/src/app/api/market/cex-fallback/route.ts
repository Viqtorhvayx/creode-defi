import { NextResponse } from 'next/server';

/* Route: /api/market/cex-fallback?symbol=BTC
 * Last-resort price source for the Vault market chart: only used client-side
 * once the primary Pyth Hermes stream has gone quiet for 10+ seconds (mirrors
 * the same staleness-triggered cascade vDEX documents for its own chart —
 * Binance primary, Bybit backup). Server-side because neither exchange's
 * public API sends CORS headers for browser calls, and Binance's main
 * api.binance.com blocks some server regions entirely — data-api.binance.vision
 * is their dedicated public-market-data mirror, unrestricted and read-only. */

const BINANCE = 'https://data-api.binance.vision/api/v3/ticker/price';
const BYBIT = 'https://api.bybit.com/v5/market/tickers';

async function fromBinance(pair: string): Promise<number | null> {
  try {
    const res = await fetch(`${BINANCE}?symbol=${pair}`, { next: { revalidate: 1 } });
    if (!res.ok) return null;
    const d = await res.json();
    const p = Number(d?.price);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch { return null; }
}

async function fromBybit(pair: string): Promise<number | null> {
  try {
    const res = await fetch(`${BYBIT}?category=spot&symbol=${pair}`, { next: { revalidate: 1 } });
    if (!res.ok) return null;
    const d = await res.json();
    const p = Number(d?.result?.list?.[0]?.lastPrice);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch { return null; }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sym = (searchParams.get('symbol') || '').toUpperCase();
    if (!sym) return NextResponse.json({ error: 'missing symbol' }, { status: 400 });
    const pair = `${sym}USDT`;

    const binancePrice = await fromBinance(pair);
    if (binancePrice != null) {
      return NextResponse.json({ price: binancePrice, source: 'binance', time: Math.floor(Date.now() / 1000) });
    }

    const bybitPrice = await fromBybit(pair);
    if (bybitPrice != null) {
      return NextResponse.json({ price: bybitPrice, source: 'bybit', time: Math.floor(Date.now() / 1000) });
    }

    return NextResponse.json({ price: null, source: null, time: null });
  } catch (e) {
    console.error('[api/market/cex-fallback]', e);
    return NextResponse.json({ price: null, source: null, time: null }, { status: 200 });
  }
}
