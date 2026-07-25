import { NextResponse } from 'next/server';
import { logEvent, fetchTopicMessages, HCS_TOPIC_ID, type ProtocolEvent } from '../../../../lib/hcs';

/* Route: /api/hcs/log
 * POST — the client calls this right after a Vault deposit/exit, P2P order
 *   fill, or governance vote confirms on-chain, to record it on the HCS
 *   topic. Best-effort: a logging failure is reported but never surfaces as
 *   an error to the user, since it's a supplementary audit trail, not the
 *   transaction itself.
 * GET  — reads the topic back (via Mirror Node) for the Activity tab's
 *   on-chain event log panel. */

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ProtocolEvent;
    if (!body?.type || !body?.account) {
      return NextResponse.json({ ok: false, error: 'type and account are required' }, { status: 400 });
    }
    const result = await logEvent(body);
    if (!result) return NextResponse.json({ ok: false, error: 'HCS topic not configured yet' });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[api/hcs/log] POST failed:', e);
    return NextResponse.json({ ok: false, error: 'log failed' }, { status: 200 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Number(searchParams.get('limit')) || 25);
    const events = await fetchTopicMessages(limit);
    return NextResponse.json({ topicId: HCS_TOPIC_ID, events });
  } catch (e) {
    console.error('[api/hcs/log] GET failed:', e);
    return NextResponse.json({ topicId: HCS_TOPIC_ID, events: [] });
  }
}
