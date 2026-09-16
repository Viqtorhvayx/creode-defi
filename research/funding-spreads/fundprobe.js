// Funding rate probe. The point of this pass is NOT the numbers — it is the
// INTERVALS. Venues quote funding per-hour or per-8h with no consistent
// labelling, so a naive table mixing the two overstates a spread by 8x. Pull
// the raw payloads, find the rate field AND the next-funding timestamp, and
// work out each venue's period before comparing anything.
const V = [
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
  ['extended',    'GET',  'https://api.starknet.extended.exchange/api/v1/info/markets?market=BTC-USD'],
  ['lighter',     'GET',  'https://mainnet.zklighter.elliot.ai/api/v1/funding-rates'],
  ['grvt',        'POST', 'https://market-data.grvt.io/full/v1/ticker', { instrument: 'BTC_USDT_Perp' }],
  ['vest',        'GET',  'https://serverprod.vest.exchange/v2/ticker/latest?symbols=BTC-PERP'],
  ['pacifica',    'GET',  'https://api.pacifica.fi/api/v1/info/prices'],
  ['edgex',       'GET',  'https://pro.edgex.exchange/api/v1/public/funding/getLatestFundingRate?contractId=10000001'],
  // CEX reference legs — the other side of a real carry trade
  ['binance-cex', 'GET',  'https://www.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'],
  ['bybit-cex',   'GET',  'https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT'],
  ['okx-cex',     'GET',  'https://www.okx.com/api/v5/public/funding-rate?instId=BTC-USDT-SWAP'],
];

async function hit([name, method, url, body]) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, {
      method, headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000),
    });
    return { name, ok: r.ok, status: r.status, ms: Date.now() - t0, txt: await r.text() };
  } catch (e) { return { name, ok: false, status: 'ERR', ms: Date.now() - t0, txt: String(e.message).slice(0, 90) }; }
}

// surface every field that could be a funding rate or a funding timestamp
function fundFields(txt) {
  const out = [];
  const seen = new Set();
  const re = /"([a-zA-Z_]*(?:funding|Funding)[a-zA-Z_]*)"\s*:\s*"?(-?[\d.eE+]+|null)"?/g;
  let m;
  while ((m = re.exec(txt)) && out.length < 10) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(`${m[1]}=${m[2]}`);
  }
  return out;
}

(async () => {
  const now = Date.now();
  console.log(`now = ${now} (${new Date(now).toISOString()})\n`);
  for (const r of await Promise.all(V.map(hit))) {
    const f = r.ok ? fundFields(r.txt) : [];
    console.log(`${r.ok ? 'OK ' : '-- '}${r.name.padEnd(13)} ${String(r.status).padEnd(4)} ${String(r.ms).padStart(5)}ms`);
    if (f.length) console.log(`      ${f.join('  ')}`);
    else console.log(`      ${r.txt.replace(/\s+/g, ' ').slice(0, 150)}`);
  }
})();
