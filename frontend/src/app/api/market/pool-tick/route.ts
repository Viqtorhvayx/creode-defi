import { NextResponse } from 'next/server';
import { POOL_TICK_CONFIG, SWAP_TOPIC } from '../../../../lib/uniswapV3Pools';
import { PYTH_FEED_IDS } from '../../../../lib/market';

/* Route: /api/market/pool-tick?pair=SAUCE-USDC
 * Real-time-ish price for pairs GeckoTerminal has no push feed for: reads the
 * latest Swap event straight off the SaucerSwap V2 pool contract via Hedera's
 * Mirror Node (polled client-side every ~3s — far faster than GeckoTerminal's
 * OHLCV endpoint allows) and decodes sqrtPriceX96 into a human USD-quoted
 * price, the same way a real exchange would build its tape from raw fills. */

const MIRROR = 'https://mainnet-public.mirrornode.hedera.com/api/v1';
const HERMES_LATEST = 'https://hermes.pyth.network/v2/updates/price/latest';

async function latestHbarUsd(): Promise<number> {
  const res = await fetch(`${HERMES_LATEST}?ids[]=${PYTH_FEED_IDS['Crypto.HBAR/USD']}&parsed=true&encoding=hex`, { next: { revalidate: 2 } });
  if (!res.ok) return 0;
  const d = await res.json();
  const p = d?.parsed?.[0]?.price;
  if (!p) return 0;
  return Number(p.price) * 10 ** Number(p.expo);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pair') || '';
    const cfg = POOL_TICK_CONFIG[pairId];
    if (!cfg) return NextResponse.json({ error: 'unknown pair' }, { status: 400 });

    const res = await fetch(`${MIRROR}/contracts/${cfg.address}/results/logs?limit=100&order=desc`, { next: { revalidate: 1 } });
    if (!res.ok) return NextResponse.json({ price: null, time: null });
    const data = await res.json();
    const log = (data.logs || []).find((l: any) => l.topics?.[0] === SWAP_TOPIC);
    if (!log) return NextResponse.json({ price: null, time: null });

    const hex = (log.data as string).slice(2);
    const word = (i: number) => hex.slice(i * 64, i * 64 + 64);
    const sqrtPriceX96 = BigInt('0x' + word(2)); // words: amount0, amount1, sqrtPriceX96, liquidity, tick
    const raw = Number(sqrtPriceX96) / 2 ** 96;
    const t1t0 = raw * raw * 10 ** (cfg.token0Decimals - cfg.token1Decimals);

    const hbarUsd = pairId === 'DOVU-USDC' ? await latestHbarUsd() : undefined;
    const price = cfg.toQuotePerBase(t1t0, hbarUsd);
    const time = Math.floor(Number(log.timestamp));

    return NextResponse.json({ price, time });
  } catch (e) {
    console.error('[api/market/pool-tick]', e);
    return NextResponse.json({ price: null, time: null }, { status: 200 });
  }
}
