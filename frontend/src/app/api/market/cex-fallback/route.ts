import { NextResponse } from 'next/server';

/* Route: /api/market/cex-fallback?symbol=BTC
 * Fallback price source for the Vault market chart. HBAR (not a vDEX pair)
 * uses the combined Binance-then-Bybit response here once Pyth goes quiet.
 * Every other token streams Binance directly over a live WebSocket
 * (lib/binanceStream.ts) instead of polling this route; this only serves
 * `source=bybit` for those as the last-resort tier once both that stream and
 * Pyth have gone quiet. Server-side because neither exchange's public REST
 * API sends CORS headers for browser calls, and Binance's main
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
    const source = searchParams.get('source'); // 'bybit' | omitted (combined)
    if (!sym) return NextResponse.json({ error: 'missing symbol' }, { status: 400 });
    const pair = `${sym}USDT`;

    // Bybit-only is requested as the last fallback tier once both the Vault
    // chart's live Binance WebSocket stream and Pyth have gone quiet.
    if (source === 'bybit') {
      const p = await fromBybit(pair);
      return NextResponse.json(p != null
        ? { price: p, source: 'bybit', time: Math.floor(Date.now() / 1000) }
        : { price: null, source: null, time: null });
    }

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
