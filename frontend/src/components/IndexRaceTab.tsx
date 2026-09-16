"use client";

// Index Race — Creode's replication of a perp DEX's own index/oracle price,
// side by side with the number that DEX publishes, and a lead measured live in
// the browser rather than quoted from a script I ran once.
//
// The lead is real and it is also unglamorous: a DEX index is a published
// function of CEX spot prices, recomputed on a fixed drumbeat. Hyperliquid's
// validators publish every 3 seconds. Between publishes their number is frozen
// while the inputs keep moving, so reading the same inputs continuously and
// applying the same formula gets there first. See lib/creodeIndex.ts for the
// formula and research/index-replication/ for the measurements.
//
// HOW THE LIVE LEAD IS MEASURED. Each time the venue publishes, we re-fit
// across their last several publishes at once: for each candidate lag, shift
// our own history back by that much and see which shift best reproduces the
// values they printed. The best-fitting shift is how far behind us they are.
// This is the level test from research/lead-lag, run in the browser. See the
// comment on scorePublish for the two simpler versions that were both wrong,
// and wrong in our favour.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import {
  INDEX_VENUES,
  fetchIndexSources,
  fetchVenueIndex,
  subscribeHyperliquidOracle,
  weightedMedian,
  type IndexVenue,
  type SpotSource,
} from '../lib/creodeIndex';

interface IndexRaceTabProps {
  theme?: 'light' | 'dark';
}

const SYMBOLS = [
  { sym: 'BTC', name: 'Bitcoin' },
  { sym: 'ETH', name: 'Ethereum' },
  { sym: 'SOL', name: 'Solana' },
];

const SOURCE_POLL_MS = 250;   // our own refresh; their drumbeat is 3000ms
const HISTORY_MS = 60000;     // how much of our own index history we keep
const MAX_LEAD_MS = 12000;    // any "lead" beyond this is a coincidental match, not a lead
const LEAD_SAMPLES = 40;      // rolling window for the median lead

const fmt = (v: number | null, dp = 2): string =>
  v == null || !Number.isFinite(v) ? '—' : v.toLocaleString(undefined, { minimumFractionDigits: dp, maximumFractionDigits: dp });

const median = (a: number[]): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

interface Sample { t: number; px: number; }

