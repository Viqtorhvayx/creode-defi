import { NextResponse } from 'next/server';
import { PAIRS, type PairStat } from '../../../../lib/market';

/* Route: /api/market/stats
 * Real 24h volume + change + price for every pair, from GeckoTerminal's Hedera
 * pools in a single multi-pool call. Powers the market-selector volume badges. */

const GECKO = 'https://api.geckoterminal.com/api/v2/networks/hedera-hashgraph/pools/multi';

export async function GET() {
  const stats: Record<string, PairStat> = {};
  try {
    const pools = Array.from(new Set(PAIRS.map((p) => p.volumePool)));
    const res = await fetch(`${GECKO}/${pools.join(',')}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });
    const d = await res.json();
    const byPool = new Map<string, { volume24h: number; change24h: number; price: number }>();
    for (const p of d?.data || []) {
      const addr = (p.id.split('_').pop() || '').toLowerCase();
      const a = p.attributes || {};
      byPool.set(addr, {
        volume24h: Number(a.volume_usd?.h24 || 0),
        change24h: Number(a.price_change_percentage?.h24 || 0),
        price: Number(a.base_token_price_usd || 0),
      });
    }
    for (const pair of PAIRS) {
      stats[pair.id] = byPool.get(pair.volumePool.toLowerCase()) || { volume24h: 0, change24h: 0, price: 0 };
    }
  } catch (e) {
    console.error('[api/market/stats]', e);
    for (const pair of PAIRS) stats[pair.id] = { volume24h: 0, change24h: 0, price: 0 };
  }
  return NextResponse.json({ stats });
}
