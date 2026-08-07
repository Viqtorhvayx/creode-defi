// Optional second upstream source: Pyth Lazer, layered on TOP of the existing
// Binance connections in server.js — never a replacement. Only wired in for
// the handful of tokens whose Lazer feed actually supports a fast channel
// (confirmed live against https://pyth.dourolabs.app/v1/symbols while
// building this): BTC, ETH, SOL, HYPE, XRP, BNB, DOGE, PEPE. Every other
// vault-watch token is capped at Lazer's fixed_rate@200ms (or 50ms for
// FARTCOIN) — at or slower than the ~103ms median this relay's Binance path
// already measured against real trade ground truth — so wiring those in
// here would make them WORSE, not better. Leave them on Binance alone.
//
// Deliberately pinned to fixed_rate@50ms rather than the faster "real_time"
// channel (~1ms) these feeds also support — a per-price-change stream that
// reads as unrealistic/implausible to traders, so this trades some raw
// speed for a steadier, still-fast cadence. If that tradeoff changes, the
// only thing to touch is LAZER_CHANNEL below.
//
// If PYTH_LAZER_API_KEY isn't set, or the account's tier doesn't permit this
// channel, this connects, logs why, and does nothing further — server.js's
// Binance path is completely unaffected either way.
const WebSocket = require('ws');

const LAZER_WS_URL = 'wss://pyth-lazer-0.dourolabs.app/v1/stream';
const LAZER_CHANNEL = 'fixed_rate@50ms';

// sym -> { id, expo } — from pyth.dourolabs.app/v1/symbols, cross-checked
// against the hermes_id already used for these tokens in the frontend's
// market.ts to confirm they're the same underlying assets.
const FAST_FEEDS = {
  BTC: { id: 1, expo: -8 },
  ETH: { id: 2, expo: -8 },
  SOL: { id: 6, expo: -8 },
  HYPE: { id: 110, expo: -8 },
  XRP: { id: 14, expo: -8 },
  BNB: { id: 15, expo: -8 },
  DOGE: { id: 13, expo: -8 },
  PEPE: { id: 4, expo: -10 },
};

const idToSym = Object.fromEntries(
  Object.entries(FAST_FEEDS).map(([sym, f]) => [f.id, sym])
);

function connectPythLazer(broadcast) {
  const apiKey = process.env.PYTH_LAZER_API_KEY;
  if (!apiKey) {
    console.log('[pyth-lazer] PYTH_LAZER_API_KEY not set — skipping, Binance-only for all symbols.');
    return;
  }

  let ws;
  try {
    ws = new WebSocket(LAZER_WS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
  } catch (e) {
    console.error('[pyth-lazer] failed to open connection, retrying in 5s:', e.message);
    setTimeout(() => connectPythLazer(broadcast), 5000);
    return;
  }

  ws.on('open', () => {
    console.log('[pyth-lazer] connected, subscribing to', Object.keys(FAST_FEEDS).join(', '));
    ws.send(JSON.stringify({
      type: 'subscribe',
      subscriptionId: 1,
      priceFeedIds: Object.values(FAST_FEEDS).map((f) => f.id),
      properties: ['price', 'feedUpdateTimestamp'],
      formats: [],
      channel: LAZER_CHANNEL,
      ignoreInvalidFeeds: true,
    }));
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'subscriptionError' || msg.type === 'error') {
        // Expected outcome if the tier doesn't permit this channel — logged
        // once and left alone; Binance keeps serving these symbols as it
        // already does.
        console.error('[pyth-lazer] subscribe rejected:', JSON.stringify(msg));
        return;
      }
      if (msg.type !== 'streamUpdated' || !msg.parsed) return;
      for (const feed of msg.parsed.priceFeeds || []) {
        const sym = idToSym[feed.priceFeedId];
        const meta = sym && FAST_FEEDS[sym];
        if (!meta || feed.price == null) continue;
        const price = Number(feed.price) * 10 ** meta.expo;
        const timestampUs = Number(feed.feedUpdateTimestamp ?? msg.parsed.timestampUs);
        if (!Number.isFinite(price) || !Number.isFinite(timestampUs)) continue;
        broadcast(sym, { price, time: Math.floor(timestampUs / 1_000_000) });
      }
    } catch {
      // Skip malformed/partial frames — same tolerance as the Binance path.
    }
  });

  ws.on('close', () => {
    console.error('[pyth-lazer] connection closed, reconnecting in 2s');
    setTimeout(() => connectPythLazer(broadcast), 2000);
  });
  ws.on('error', (e) => {
    console.error('[pyth-lazer] error:', e.message);
    try { ws.close(); } catch { /* already closing */ }
  });
}

module.exports = { connectPythLazer };
