import { NextResponse } from 'next/server';

/* Route: /api/market/cex-fallback?symbol=BTC
 * Last-resort price source for the Vault market chart: only used client-side
 * once the primary Pyth Hermes stream has gone quiet for 10+ seconds (mirrors
 * the same staleness-triggered cascade vDEX documents for its own chart —
 * Binance primary, Bybit backup). Server-side because neither exchange's
 * public API sends CORS headers for browser calls, and Binance's main
 * api.binance.com blocks some server regions entirely — data-api.binance.vision
 * is their dedicated public-market-data mirror, unrestricted and read-only.
 *
 * runtime='edge' is deliberate: measuring the real deployed Node.js
 * serverless version of this route directly showed ~400-500ms round trips
 * even on warm instances (vs. ~165-170ms measured hitting Binance directly),
 * which was eating most of the speed advantage the polling frequency work
 * was supposed to deliver. This route only uses fetch/URL/console — all
 * fully Edge-Runtime-supported — so moving it to Vercel's globally
 * distributed Edge Network (faster cold starts, no Node.js container
 * spin-up) is a well-supported, low-risk way to attack that overhead
 * directly, rather than polling an already-slow endpoint faster. */
export const runtime = 'edge';

const BINANCE = 'https://data-api.binance.vision/api/v3/ticker/price';
const BYBIT = 'https://api.bybit.com/v5/market/tickers';

// no-store is deliberate: Next.js's fetch cache was previously set to
// revalidate:1 here, which silently capped every price at up to a second
// stale regardless of how often the client polled this route — confirmed by
// watching the same price repeat for 2+ seconds under rapid polling. This is
// a live price feed; every call needs the real current value.
async function fromBinance(pair: string): Promise<number | null> {
  try {
    const res = await fetch(`${BINANCE}?symbol=${pair}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const d = await res.json();
    const p = Number(d?.price);
    return Number.isFinite(p) && p > 0 ? p : null;
  } catch { return null; }
}

async function fromBybit(pair: string): Promise<number | null> {
  try {
    const res = await fetch(`${BYBIT}?category=spot&symbol=${pair}`, { cache: 'no-store' });
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
    const source = searchParams.get('source'); // 'binance' | 'bybit' | omitted (combined)
    if (!sym) return NextResponse.json({ error: 'missing symbol' }, { status: 400 });
    const pair = `${sym}USDT`;

    // A specific source is requested by the Vault chart's Binance-primary
    // cascade (matches vDEX's own documented pOracle source), which needs to
    // know precisely whether Binance itself succeeded rather than getting a
    // pre-merged result.
    if (source === 'binance') {
      const p = await fromBinance(pair);
      return NextResponse.json(p != null
        ? { price: p, source: 'binance', time: Math.floor(Date.now() / 1000) }
        : { price: null, source: null, time: null });
    }
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
