import { NextResponse } from 'next/server';
import { createTopic, HCS_TOPIC_ID } from '../../../../lib/hcs';

/* Route: POST /api/hcs/setup
 * One-time, secret-guarded topic creation. Exists because topic creation
 * needs the native Hedera SDK over gRPC to a consensus node — Vercel's
 * serverless functions have full outbound network access (unlike a
 * gRPC-restricted dev sandbox), so this lets that one gRPC-dependent
 * operation run on infrastructure that can actually reach it, triggered by
 * a single authenticated HTTPS call. Requires HCS_SETUP_SECRET to be set in
 * the deployment's environment; refuses to run a second time once a topic
 * is already configured in hcs_config.json. */
export async function POST(request: Request) {
  const secret = process.env.HCS_SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'HCS_SETUP_SECRET not configured on this deployment' }, { status: 500 });
  }
  if (request.headers.get('x-setup-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  if (HCS_TOPIC_ID) {
    return NextResponse.json({ ok: false, error: 'topic already configured', topicId: HCS_TOPIC_ID }, { status: 409 });
  }
  try {
    const topicId = await createTopic();
    return NextResponse.json({
      ok: true,
      topicId,
      note: 'Commit this topicId into frontend/src/contracts/hcs_config.json and redeploy.',
    });
  } catch (e) {
    console.error('[api/hcs/setup] failed:', e);
    return NextResponse.json({ ok: false, error: String((e as Error)?.message || e) }, { status: 500 });
  }
}

/* GET: temporary diagnostic — reports only whether each expected env var is
 * present (never its value), to debug a Vercel env-var scope/typo issue
 * without exposing secrets. Safe to remove once setup succeeds. */
export async function GET() {
  return NextResponse.json({
    hasSetupSecret: !!process.env.HCS_SETUP_SECRET,
    hasAccountId: !!process.env.HEDERA_ACCOUNT_ID,
    hasPrivateKey: !!process.env.HEDERA_PRIVATE_KEY,
    accountIdPreview: process.env.HEDERA_ACCOUNT_ID || null,
  });
}
