// Oracle-execution venues: no order book, you fill AT the oracle price plus a
// spread. This is the one venue class where an oracle lag is reachable, so the
// question per venue is: how stale is the oracle, and how wide is the spread
// they defend it with.
const UA = { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } };
const T = [
  ['gains-vars',   'https://backend-arbitrum.gains.trade/trading-variables'],
  ['gains-price',  'https://backend-pricing.gains.trade/charts'],
  ['gains-base',   'https://backend-arbitrum.gains.trade/'],
  ['avantis-1',    'https://api.avantisfi.com/v1/prices'],
  ['avantis-2',    'https://api.avantisfi.com/v1/trading-pairs'],
  ['avantis-3',    'https://socket.avantisfi.com/v1/prices'],
  ['gmx-tickers',  'https://arbitrum-api.gmxinfra.io/prices/tickers'],
  ['gmx-signed',   'https://arbitrum-api.gmxinfra.io/signed_prices/latest'],
  ['gmx-alt',      'https://arbitrum-api.gmxinfra2.io/prices/tickers'],
  ['jup-v1',       'https://perps-api.jup.ag/v1/positions?walletAddress=x'],
  ['jup-pools',    'https://perps-api.jup.ag/v1/pool-info'],
  ['jup-v2',       'https://perps-api.jup.ag/v2/markets'],
  ['levana',       'https://querier-mainnet.levana.finance/v1/perps/markets'],
  ['hmx',          'https://api.hmx.org/v1/markets'],
  ['adrena',       'https://datapi.adrena.xyz/last-trading-price'],
  ['adrena-2',     'https://datapi.adrena.xyz/poolinfo'],
  ['ostium-ref',   'https://metadata-backend.ostium.io/PricePublish/latest-prices'],
];
(async () => {
  for (const [n, u] of T) {
    try {
      const r = await fetch(u, { ...UA, signal: AbortSignal.timeout(12000) });
      const t = await r.text();
      console.log(`${n.padEnd(13)} ${String(r.status).padEnd(4)} ${t.replace(/\s+/g, ' ').slice(0, 185)}`);
    } catch (e) { console.log(`${n.padEnd(13)} ERR  ${String(e.message).slice(0, 60)}`); }
  }
})();
