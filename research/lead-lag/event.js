// Event study: on the sharpest moves of the tape, which venue got there first?
//
// This is the question a trader actually cares about, and it is harder to fool
// than an average-over-everything statistic. For each large move we find, per
// venue, the first moment that venue's mid crosses the halfway point of the
// move, and report it relative to the reference venue's crossing. A venue with
// a real lead crosses EARLIER (negative) and does so repeatedly.
//
// Crossing times are taken on venue server clocks. Events are located on the
// reference, but the crossing threshold is defined per venue from its own
// pre-move level, so a venue sitting at a persistent basis is not penalised.
const fs = require('fs');
const SCRATCH = '/tmp/claude-0/-home-user-creode-defi/ef0562f8-d8a2-5d33-8cc9-73e6d1ac334e/scratchpad';
const RED = JSON.parse(fs.readFileSync(process.argv[2] || `${SCRATCH}/reduced.json`, 'utf8'));
const ASSET = process.env.ASSET || 'BTC';
const REF = process.env.REF || (ASSET === 'BTC' ? 'binance-perp' : 'binance-hype');
const CONFIRM = Number(process.env.CONFIRM || 0);
const WIN = 400;        // ms: the window a "fast move" has to happen inside
const PRE = 1500, POST = 4000;

const median = (a) => { if (!a.length) return NaN; const s = Float64Array.from(a).sort(); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };

const feeds = {};
for (const key of Object.keys(RED)) {
  const [name, asset] = key.split('|');
  if (asset !== ASSET) continue;
  const o = RED[key];
  const pts = [];
  for (let i = 0; i < o.m.length; i++) {
    const srv = o.s[i] != null && Math.abs(o.t[i] - o.s[i]) < 60000 ? o.s[i] : o.t[i];
    pts.push([srv, o.m[i]]);
  }
  pts.sort((a, b) => a[0] - b[0]);
  if (pts.length >= 150) feeds[name] = { t: Float64Array.from(pts.map((p) => p[0])), m: Float64Array.from(pts.map((p) => p[1])) };
}
const ref = feeds[REF];
if (!ref) { console.error('no reference'); process.exit(1); }

const idxAt = (f, t) => { // last index at or before t
  const T = f.t; if (t < T[0]) return -1;
  let lo = 0, hi = T.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (T[mid] <= t) lo = mid; else hi = mid - 1; }
  return lo;
};
const valAt = (f, t) => { const i = idxAt(f, t); return i < 0 ? NaN : f.m[i]; };

// --- locate sharp moves on the reference ---
const events = [];
for (let i = 0; i < ref.t.length; i++) {
  const t0 = ref.t[i], p0 = ref.m[i];
  const j = idxAt(ref, t0 + WIN);
  if (j < 0) continue;
  const p1 = ref.m[j];
  const d = p1 - p0;
  if (Math.abs(d) / p0 < 0.0004) continue;         // >= 4bp inside WIN ms
  if (events.length && t0 - events[events.length - 1].t0 < 3000) {
    if (Math.abs(d) > Math.abs(events[events.length - 1].d)) events[events.length - 1] = { t0, p0, p1, d };
    continue;                                       // keep the biggest in each cluster
  }
  events.push({ t0, p0, p1, d });
}

const names = Object.keys(feeds).sort();
console.log(`\n=== ${ASSET} event study · ${events.length} sharp moves (>=4bp in ${WIN}ms) · located on ${REF} ===`);
if (!events.length) process.exit(0);
console.log(`median move size ${median(events.map((e) => Math.abs(e.d))).toFixed(2)}\n`);

const cross = {};   // venue -> [ms relative to reference crossing]
for (const e of events) {
  const times = {};
  for (const n of names) {
    const f = feeds[n];
    const base = valAt(f, e.t0 - PRE);             // that venue's own pre-move level
    if (!Number.isFinite(base)) continue;
    const target = base + e.d / 2;                  // halfway through the move, in its own terms
    const up = e.d > 0;
    let hit = null;
    let i = idxAt(f, e.t0 - PRE);
    if (i < 0) continue;
    for (; i < f.t.length && f.t[i] <= e.t0 + POST; i++) {
      if (up ? f.m[i] >= target : f.m[i] <= target) {
        // Require the move to STICK. A wide or jittery book crosses a
        // threshold early by accident and falls back; a venue that genuinely
        // got there first is still there a moment later.
        if (CONFIRM > 0) {
          const v = valAt(f, f.t[i] + CONFIRM);
          if (!Number.isFinite(v) || (up ? v < target : v > target)) continue;
        }
        hit = f.t[i]; break;
      }
    }
    if (hit != null) times[n] = hit;
  }
  if (times[REF] == null) continue;
  for (const n of Object.keys(times)) (cross[n] ||= []).push(times[n] - times[REF]);
}

console.log('venue              n_events   median_ms   p25    p75   times_first');
const firstCount = {};
for (const e of events) { /* recomputed below */ }
const rows = [];
for (const n of names) {
  const a = cross[n];
  if (!a || a.length < Math.max(5, events.length * 0.4)) { console.log(`${n.padEnd(18)} ${String(a ? a.length : 0).padStart(8)}   (too few crossings to judge)`); continue; }
  const s = [...a].sort((x, y) => x - y);
  rows.push({ n, med: median(a), p25: s[Math.floor(s.length * 0.25)], p75: s[Math.floor(s.length * 0.75)], k: a.length, wins: a.filter((x) => x < 0).length });
}
for (const r of rows.sort((a, b) => a.med - b.med)) {
  console.log(`${r.n.padEnd(18)} ${String(r.k).padStart(8)} ${String(Math.round(r.med)).padStart(11)} ${String(Math.round(r.p25)).padStart(6)} ${String(Math.round(r.p75)).padStart(6)}   ${r.wins}/${r.k} (${(100 * r.wins / r.k).toFixed(0)}% earlier than ${REF})`);
}
