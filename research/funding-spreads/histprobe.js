// Funding HISTORY probe. A snapshot spread is worth nothing — funding flips
// sign all the time. What matters is whether a spread between two venues
// persists, and that needs weeks of settled rates.
//
// This also settles each venue's funding INTERVAL empirically, from the spacing
// between settlement timestamps, rather than trusting my reading of their docs.
const DAY = 86400000;
const since = Date.now() - 14 * DAY;

const H = [
  ['hyperliquid', 'POST', 'https://api.hyperliquid.xyz/info',
    { type: 'fundingHistory', coin: 'BTC', startTime: since }],
  ['binance',   'GET', `https://www.binance.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=200`],
  ['aster',     'GET', `https://fapi.asterdex.com/fapi/v1/fundingRate?symbol=BTCUSDT&limit=200`],
  ['okx',       'GET', 'https://www.okx.com/api/v5/public/funding-rate-history?instId=BTC-USDT-SWAP&limit=100'],
  ['dydx',      'GET', 'https://indexer.dydx.trade/v4/historicalFunding/BTC-USD?limit=200'],
  ['backpack',  'GET', 'https://api.backpack.exchange/api/v1/fundingRates?symbol=BTC_USDC_PERP&limit=200'],
  ['paradex',   'GET', 'https://api.prod.paradex.trade/v1/funding/data?market=BTC-USD-PERP&page_size=200'],
  ['orderly',   'GET', 'https://api.orderly.org/v1/public/funding_rate_history?symbol=PERP_BTC_USDC&page_size=200'],
  ['aevo',      'GET', `https://api.aevo.xyz/funding-history?instrument_name=BTC-PERP&start_time=${since * 1e6}&limit=200`],
  ['apex',      'GET', 'https://omni.apex.exchange/api/v3/history-funding?symbol=BTC-USDT&limit=100'],
  ['extended',  'GET', `https://api.starknet.extended.exchange/api/v1/info/BTC-USD/funding?startTime=${since}&limit=200`],
  ['hibachi',   'GET', 'https://data-api.hibachi.xyz/market/data/funding-rates?symbol=BTC/USDT-P'],
  ['lighter',   'GET', 'https://mainnet.zklighter.elliot.ai/api/v1/fundings?market_id=1&resolution=1h&count_back=100'],
  ['grvt',      'POST', 'https://market-data.grvt.io/full/v1/funding', { instrument: 'BTC_USDT_Perp', limit: 100 }],
];

async function hit([name, method, url, body]) {
  try {
    const r = await fetch(url, {
      method, headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
    });
    return { name, ok: r.ok, status: r.status, txt: await r.text() };
  } catch (e) { return { name, ok: false, status: 'ERR', txt: String(e.message).slice(0, 80) }; }
}

(async () => {
  for (const r of await Promise.all(H.map(hit))) {
    console.log(`\n${r.ok ? 'OK ' : '-- '}${r.name.padEnd(12)} ${r.status}`);
    console.log(`   ${r.txt.replace(/\s+/g, ' ').slice(0, 340)}`);
  }
})();
