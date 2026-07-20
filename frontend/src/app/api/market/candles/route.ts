import { NextResponse } from 'next/server';
import { getPair, RESOLUTIONS, type Candle, type Timeframe } from '../../../../lib/market';

/* Route: /api/market/candles?pair=HBAR-USDC&tf=1H
 * Real OHLC candles: Pyth Network for majors, GeckoTerminal (SaucerSwap) for
 * Hedera small-caps, and a derived ratio for HBAR-SAUCE. Server-side to avoid
 * browser CORS and to cache upstream responses briefly. */

const PYTH = 'https://benchmarks.pyth.network/v1/shims/tradingview/history';
const GECKO = 'https://api.geckoterminal.com/api/v2/networks/hedera-hashgraph/pools';
const LIMIT = 300;

async function pythCandles(symbol: string, tf: Timeframe): Promise<Candle[]> {
  const r = RESOLUTIONS[tf];
  const to = Math.floor(Date.now() / 1000);
  const from = to - LIMIT * r.secs;
  const url = `${PYTH}?symbol=${encodeURIComponent(symbol)}&resolution=${r.pyth}&from=${from}&to=${to}`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  const d = await res.json();
  if (d.s !== 'ok') return [];
  return d.t.map((t: number, i: number) => ({ time: t, open: d.o[i], high: d.h[i], low: d.l[i], close: d.c[i] }));
}

async function geckoCandles(pool: string, tf: Timeframe): Promise<Candle[]> {
  const r = RESOLUTIONS[tf];
  const url = `${GECKO}/${pool}/ohlcv/${r.geckoTf}?aggregate=${r.geckoAgg}&limit=${LIMIT}&currency=usd`;
  const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 20 } });
  if (!res.ok) return [];
  const d = await res.json();
  const list: number[][] = d?.data?.attributes?.ohlcv_list || [];
  // GeckoTerminal returns newest-first [ts, o, h, l, c, vol]; chart wants ascending.
  return list
    .map((row) => ({ time: row[0], open: row[1], high: row[2], low: row[3], close: row[4] }))
    .sort((a, b) => a.time - b.time);
}

// HBAR-SAUCE = HBAR/USD (Pyth) ÷ SAUCE/USD (Gecko), aligned by candle bucket.
async function derivedCandles(numSymbol: string, denomPool: string, tf: Timeframe): Promise<Candle[]> {
  const [num, denom] = await Promise.all([pythCandles(numSymbol, tf), geckoCandles(denomPool, tf)]);
  if (!num.length || !denom.length) return [];
  const secs = RESOLUTIONS[tf].secs;
  const bucket = (t: number) => Math.floor(t / secs) * secs;
  const denomByBucket = new Map<number, Candle>();
  for (const c of denom) denomByBucket.set(bucket(c.time), c);
  let lastDenom = denom[0].close;
  const out: Candle[] = [];
  for (const c of num) {
    const d = denomByBucket.get(bucket(c.time));
    const div = d ? d.close : lastDenom;
    if (d) lastDenom = d.close;
    if (!div) continue;
    out.push({ time: c.time, open: c.open / div, high: c.high / div, low: c.low / div, close: c.close / div });
  }
  return out;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pair') || 'HBAR-USDC';
    const tf = (searchParams.get('tf') || '1H') as Timeframe;
    if (!RESOLUTIONS[tf]) return NextResponse.json({ error: 'bad tf' }, { status: 400 });
    const pair = getPair(pairId);

    let candles: Candle[] = [];
    if (pair.source === 'pyth' && pair.pythSymbol) candles = await pythCandles(pair.pythSymbol, tf);
    else if (pair.source === 'gecko' && pair.geckoPool) candles = await geckoCandles(pair.geckoPool, tf);
    else if (pair.source === 'derived' && pair.pythSymbol && pair.geckoPool) candles = await derivedCandles(pair.pythSymbol, pair.geckoPool, tf);

    return NextResponse.json({ pair: pair.id, tf, candles });
  } catch (e) {
    console.error('[api/market/candles]', e);
    return NextResponse.json({ error: 'fetch failed', candles: [] }, { status: 200 });
  }
}
