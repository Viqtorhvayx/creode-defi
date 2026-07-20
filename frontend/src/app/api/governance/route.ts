import { NextResponse } from 'next/server';
import { readAll, readVoter } from '../../../lib/governance';

/* Route: /api/governance            → { proposals, quorumVotes, proposalThreshold, totalSupply }
 *        /api/governance?address=0x → { power, claimed, voted }
 * Server-side reads of CreodeGovernance + CodeToken (the server reaches the
 * Hedera RPC reliably; keeps reads off each user's wallet RPC and CORS-free).
 * Writes (claim / propose / vote) still go through the user's wallet client. */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    if (address) {
      const voter = await readVoter(address);
      return NextResponse.json(voter);
    }
    const data = await readAll();
    return NextResponse.json(data);
  } catch (e) {
    console.error('[api/governance]', e);
    return NextResponse.json({ proposals: [], quorumVotes: 0, proposalThreshold: 0, totalSupply: 0 }, { status: 200 });
  }
}
