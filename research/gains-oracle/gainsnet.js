// Reverse-engineer the Gains trading page: which host serves the price feed?
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({
    viewport: { width: 1500, height: 1000 },
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await ctx.newPage();

  const hosts = new Map();     // host -> {n, sample}
  const sockets = new Map();   // url -> {frames, sample[]}

  page.on('request', (r) => {
    try {
      const u = new URL(r.url());
      if (u.protocol === 'data:') return;
      const k = u.host;
      const e = hosts.get(k) || { n: 0, paths: new Set() };
      e.n++;
      if (e.paths.size < 12) e.paths.add(u.pathname);
      hosts.set(k, e);
    } catch {}
  });

  page.on('websocket', (ws) => {
    const url = ws.url();
    const e = { frames: 0, sample: [] };
    sockets.set(url, e);
    ws.on('framereceived', (d) => {
      e.frames++;
      const p = typeof d.payload === 'string' ? d.payload : d.payload.toString('utf8');
      if (e.sample.length < 4) e.sample.push(p.slice(0, 420));
    });
    ws.on('framesent', (d) => {
      const p = typeof d.payload === 'string' ? d.payload : d.payload.toString('utf8');
      if (!e.sent) e.sent = [];
      if (e.sent.length < 3) e.sent.push(p.slice(0, 300));
    });
  });

  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));

  console.log('loading https://gains.trade/trading ...');
  try {
    await page.goto('https://gains.trade/trading', { waitUntil: 'domcontentloaded', timeout: 90000 });
  } catch (e) {
    console.log('goto:', e.message.slice(0, 200));
  }
  await page.waitForTimeout(30000);

  console.log('\n=== HOSTS ===');
  [...hosts.entries()].sort((a, b) => b[1].n - a[1].n).forEach(([h, e]) => {
    console.log(String(e.n).padStart(4), h, '  ', [...e.paths].slice(0, 6).join(' '));
  });

  console.log('\n=== WEBSOCKETS ===');
  if (!sockets.size) console.log('(none)');
  for (const [u, e] of sockets) {
    console.log('\n>', u, ' frames=', e.frames);
    (e.sent || []).forEach((s) => console.log('   SENT', s));
    e.sample.forEach((s) => console.log('   RECV', s));
  }

  const title = await page.title().catch(() => '?');
  console.log('\ntitle:', title);
  console.log('errors:', errs.slice(0, 4).join(' | ') || 'none');
  await page.screenshot({ path: __dirname + '/gains.png', fullPage: false }).catch(() => {});
  await b.close();
})();
