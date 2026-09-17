// Perp DEX directory: pull DefiLlama's protocol registry, filter to derivatives,
// and check whether each listed site actually answers.
//
// Volume would be the better sort key, but DefiLlama's volume endpoints
// (/overview/derivatives, /summary/derivatives/*) return 402 without a paid
// plan, so this sorts by listing date and verifies liveness instead. A site
// that responds is a weak signal — it says nothing about liquidity or whether
// withdrawals work — so treat the output as a candidate list to verify.
const fs = require('fs');
const YEAR = Number(process.env.YEAR || 2026);

(async () => {
  const all = await (await fetch('https://api.llama.fi/protocols', { signal: AbortSignal.timeout(60000) })).json();
  const perps = all.filter((p) => /deriv|perp|futur/i.test(p.category || ''));
  console.log(`derivatives protocols: ${perps.length}`);

  const cohort = perps
    .filter((p) => p.listedAt && new Date(p.listedAt * 1000).getUTCFullYear() >= YEAR)
    .sort((a, b) => b.listedAt - a.listedAt);
  console.log(`listed ${YEAR} or later: ${cohort.length}\n`);

  const check = async (p) => {
    let st = 'no url';
    if (p.url) {
      try { st = String((await fetch(p.url, { signal: AbortSignal.timeout(12000), redirect: 'follow' })).status); }
      catch { st = 'DEAD'; }
    }
    return { dt: new Date(p.listedAt * 1000).toISOString().slice(0, 10), name: p.name,
             chain: p.chain || (p.chains || [])[0] || '', url: p.url || '', st };
  };

  const out = [];
  for (let i = 0; i < cohort.length; i += 8) out.push(...await Promise.all(cohort.slice(i, i + 8).map(check)));

  console.log('listed        site   name                      chain               url');
  for (const r of out) {
    console.log(`${r.dt}   ${r.st.padEnd(6)} ${r.name.slice(0, 24).padEnd(25)} ${String(r.chain).slice(0, 18).padEnd(19)} ${r.url.replace(/^https?:\/\//, '').slice(0, 34)}`);
  }
  const live = out.filter((r) => r.st === '200').length;
  console.log(`\n${live} of ${out.length} have a site that answers.`);
  fs.writeFileSync(`${__dirname}/directory_${YEAR}.json`, JSON.stringify(out, null, 1));
})();
