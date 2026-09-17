// Load each venue's trading page in a real browser and record every network
// call it makes. Guessing REST paths failed on all 19 hosts; watching the app
// talk is definitive.
//
// NOTE: ignoreHTTPSErrors is on because this sandbox's proxy cert is not in
// Chromium's trust store. That is acceptable for reconnaissance — we are
// reading public market data, not authenticating anything — but it means these
// responses are not certificate-verified and should not be treated as
// trustworthy beyond "this endpoint exists and returns this shape".
const { chromium } = require('playwright');
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';

const SITES = [
  ['perpl', 'https://app.perpl.xyz/trade'],
  ['decibel', 'https://app.decibel.trade/trade'],
  ['drake', 'https://drake.exchange/'],
  ['katana', 'https://perps.katana.network/'],
  ['arcus', 'https://app.arcus.xyz/trade/perpetuals'],
  ['ondo', 'https://app.ondoperps.xyz'],
  ['truedex', 'https://app.truefinance.ai/perps'],
  ['afx', 'https://app.afx.xyz/trade'],
];

const NOISE = /google|gstatic|sentry|intercom|segment|mixpanel|amplitude|posthog|walletconnect|privy|dynamic|reown|datadog|clarity|\.(png|jpg|svg|woff2?|css|ico|webp|gif)(\?|$)/i;
const PRICEY = /"(index|oracle|mark|last|spot|funding|bid|ask|mid)[_a-zA-Z]*(price|px|rate|Px)?"\s*:|\bpx\b|\bmarkPrice\b/i;

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const out = {};
  for (const [name, url] of SITES) {
    const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    const calls = new Map();
    const sockets = new Set();

    page.on('response', async (res) => {
      try {
        const u = res.url();
        if (NOISE.test(u)) return;
        const ct = res.headers()['content-type'] || '';
        if (!/json|text\/plain/i.test(ct)) return;
        const body = await res.text().catch(() => '');
        if (!body || body.length < 30) return;
        const key = u.split('?')[0];
        if (calls.has(key)) return;
        calls.set(key, { status: res.status(), pricey: PRICEY.test(body), sample: body.replace(/\s+/g, ' ').slice(0, 180) });
      } catch { /* body already consumed or navigation raced */ }
    });
    // Capture actual WS frames, not just the URL. On most of these venues the
    // price never travels over REST at all.
    const frames = [];
    page.on('websocket', (ws) => {
      sockets.add(ws.url());
      ws.on('framereceived', (f) => {
        try {
          const d = typeof f.payload === 'string' ? f.payload : f.payload.toString();
          if (d && d.length > 40 && PRICEY.test(d) && frames.length < 4) frames.push({ ws: ws.url(), d: d.replace(/\s+/g, ' ').slice(0, 220) });
        } catch { /* binary frame */ }
      });
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(25000);
    } catch { /* still keep whatever was captured before the timeout */ }

    const priced = [...calls.entries()].filter(([, v]) => v.pricey);
    out[name] = { url, priced: priced.map(([k, v]) => ({ url: k, sample: v.sample })), sockets: [...sockets], frames };

    console.log(`\n=== ${name} ===`);
    if (priced.length) {
      for (const [k, v] of priced.slice(0, 4)) console.log(`  REST ${k}\n       ${v.sample}`);
    } else {
      console.log(`  (no price-shaped REST captured; ${calls.size} json calls seen)`);
      for (const k of [...calls.keys()].slice(0, 4)) console.log(`       ${k}`);
    }
    for (const w of [...sockets].slice(0, 3)) console.log(`  WS   ${w}`);
    for (const f of frames.slice(0, 2)) console.log(`  FRAME ${f.ws}\n       ${f.d}`);
    await ctx.close();
  }
  fs.writeFileSync(`${S}/netcap.json`, JSON.stringify(out, null, 1));
  await browser.close();
})();
