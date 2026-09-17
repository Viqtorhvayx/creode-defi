import { NextResponse } from 'next/server';

/* Route: /api/market/margin?symbol=BTC
 *
 * Maintenance margin fraction per venue — the number that decides where a leg
 * gets liquidated, and the one figure a carry trade cannot afford to guess at.
 *
 * Only two of the venues we care about publish it in a form that can be read
 * without an account:
 *   dYdX v4    — states initialMarginFraction and maintenanceMarginFraction
 *                outright on the market.
 *   Hyperliquid — publishes maxLeverage per asset. Their maintenance margin is
 *                half the initial margin at max leverage, so mmf = 1/(2*lev).
 *
 * Everything else (Backpack exposes imfFunction/mmfFunction, Extended only a
 * maxLeverage) needs either an account or a tier table we cannot see, so those
 * come back as null and the UI says "assumed" rather than inventing a number.
 * A liquidation price computed from a guessed maintenance margin is worse than
 * no liquidation price at all, because it looks authoritative. */
export const runtime = 'edge';

type Asset = 'BTC' | 'ETH' | 'SOL';

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sym = (searchParams.get('symbol') || 'BTC').toUpperCase() as Asset;
    if (!['BTC', 'ETH', 'SOL'].includes(sym)) {
      return NextResponse.json({ error: 'unsupported symbol' }, { status: 400 });
    }

    const [dydx, hl] = await Promise.all([
      (async () => {
        try {
          const r = await fetch(`https://indexer.dydx.trade/v4/perpetualMarkets?ticker=${sym}-USD`, { cache: 'no-store' });
          if (!r.ok) return null;
          const d = await r.json();
          const m = d?.markets?.[`${sym}-USD`];
          return {
            mmf: num(m?.maintenanceMarginFraction),
            imf: num(m?.initialMarginFraction),
            source: 'published' as const,
          };
        } catch { return null; }
      })(),
      (async () => {
        try {
          const r = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'metaAndAssetCtxs' }), cache: 'no-store',
          });
          if (!r.ok) return null;
          const [meta] = await r.json();
          const u = meta?.universe?.find((x: { name: string }) => x.name === sym);
          const lev = num(u?.maxLeverage);
          if (!lev) return null;
          // Hyperliquid's maintenance margin is half the initial at max leverage
          return { mmf: 1 / (2 * lev), imf: 1 / lev, source: 'derived from maxLeverage' as const };
        } catch { return null; }
      })(),
    ]);

    return NextResponse.json(
      { symbol: sym, venues: { dydx, hyperliquid: hl }, time: Date.now() },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    console.error('[api/market/margin]', e);
    return NextResponse.json({ venues: {}, time: Date.now() }, { status: 200 });
  }
}
