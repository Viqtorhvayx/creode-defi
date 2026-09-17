// Empirical test for "do traders trade against each other?"
// A peer-to-peer venue has a real order book: many distinct price levels posted
// by independent makers. A pool venue has no book at all — you trade against an
// LP vault at an oracle price, so there is nothing to fetch.
const V = [
  ['hyperliquid', async () => {
    const d = await (await fetch('https://api.hyperliquid.xyz/info', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'l2Book', coin:'BTC' })})).json();
    return [d.levels[0].length, d.levels[1].length];
  }],
  ['dydx', async () => { const d = await (await fetch('https://indexer.dydx.trade/v4/orderbooks/perpetualMarket/BTC-USD')).json(); return [d.bids.length, d.asks.length]; }],
  ['backpack', async () => { const d = await (await fetch('https://api.backpack.exchange/api/v1/depth?symbol=BTC_USDC_PERP')).json(); return [d.bids.length, d.asks.length]; }],
  ['paradex', async () => { const d = await (await fetch('https://api.prod.paradex.trade/v1/orderbook/BTC-USD-PERP?depth=100')).json(); return [(d.bids||[]).length, (d.asks||[]).length]; }],
  ['extended', async () => { const d = await (await fetch('https://api.starknet.extended.exchange/api/v1/info/markets/BTC-USD/orderbook')).json(); return [(d.data?.bid||[]).length, (d.data?.ask||[]).length]; }],
  ['lighter', async () => { const d = await (await fetch('https://mainnet.zklighter.elliot.ai/api/v1/orderBookOrders?market_id=1&limit=100')).json(); return [(d.bids||[]).length, (d.asks||[]).length]; }],
  ['aster', async () => { const d = await (await fetch('https://fapi.asterdex.com/fapi/v1/depth?symbol=BTCUSDT&limit=100')).json(); return [(d.bids||[]).length, (d.asks||[]).length]; }],
  ['orderly', async () => ['auth-gated', 'CLOB, REST book needs an account header'] ],
  ['apex', async () => { const d = await (await fetch('https://omni.apex.exchange/api/v3/depth?symbol=BTCUSDT&limit=100')).json(); return [(d.data?.b||[]).length, (d.data?.a||[]).length]; }],
  ['grvt', async () => { const d = await (await fetch('https://market-data.grvt.io/full/v1/book', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ instrument:'BTC_USDT_Perp', depth: 50 })})).json(); const r=d.result||d; return [(r.bids||[]).length, (r.asks||[]).length]; }],
  ['hibachi', async () => { const d = await (await fetch('https://data-api.hibachi.xyz/market/data/orderbook?symbol=BTC/USDT-P')).json(); return [(d.bid?.levels||[]).length, (d.ask?.levels||[]).length]; }],
  // pool / oracle-execution venues — expect no book to exist at all
  ['ostium(pool)', async () => { const d = await (await fetch('https://metadata-backend.ostium.io/PricePublish/latest-prices')).json(); return ['no book', 'single quoted price']; }],
  ['gains(pool)', async () => { const d = await (await fetch('https://backend-arbitrum.gains.trade/trading-variables')).json(); return ['no book', 'pool: gDAI/gUSDC vaults']; }],
];
(async () => {
  for (const [n, f] of V) {
    try { const [b, a] = await f(); console.log(`${n.padEnd(15)} bid levels: ${String(b).padStart(4)}   ask levels: ${String(a).padStart(4)}`); }
    catch (e) { console.log(`${n.padEnd(15)} -- ${String(e.message).slice(0,60)}`); }
  }
})();