export const IndexRaceTab: React.FC<IndexRaceTabProps> = ({ theme = 'light' }) => {
  const [venueId, setVenueId] = useState(INDEX_VENUES[0].id);
  const [symbol, setSymbol] = useState('BTC');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [ours, setOurs] = useState<number | null>(null);
  const [theirs, setTheirs] = useState<number | null>(null);
  const [sources, setSources] = useState<Partial<Record<SpotSource, number>>>({});
  const [missing, setMissing] = useState<SpotSource[]>([]);
  const [leadMs, setLeadMs] = useState<number | null>(null);
  const [leadN, setLeadN] = useState(0);
  const [theirGapMs, setTheirGapMs] = useState<number | null>(null);

  const historyRef = useRef<Sample[]>([]);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventsRef = useRef<{ t: number; px: number }[]>([]);
  const fitRef = useRef<number | null>(null);
  const lastTheirsRef = useRef<number | null>(null);
  const lastTheirsAtRef = useRef<number | null>(null);

  const venue: IndexVenue = INDEX_VENUES.find((v) => v.id === venueId) ?? INDEX_VENUES[0];

  // Reset every accumulated measurement when the race changes — a lead measured
  // against one venue's drumbeat means nothing about another's.
  useEffect(() => {
    historyRef.current = [];
    eventsRef.current = [];
    fitRef.current = null;
    lastTheirsRef.current = null;
    lastTheirsAtRef.current = null;
    setOurs(null); setTheirs(null); setLeadMs(null); setLeadN(0); setTheirGapMs(null);
  }, [venueId, symbol]);

  /** Our index level as of time `t` (step function, previous value). */
  const ourAt = useCallback((t: number): number | null => {
    const h = historyRef.current;
    if (!h.length || t < h[0].t) return null;
    let lo = 0, hi = h.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (h[mid].t <= t) lo = mid; else hi = mid - 1; }
    return h[lo].px;
  }, []);

  /** A venue just published `px`. Re-fit the lead across every publish we have.
   *
   *  This is the level test from research/lead-lag, run in the browser: for
   *  each candidate lag, shift our own history back by that much, and see which
   *  shift best reproduces the sequence of values they published. The lag that
   *  fits best is how far behind us they are.
   *
   *  It replaced two simpler things that were both wrong. Taking the closest
   *  matching value anywhere in our history read 16s, because on a range-bound
   *  tape our index revisits the same level constantly and the closest match is
   *  a coincidence. Taking the most recent crossing read 5.6s, because their
   *  oracle only reprints when the value CHANGES, so a quiet stretch put the
   *  crossing far in the past through no fault of theirs. Fitting across many
   *  publishes at once is immune to both: a single unlucky event cannot move
   *  the median, and a constant offset falls out in the basis term. */
  const scorePublish = useCallback((px: number) => {
    const now = Date.now();
    if (lastTheirsRef.current === px) return;        // republished, unchanged — no new event
    if (lastTheirsAtRef.current != null) setTheirGapMs(now - lastTheirsAtRef.current);
    lastTheirsRef.current = px;
    lastTheirsAtRef.current = now;
    setTheirs(px);

    const ev = eventsRef.current;
    ev.push({ t: now, px });
    while (ev.length > LEAD_SAMPLES) ev.shift();
    if (ev.length < 8) { setLeadN(ev.length); return; }

    // Only score publishes that landed while the tape was actually moving. On a
    // flat stretch every candidate lag fits equally well, so those events carry
    // no timing information and simply let the minimum wander. The offline
    // study drops them the same way.
    const moves = ev.map((e) => {
      const a = ourAt(e.t - 3000), b = ourAt(e.t);
      return a != null && b != null ? Math.abs(b - a) : 0;
    });
    const cut = median(moves.filter((m) => m > 0)) ?? 0;
    const active = ev.filter((_, i) => moves[i] >= cut && moves[i] > 0);
    const scored = active.length >= 8 ? active : ev;

    let best: { lag: number; err: number } | null = null;
    for (let lag = 0; lag <= MAX_LEAD_MS; lag += 100) {
      const d: number[] = [];
      for (const e of scored) {
        const o = ourAt(e.t - lag);
        if (o != null) d.push(e.px - o);
      }
      if (d.length < 8) continue;
      // A persistent offset between their index and ours — different quote
      // currency, different source set — is not lag, so it is removed rather
      // than counted. Measured at ~$0.01 for Hyperliquid, a few dollars for
      // Hotstuff.
      const basis = median(d) ?? 0;
      const err = d.reduce((s, x) => s + Math.abs(x - basis), 0) / d.length;
      if (!best || err < best.err) best = { lag, err };
    }
    if (!best) return;
    fitRef.current = best.err;
    setLeadMs(best.lag);
    setLeadN(ev.length);
  }, [ourAt]);

  // ---- our side: read every index input and apply the venue's formula ----
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const r = await fetchIndexSources(symbol);
      if (!alive || !r) return;
      setSources(r.sources);
      setMissing(r.missing ?? []);
      const quotes = (Object.keys(r.sources) as SpotSource[]).map((src) => ({ src, mid: r.sources[src] as number }));
      const px = weightedMedian(quotes, venue.weights);
      if (px == null) return;
      setOurs(px);
      const hist = historyRef.current;
      const now = Date.now();
      if (!hist.length || hist[hist.length - 1].px !== px) hist.push({ t: now, px });
      while (hist.length && now - hist[0].t > HISTORY_MS) hist.shift();
    };
    tick();
    const timer = setInterval(tick, SOURCE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [symbol, venue.weights]);

  // ---- their side: pushed where the venue offers it, polled otherwise ----
  useEffect(() => {
    let alive = true;
    if (venue.id === 'hyperliquid') {
      let fellBack = false;
      const stop = subscribeHyperliquidOracle(symbol, ({ oracle }) => { if (alive) scorePublish(oracle); }, () => {
        // Raw websockets are blocked outright in some in-app browsers, so keep
        // a polled path. It costs their side up to one poll interval, which
        // works against us, not for us — the honest direction to err.
        if (fellBack || !alive) return;
        fellBack = true;
        const t = setInterval(async () => {
          const px = await fetchVenueIndex('hyperliquid', symbol);
          if (alive && px != null) scorePublish(px);
        }, 500);
        pollTimer.current = t;
      });
      return () => { alive = false; stop(); if (pollTimer.current) clearInterval(pollTimer.current); };
    }
    const t = setInterval(async () => {
      const px = await fetchVenueIndex(venue.id, symbol);
      if (alive && px != null) scorePublish(px);
    }, 400);
    return () => { alive = false; clearInterval(t); };
  }, [venue.id, symbol, scorePublish]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtle = isDark ? 'text-white/50' : 'text-slate-500';

  const gap = ours != null && theirs != null ? theirs - ours : null;
  const gapBp = gap != null && ours ? (1e4 * gap) / ours : null;
  const contributing = (Object.keys(venue.weights) as SpotSource[]).filter((s) => sources[s] != null);
  const totalWeight = contributing.reduce((s, src) => s + (venue.weights[src] ?? 0), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Index Race</h2>
        <p className={`text-[13px] mt-1 ${subtle}`}>
          Creode rebuilds {venue.name}&apos;s index price from the same exchange feeds {venue.name} uses, and shows it
          next to the number {venue.name} actually publishes.
        </p>
      </div>

      {/* venue + symbol pickers */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[14px] border ${cardBg} text-foreground`}
          >
            <span>{venue.name}</span>
            <span className={`font-normal text-[11px] uppercase tracking-wide ${venue.fidelity === 'exact' ? 'text-[#00A8E8]' : subtle}`}>
              {venue.fidelity === 'exact' ? 'exact formula' : 'approximate'}
            </span>
            <CaretDown size={14} className={subtle} />
          </button>
          {menuOpen && (
            <div className={`absolute z-20 mt-2 w-[300px] rounded-[12px] border shadow-lg backdrop-blur-xl ${
              isDark ? 'bg-[#0B0F14]/95 border-white/10' : 'bg-white/95 border-[#EAECEF]'
            }`}>
              {INDEX_VENUES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setVenueId(v.id); setMenuOpen(false); }}
                  className={`block w-full px-4 py-3 text-left text-[13px] hover:bg-[#00A8E8]/10 ${
                    v.id === venueId ? 'text-[#00A8E8] font-bold' : 'text-foreground'
                  }`}
                >
                  <div className="font-bold">{v.name}</div>
                  <div className={`text-[11px] mt-0.5 ${subtle}`}>
                    publishes every {(v.publishMs / 1000).toFixed(v.publishMs % 1000 ? 2 : 0)}s · {v.fidelity === 'exact' ? 'we use their published formula' : 'reference composite'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {SYMBOLS.map((s) => (
            <button
              key={s.sym}
              onClick={() => setSymbol(s.sym)}
              className={`px-3 py-2 rounded-[10px] text-[13px] font-bold border ${
                s.sym === symbol ? 'border-[#00A8E8] text-[#00A8E8]' : `${cardBg} text-foreground`
              }`}
            >
              {s.sym}
            </button>
          ))}
        </div>
      </div>

      {/* the race */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#00A8E8]">
            Creode Index <span className={`normal-case font-normal ${subtle}`}>· recomputed every {SOURCE_POLL_MS}ms</span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {ours != null ? `$${fmt(ours)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>
            weighted median of {contributing.length} live feeds · total weight {totalWeight}
          </div>
        </div>

        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>
            {venue.name} Index <span className="normal-case font-normal">· published every {(venue.publishMs / 1000).toFixed(1)}s</span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {theirs != null ? `$${fmt(theirs)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>
            {theirGapMs != null ? `last republished ${(theirGapMs / 1000).toFixed(2)}s after the one before` : 'waiting for their next publish…'}
          </div>
        </div>
      </div>

      {/* measured lead */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Measured lead, this session</div>
            <div className="text-[30px] font-bold text-foreground mt-1 tabular-nums">
              {leadMs != null ? `${(leadMs / 1000).toFixed(1)}s ahead` : 'measuring…'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>
              fitted across their last {leadN} publishes · needs 8 before it reports
              {fitRef.current != null ? ` · fit $${fitRef.current.toFixed(2)}` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Live difference</div>
            <div className="text-[22px] font-bold text-foreground mt-1 tabular-nums">
              {gap != null ? `${gap >= 0 ? '+' : ''}$${fmt(Math.abs(gap))}` : '—'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>{gapBp != null ? `${gapBp >= 0 ? '+' : ''}${gapBp.toFixed(1)}bp vs ours` : ''}</div>
          </div>
        </div>
      </div>

      {/* inputs */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle} mb-3`}>
          The inputs {venue.name} names, read directly
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(venue.weights) as SpotSource[]).map((src) => {
            const v = sources[src];
            const w = venue.weights[src] ?? 0;
            return (
              <div key={src} className={`rounded-[10px] px-3 py-2 border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[12px] font-bold text-foreground capitalize">{src}</span>
                  <span className={`text-[10px] ${subtle}`}>×{w}</span>
                </div>
                <div className={`text-[13px] tabular-nums mt-0.5 ${v != null ? 'text-foreground' : subtle}`}>
                  {v != null ? `$${fmt(v)}` : 'unavailable'}
                </div>
              </div>
            );
          })}
        </div>
        {missing.length > 0 && (
          <div className={`text-[11px] mt-3 ${subtle}`}>
            {missing.join(', ')} unreachable from this region and dropped from the median — the same thing the venues
            do with a feed that goes quiet.
          </div>
        )}
      </div>

      {/* what this is, and what it is not */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        <span className="font-bold text-foreground">Where the lead comes from.</span>{' '}
        {venue.name}&apos;s index is a published function of exchange spot prices, recomputed on a fixed schedule —
        every {(venue.publishMs / 1000).toFixed(1)} seconds. Between publishes their number is frozen while the inputs
        keep moving. We read the same inputs continuously and apply the same formula, so we reach their next value
        before they print it. Measured across two captures at{' '}
        <span className="font-bold text-foreground">2.25s and 2.45s</span>{' '}ahead of Hyperliquid&apos;s oracle, with our
        value landing within <span className="font-bold text-foreground">$0.01–$0.05</span> of theirs. Worth being
        precise about which half does the work: the lead is theirs to give — it comes from the 3-second cadence, and
        reading Binance alone would also land ~2.45s early. The formula is what makes the number{' '}
        <span className="font-bold text-foreground">right</span> — Binance alone sits $3.01 off their oracle, the
        weighted median sits $0.01 off.
        <br /><br />
        <span className="font-bold text-foreground">This is not a trading edge, and nothing here should be traded on.</span>{' '}
        The index governs funding, margin and liquidation — it is not the price you fill at. You trade against the order
        book, and the book does not wait for the oracle: {venue.name}&apos;s own book tracks these same exchanges within
        a second. A separate study of twenty venues found no perp anywhere that arrives ahead of the underlying
        market, and found that the venues with the largest oracle lag were the ones where that lag was least
        reachable. See <span className="font-mono text-[11px]">research/lead-lag/</span>.
        <br /><br />
        <span className="font-bold text-foreground">What it is good for</span> is seeing the index move before the
        venue admits it — funding drift, liquidation levels and mark price all follow this number, and on Hyperliquid
        the book sat within a 9.6bp band of the oracle across a window where the oracle itself ranged 33bp.
      </div>
    </div>
  );
};
