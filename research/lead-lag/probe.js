// Reachability + shape probe across perp venues and oracles.
// Goal: find which public price endpoints work from here, what field holds a
// tradable price, and whether they carry their own server timestamp (needed to
// separate real lead/lag from my own network latency).
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';

const V = [
  // --- CEX perps (and Binance spot as the incumbent reference) ---
  ['binance-spot',   'GET',  'https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT'],
  ['binance-spot-bt','GET',  'https://data-api.binance.vision/api/v3/ticker/bookTicker?symbol=BTCUSDT'],
  ['binance-perp',   'GET',  'https://fapi.binance.com/fapi/v1/ticker/bookTicker?symbol=BTCUSDT'],
  ['binance-perp-pi','GET',  'https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT'],
  ['bybit',          'GET',  'https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT'],
  ['okx',            'GET',  'https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT-SWAP'],
  ['bitget',         'GET',  'https://api.bitget.com/api/v2/mix/market/ticker?symbol=BTCUSDT&productType=usdt-futures'],
  ['gate',           'GET',  'https://api.gateio.ws/api/v4/futures/usdt/tickers?contract=BTC_USDT'],
  ['mexc',           'GET',  'https://contract.mexc.com/api/v1/contract/ticker?symbol=BTC_USDT'],
  ['kucoin',         'GET',  'https://api-futures.kucoin.com/api/v1/ticker?symbol=XBTUSDTM'],
  ['deribit',        'GET',  'https://www.deribit.com/api/v2/public/ticker?instrument_name=BTC-PERPETUAL'],
  ['bitmex',         'GET',  'https://www.bitmex.com/api/v1/instrument?symbol=XBTUSD'],
  ['kraken-fut',     'GET',  'https://futures.kraken.com/derivatives/api/v3/tickers'],
  ['woo',            'GET',  'https://api.woox.io/v1/public/futures/PERP_BTC_USDT'],
  ['phemex',         'GET',  'https://api.phemex.com/md/v3/ticker/24hr?symbol=BTCUSDT'],
  ['htx',            'GET',  'https://api.hbdm.com/linear-swap-ex/market/bbo?contract_code=BTC-USDT'],
  ['coinex',         'GET',  'https://api.coinex.com/v2/futures/ticker?market=BTCUSDT'],

  // --- Perp DEXes ---
  ['hyperliquid',    'POST', 'https://api.hyperliquid.xyz/info', { type: 'allMids' }],
  ['hyperliquid-ctx','POST', 'https://api.hyperliquid.xyz/info', { type: 'metaAndAssetCtxs' }],
  ['dydx',           'GET',  'https://indexer.dydx.trade/v4/perpetualMarkets?ticker=BTC-USD'],
  ['aevo',           'GET',  'https://api.aevo.xyz/ticker?instrument_name=BTC-PERP&instrument_type=PERPETUAL'],
  ['paradex',        'GET',  'https://api.prod.paradex.trade/v1/markets/summary?market=BTC-USD-PERP'],
  ['drift',          'GET',  'https://dlob.drift.trade/l2?marketName=BTC-PERP&depth=1'],
  ['backpack',       'GET',  'https://api.backpack.exchange/api/v1/markPrices?symbol=BTC_USDC_PERP'],
  ['backpack-tick',  'GET',  'https://api.backpack.exchange/api/v1/ticker?symbol=BTC_USDC_PERP'],
  ['lighter',        'GET',  'https://mainnet.zklighter.elliot.ai/api/v1/orderBookDetails'],
  ['extended',       'GET',  'https://api.extended.exchange/api/v1/info/markets?market=BTC-USD'],
  ['orderly',        'GET',  'https://api.orderly.org/v1/public/futures/PERP_BTC_USDC'],
  ['apex',           'GET',  'https://omni.apex.exchange/api/v3/ticker?symbol=BTCUSDT'],
  ['vertex',         'POST', 'https://gateway.prod.vertexprotocol.com/v1/query', { type: 'all_products' }],
  ['grvt',           'GET',  'https://market-data.grvt.io/full/v1/ticker?instrument=BTC_USDT_Perp'],
  ['edgex',          'GET',  'https://pro.edgex.exchange/api/v1/public/quote/getTicketSummary?contractId=10000001'],
  ['aster',          'GET',  'https://fapi.asterdex.com/fapi/v1/ticker/bookTicker?symbol=BTCUSDT'],
  ['hibachi',        'GET',  'https://data-api.hibachi.xyz/market/data/prices?symbol=BTC/USDT-P'],
  ['ostium',         'GET',  'https://metadata-backend.ostium.io/PricePublish/latest-prices'],
  ['avantis',        'GET',  'https://api.avantisfi.com/v1/pairs'],
  ['hotstuff',       'POST', 'https://api.hotstuff.trade/info', { method: 'ticker', params: { symbol: 'BTC-PERP' } }],

  // --- Oracles ---
  ['pyth',           'GET',  'https://hermes.pyth.network/v2/updates/price/latest?ids[]=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'],
  ['redstone',       'GET',  'https://api.redstone.finance/prices?symbol=BTC&provider=redstone&limit=1'],
  ['stork',          'GET',  'https://rest.jp.stork-oracle.network/v1/prices/latest?assets=BTCUSD'],
  ['switchboard',    'GET',  'https://crossbar.switchboard.xyz/simulate/solana/mainnet/0x0000'],
];

async function probe([name, method, url, body]) {
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12000),
    });
    const ms = Date.now() - t0;
    const text = await res.text();
    return { name, ok: res.ok, status: res.status, ms, len: text.length, sample: text.slice(0, 600) };
  } catch (e) {
    return { name, ok: false, status: 'ERR', ms: Date.now() - t0, err: String(e.message || e).slice(0, 120) };
  }
}

(async () => {
  const out = await Promise.all(V.map(probe));
  for (const r of out) {
    console.log(`${r.ok ? 'OK ' : '-- '} ${r.name.padEnd(17)} ${String(r.status).padEnd(5)} ${String(r.ms).padStart(6)}ms  ${r.err ? 'ERR ' + r.err : (r.sample || '').replace(/\s+/g, ' ').slice(0, 260)}`);
  }
  require('fs').writeFileSync(`${SCRATCH}/probe.json`, JSON.stringify(out, null, 1));
})();
