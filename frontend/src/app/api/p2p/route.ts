import { NextResponse } from 'next/server';
import { fetchOpenOrders, fetchRecentTrades } from '../../../lib/p2p';

/* Route: /api/p2p?type=book|trades&pair=HBAR-USDC
 * Server-side reads of the CreodeP2P book and recent fills (the server can
 * reach the Hedera RPC reliably; keeps reads off each user's wallet RPC and
 * free of CORS). Writes still go through the user's wallet on the client. */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pair = searchParams.get('pair') || 'HBAR-USDC';
    const type = searchParams.get('type') || 'book';
    if (type === 'trades') {
      const trades = await fetchRecentTrades(pair);
      return NextResponse.json({ trades });
    }
    const orders = await fetchOpenOrders(pair);
    return NextResponse.json({ orders });
  } catch (e) {
    console.error('[api/p2p]', e);
    return NextResponse.json({ orders: [], trades: [] }, { status: 200 });
  }
}
