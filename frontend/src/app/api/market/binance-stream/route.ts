// Route: /api/market/binance-stream?symbol=BTC
// Server-side relay for Binance's live trade-print WebSocket. Some
// environments (in-app wallet browsers, restrictive network policies) block
// raw WebSocket upgrades outright at a level client-side JavaScript can't
// catch or recover from, while ordinary HTTPS/SSE traffic goes through fine
// — the same mechanism the Pyth Hermes stream already relies on in this app.
// So instead of the browser opening a WebSocket to Binance directly, this
// route holds that connection server-side and re-emits each trade print to
// the browser as Server-Sent Events.
//
// Vercel serverless functions can't hold a connection open indefinitely, so
// this proactively closes the stream well inside any execution limit; the
// client's EventSource reconnects automatically on a dropped connection per
// spec, so this is invisible to the user beyond a brief reconnect blip every
// ~9s — still far more responsive than polling a snapshot every 150ms.
//
// This interval is deliberately left exactly as last confirmed working in
// production — a later attempt to stretch it to 55s (with an explicit
// maxDuration=60) broke the stream across every browser and was reverted.
// Do not change this value without re-verifying on the actual deployment,
// not just locally.
export const runtime = 'nodejs';

const BINANCE_WS = 'wss://stream.binance.com:443/ws';
const SELF_CLOSE_MS = 9000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sym = (searchParams.get('symbol') || '').toLowerCase();
  if (!sym) return new Response('missing symbol', { status: 400 });
  const pair = `${sym}usdt`;

  const encoder = new TextEncoder();
  let ws: WebSocket | null = null;
  let closed = false;

  const streamBody = new ReadableStream({
    start(controller) {
      const finish = () => {
        if (closed) return;
        closed = true;
        try { ws?.close(); } catch { /* already closing */ }
        try { controller.close(); } catch { /* already closed */ }
      };

      try {
        ws = new WebSocket(`${BINANCE_WS}/${pair}@trade`);
      } catch {
        // Binance itself unreachable from the server — end the stream; the
        // client's existing REST polling keeps the price current regardless.
        finish();
        return;
      }

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          const price = Number(msg.p);
          const time = Math.floor(Number(msg.T) / 1000);
          if (!Number.isFinite(price) || !Number.isFinite(time)) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ price, time })}\n\n`));
        } catch {
          // Skip malformed/partial frames.
        }
      };
      ws.onerror = () => finish();
      ws.onclose = () => finish();

      const selfCloseTimer = setTimeout(finish, SELF_CLOSE_MS);
      request.signal.addEventListener('abort', () => { clearTimeout(selfCloseTimer); finish(); });
    },
    cancel() {
      closed = true;
      try { ws?.close(); } catch { /* already closing */ }
    },
  });

  return new Response(streamBody, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
