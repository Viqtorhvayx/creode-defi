// Find the price feed for the peer-to-pool venues whose documented endpoints
// are dead. Same technique that cracked Gains: load the real trading app in a
// browser, record every host it calls and every websocket frame it receives,
// then pick out the payloads that are price-shaped.
//
// These four are the last unmeasured venues in the only class where the oracle
// IS the fill price — which is the only class where a slow oracle would mean
// anything, because everywhere else the order book ignores it.
const { chromium } = require('playwright');

const SITES = [
  ['veranta', 'https://www.veranta.xyz/trade'],
  ['desk', 'https://desk.exchange/trade'],
  
  
];

// Anything that looks like it carries a number a trader would recognise.
const PRICEY = /"(price|px|p|mid|mark|index|oracle|last|bid|ask|c|close)"\s*:/i;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [name, url] of SITES) {
    const ctx = await b.newContext({
      viewport: { width: 1500, height: 1000 },
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    const page = await ctx.newPage();
    const hosts = new Map();
    const sockets = new Map();

    page.on('request', (r) => {
      try {
        const u = new URL(r.url());
        if (u.protocol === 'data:') return;
        const e = hosts.get(u.host) || { n: 0, paths: new Set() };
        e.n++;
        if (e.paths.size < 8) e.paths.add(u.pathname.slice(0, 60));
        hosts.set(u.host, e);
      } catch {}
    });
    page.on('websocket', (ws) => {
      const e = { frames: 0, sample: [], sent: [] };
      sockets.set(ws.url(), e);
      ws.on('framereceived', (d) => {
        e.frames++;
        const p = typeof d.payload === 'string' ? d.payload : d.payload.toString('utf8');
        if (e.sample.length < 3 && (PRICEY.test(p) || e.frames < 3)) e.sample.push(p.slice(0, 340));
      });
      ws.on('framesent', (d) => {
        const p = typeof d.payload === 'string' ? d.payload : d.payload.toString('utf8');
        if (e.sent.length < 3) e.sent.push(p.slice(0, 220));
      });
    });

    console.log(`\n${'='.repeat(78)}\n${name.toUpperCase()}  ${url}\n${'='.repeat(78)}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 75000 });
    } catch (e) {
      console.log('goto:', e.message.slice(0, 120));
    }
    await page.waitForTimeout(32000);

    const own = new URL(url).host;
    const third = [...hosts.entries()].filter(([h]) => h !== own && !/google|sentry|intercom|cloudflare|segment|amplitude|posthog|hotjar|mixpanel|datadog|vercel|appsflyer/i.test(h));
    console.log('\nthird-party hosts it calls:');
    third.sort((a, b) => b[1].n - a[1].n).slice(0, 14)
      .forEach(([h, e]) => console.log(`  ${String(e.n).padStart(4)}  ${h}  ${[...e.paths].slice(0, 4).join(' ')}`));

    console.log('\nwebsockets:');
    if (!sockets.size) console.log('  (none)');
    for (const [u, e] of sockets) {
      console.log(`  > ${u}   frames=${e.frames}`);
      e.sent.forEach((s) => console.log(`      SENT ${s}`));
      e.sample.forEach((s) => console.log(`      RECV ${s}`));
    }
    console.log('\ntitle:', await page.title().catch(() => '?'));
    await page.screenshot({ path: `${__dirname}/pool_${name}.png` }).catch(() => {});
    await ctx.close();
  }
  await b.close();
})();
