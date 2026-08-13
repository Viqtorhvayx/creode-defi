// Live oracle-vs-mark price feed for Ondo Perps' equity/commodity markets,
// consumed directly from Ondo's own public WebSocket (wss://api.ondoperps.xyz/ws,
// channel markPricesPerps) — both markPrice and oraclePrice are Ondo's own
// real, published numbers in the same message, nothing reconstructed or
// guessed at. Confirmed live before shipping: all 19 of Ondo's announced
// markets returned real data on this exact channel/symbol format.
//
// This exists to power the Ondo Gap Monitor: oraclePrice updates straight
// from Chainlink's feed, markPrice is Ondo's own order-book-driven price,
// pulled toward oracle over time via funding rather than instantly — same
// "oracle leads, mark lags" pattern already confirmed for N1. Showing both
// side by side surfaces that gap live; it does not predict or fabricate
// anything Ondo hasn't already published itself.
const WebSocket = require('ws');

const ONDO_WS_URL = 'wss://api.ondoperps.xyz/ws';

// Our short display symbol -> Ondo's own market identifier.
const SYMBOL_MAP = {
  XAU: 'XAU-USD.P', XAG: 'XAG-USD.P', AAPL: 'AAPL-USD.P', TSLA: 'TSLA-USD.P',
  NVDA: 'NVDA-USD.P', GOOGL: 'GOOGL-USD.P', QQQ: 'QQQ-USD.P', META: 'META-USD.P',
  MSFT: 'MSFT-USD.P', AMZN: 'AMZN-USD.P', AMD: 'AMD-USD.P', COIN: 'COIN-USD.P',
  CRCL: 'CRCL-USD.P', HOOD: 'HOOD-USD.P', INTC: 'INTC-USD.P', MSTR: 'MSTR-USD.P',
  NFLX: 'NFLX-USD.P', ORCL: 'ORCL-USD.P', PLTR: 'PLTR-USD.P',
};
const ONDO_TO_SYMBOL = Object.fromEntries(Object.entries(SYMBOL_MAP).map(([k, v]) => [v, k]));
const SYMBOLS = Object.keys(SYMBOL_MAP);

// onTick(sym, { markPrice, oraclePrice, time })
function connectOndoGapPx(onTick) {
  function connect() {
    let ws;
    try {
      ws = new WebSocket(ONDO_WS_URL);
    } catch (e) {
      console.error('[ondo-gap] failed to open ws, retrying in 5s:', e.message);
      setTimeout(connect, 5000);
      return;
    }

    ws.on('open', () => {
      console.log('[ondo-gap] connected, subscribing to', SYMBOLS.length, 'markets');
      for (const ondoSym of Object.values(SYMBOL_MAP)) {
        ws.send(JSON.stringify({ op: 'subscribe', channel: 'markPricesPerps', markets: [ondoSym] }));
      }
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type !== 'update' || !Array.isArray(msg.data)) return;
        const t = Math.floor(Date.now() / 1000);
        for (const d of msg.data) {
          const sym = ONDO_TO_SYMBOL[d.market];
          if (!sym) continue;
          const markPrice = Number(d.markPrice);
          const oraclePrice = Number(d.oraclePrice);
          if (!Number.isFinite(markPrice) || !Number.isFinite(oraclePrice)) continue;
          onTick(sym, { markPrice, oraclePrice, time: t });
        }
      } catch {
        // Skip malformed/partial frames.
      }
    });

    ws.on('error', (e) => console.error('[ondo-gap] ws error:', e.message));
    ws.on('close', () => {
      console.error('[ondo-gap] ws closed, reconnecting in 2s');
      setTimeout(connect, 2000);
    });
  }
  connect();
}

module.exports = { connectOndoGapPx, SYMBOLS };
