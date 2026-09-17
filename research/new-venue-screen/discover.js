// API discovery for new perp DEXes that publish no docs.
//
// Fetch the app, pull every script it loads, and grep the bundles for API hosts
// and price-shaped paths. This is how Margex, Aark and Hotstuff were opened up
// earlier in the session — the frontend has to talk to something, and the base
// URL is always sitting in the bundle.
const fs = require('fs');
const S = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';

const SITES = [
  ['truedex', 'https://app.truefinance.ai/perps'],
  ['strat', 'https://app.strat.trade'],
  ['hertzflow', 'https://www.hertzflow.xyz/'],
  ['arcus', 'https://arcus.xyz/'],
  ['drake', 'https://drake.exchange/'],
  ['meridian', 'https://app.meridian.xyz/'],
  ['katana', 'https://perps.katana.network/'],
  ['afx', 'https://app.afx.xyz/trade'],
  ['wikicious', 'https://wikicious.io'],
  ['waterx', 'https://waterx.app/en'],
  ['obsdn', 'https://obsdn.trade'],
  ['ondoperps', 'https://app.ondoperps.xyz'],
  ['bulk', 'https://www.bulk.trade/'],
  ['brokex', 'https://brokex.trade'],
  ['likwid', 'https://likwid.fi'],
  ['flamix', 'https://app.flamix.trade/'],
  ['euphoria', 'https://euphoria.finance'],
  ['risex', 'https://www.rise.trade/en'],
  ['updown', 'https://www.updown.xyz'],
  ['bounce', 'https://bounce.tech/'],
  ['tristero', 'https://www.tristero.com/'],
  ['phoenix', 'https://phoenix.trade'],
  ['rocket', 'https://beta.rocketfi.io/trade'],
  ['perpl', 'https://perpl.xyz/'],
  ['2xswap', 'https://2xswap.com'],
  ['decibel', 'https://app.decibel.trade/trade'],
  ['normal', 'https://www.normalfinance.io/'],
  ['100xsoon', 'https://100xsoon.com/'],
  ['denaria', 'https://denaria.finance'],
  ['sai', 'https://sai.fun/'],
  ['gmtrade', 'https://gmtrade.xyz'],
  ['corex', 'https://corex.markets/'],
  ['mooncake', 'https://app.mooncake.fi/'],
];

const UA = { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36' };

// hosts that are infrastructure noise rather than the venue's own API
const NOISE = /google|gstatic|cloudflare|sentry|intercom|hotjar|segment|mixpanel|amplitude|posthog|walletconnect|infura|alchemy|ankr|rpc\.|cdn\.|fonts|vercel|gtm|doubleclick|facebook|twitter|discord|telegram|coingecko|jsdelivr|unpkg|privy|dynamic|reown|w3m|metamask|datadog|bugsnag|newrelic|clarity|tiktok/i;

async function grab(url, timeout = 20000) {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeout), redirect: 'follow' });
  return { ok: r.ok, status: r.status, text: await r.text() };
}

function hosts(text, origin) {
  const out = new Map();
  // absolute API-ish URLs
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(\/[a-zA-Z0-9_\-/.]*)?/gi)) {
    const host = m[1].toLowerCase();
    if (NOISE.test(host)) continue;
    if (!/api|data|backend|indexer|quote|market|trade|perp|gateway|server|feed|price|md\./i.test(host + (m[2] || ''))) continue;
    const key = host + (m[2] ? m[2].split('/').slice(0, 3).join('/') : '');
    out.set(key, (out.get(key) || 0) + 1);
  }
  // wss endpoints
  for (const m of text.matchAll(/wss?:\/\/([a-z0-9.-]+\.[a-z]{2,})(\/[a-zA-Z0-9_\-/.]*)?/gi)) {
    const host = m[1].toLowerCase();
    if (NOISE.test(host)) continue;
    out.set('ws:' + host + (m[2] || ''), (out.get('ws:' + host + (m[2] || '')) || 0) + 1);
  }
  return out;
}

(async () => {
  const results = {};
  for (const [name, url] of SITES) {
    try {
      const page = await grab(url);
      if (!page.ok) { console.log(`${name.padEnd(12)} site ${page.status}`); results[name] = { error: page.status }; continue; }
      const origin = new URL(url).origin;
      const found = hosts(page.text, origin);

      // pull the first handful of same-origin scripts and grep those too
      const scripts = [...page.text.matchAll(/<script[^>]+src="([^"]+)"/gi)].map((m) => m[1]).slice(0, 6);
      for (const s of scripts) {
        const abs = s.startsWith('http') ? s : origin + (s.startsWith('/') ? '' : '/') + s;
        try {
          const js = await grab(abs, 20000);
          if (!js.ok) continue;
          for (const [k, v] of hosts(js.text, origin)) found.set(k, (found.get(k) || 0) + v);
        } catch { /* bundle unreachable */ }
      }
      const top = [...found.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k]) => k);
      results[name] = { url, candidates: top };
      console.log(`${name.padEnd(12)} ${top.length ? top.join('  ') : '(nothing api-shaped found)'}`);
    } catch (e) {
      console.log(`${name.padEnd(12)} ERR ${String(e.message).slice(0, 50)}`);
      results[name] = { error: String(e.message).slice(0, 80) };
    }
  }
  fs.writeFileSync(`${S}/discover.json`, JSON.stringify(results, null, 1));
})();
