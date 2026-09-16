// Two questions at once:
//   A. which perp DEXes actually publish an index/oracle price, and in what field
//   B. which CEX SPOT feeds are reachable, since those are the inputs a DEX
//      index is computed FROM and therefore what we have to read to replicate it
const DEX = [
  ['hyperliquid', 'POST', 'https://api.hyperliquid.xyz/info', { type: 'metaAndAssetCtxs' }],
  ['dydx',        'GET',  'https://indexer.dydx.trade/v4/perpetualMarkets?ticker=BTC-USD'],
  ['paradex',     'GET',  'https://api.prod.paradex.trade/v1/markets/summary?market=BTC-USD-PERP'],
  ['backpack',    'GET',  'https://api.backpack.exchange/api/v1/markPrices?symbol=BTC_USDC_PERP'],
  ['orderly',     'GET',  'https://api.orderly.org/v1/public/futures/PERP_BTC_USDC'],
  ['aevo',        'GET',  'https://api.aevo.xyz/markets?asset=BTC&instrument_type=PERPETUAL'],
  ['apex',        'GET',  'https://omni.apex.exchange/api/v3/ticker?symbol=BTCUSDT'],
  ['aster',       'GET',  'https://fapi.asterdex.com/fapi/v1/premiumIndex?symbol=BTCUSDT'],
  ['hibachi',     'GET',  'https://data-api.hibachi.xyz/market/data/prices?symbol=BTC/USDT-P'],
  ['hotstuff',    'POST', 'https://api.hotstuff.trade/info', { method: 'ticker', params: { symbol: 'BTC-PERP' } }],
  ['ostium',      'GET',  'https://metadata-backend.ostium.io/PricePublish/latest-prices'],
  ['edgex',       'GET',  'https://pro.edgex.exchange/api/v1/public/quote/getTicketSummary?contractId=10000001'],
  ['edgex-meta',  'GET',  'https://pro.edgex.exchange/api/v1/public/meta/getMetaData'],
  ['extended',    'GET',  'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD'],
  ['grvt',        'POST', 'https://market-data.grvt.io/full/v1/ticker', { instrument: 'BTC_USDT_Perp' }],
  ['vest',        'GET',  'https://serverprod.vest.exchange/v2/ticker/latest?symbols=BTC-PERP'],
  ['pacifica',    'GET',  'https://api.pacifica.fi/api/v1/info/prices'],
  ['drift',       'GET',  'https://dlob.drift.trade/l2?marketName=BTC-PERP&depth=1&includeOracle=true'],
  ['lighter',     'GET',  'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails'],
  ['vertex',      'POST', 'https://gateway.prod.vertexprotocol.com/v1/query', { type: 'all_products' }],
  ['bullbit',     'GET',  'https://app.bullbit.ai/api/v1/markets'],
  ['avantis',     'GET',  'https://api.avantisfi.com/v1/prices'],
];

// Hyperliquid's BTC oracle = weighted median of these spot mids:
//   Binance 3, OKX 2, Bybit 2, Kraken 1, KuCoin 1, Gate 1, MEXC 1
const SPOT = [
  ['binance', 'GET', 'https://data-api.binance.vision/api/v3/ticker/bookTicker?symbol=BTCUSDT'],
  ['okx',     'GET', 'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT'],
  ['bybit',   'GET', 'https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT'],
  ['kraken',  'GET', 'https://api.kraken.com/0/public/Ticker?pair=XBTUSDT'],
  ['kucoin',  'GET', 'https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=BTC-USDT'],
  ['gate',    'GET', 'https://api.gateio.ws/api/v4/spot/tickers?currency_pair=BTC_USDT'],
  ['mexc',    'GET', 'https://api.mexc.com/api/v3/ticker/bookTicker?symbol=BTCUSDT'],
];

async function hit([name, method, url, body]) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method, headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000),
    });
    const txt = await r.text();
    return { name, ok: r.ok, status: r.status, ms: Date.now() - t0, txt };
  } catch (e) { return { name, ok: false, status: 'ERR', ms: Date.now() - t0, txt: String(e.message).slice(0, 90) }; }
}

// pull out anything that looks like an index/oracle/mark field
function fields(txt) {
  const hits = [];
  const re = /"([a-zA-Z_]*(?:oracle|index|mark|spot)[a-zA-Z_]*)"\s*:\s*"?(-?[\d.]+)"?/gi;
  let m; const seen = new Set();
  while ((m = re.exec(txt)) && hits.length < 6) {
    if (seen.has(m[1])) continue; seen.add(m[1]);
    hits.push(`${m[1]}=${m[2]}`);
  }
  return hits;
}

(async () => {
  console.log('=== PERP DEXes: who publishes an index/oracle? ===');
  for (const r of await Promise.all(DEX.map(hit))) {
    const f = r.ok ? fields(r.txt) : [];
    console.log(`${r.ok ? 'OK ' : '-- '}${r.name.padEnd(13)} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)}ms  ` +
      (f.length ? f.join('  ') : (r.ok ? '(no index-like field) ' + r.txt.replace(/\s+/g, ' ').slice(0, 90) : r.txt.replace(/\s+/g, ' ').slice(0, 90))));
  }
  console.log('\n=== CEX SPOT sources needed to replicate an index ===');
  for (const r of await Promise.all(SPOT.map(hit))) {
    console.log(`${r.ok ? 'OK ' : '-- '}${r.name.padEnd(13)} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)}ms  ${r.txt.replace(/\s+/g, ' ').slice(0, 160)}`);
  }
})();
