// Stream the raw capture down to per-feed price-change events. The raw file is
// hundreds of MB, most of it repeated mids (book size changes that don't move
// the price), which carry no information for a lead/lag test.
const fs = require('fs');
const readline = require('readline');
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const IN = process.argv[2] || `${SCRATCH}/ticks.jsonl`;
const OUT = process.argv[3] || `${SCRATCH}/reduced.json`;

const out = {};       // "feed|asset" -> { t:[], s:[], m:[] }
const stats = {};
(async () => {
  const rl = readline.createInterface({ input: fs.createReadStream(IN), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const key = `${r.f}|${r.k}`;
    const o = (out[key] ||= { t: [], s: [], m: [] });
    stats[key] = (stats[key] || 0) + 1;
    const n = o.m.length;
    if (n && o.m[n - 1] === r.m) continue;   // price unchanged
    o.t.push(r.l); o.s.push(r.s ?? null); o.m.push(r.m);
  }
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('feed                    raw    price-changes   span_s');
  for (const k of Object.keys(out).sort()) {
    const o = out[k];
    const span = o.t.length > 1 ? (o.t[o.t.length - 1] - o.t[0]) / 1000 : 0;
    console.log(`${k.padEnd(24)} ${String(stats[k]).padStart(8)} ${String(o.m.length).padStart(14)} ${span.toFixed(0).padStart(8)}`);
  }
})();
