"use client";

// Gains Lead — Creode rebuilds Gains / gTrade's oracle price from the same
// exchange books it is computed from, and shows it next to the number Gains is
// actually publishing, with the lead measured live rather than quoted.
//
// READ THIS BEFORE READING THE NUMBER. The lead here is measured in
// milliseconds, not seconds, and it is smaller than our own formula error.
// Gains republishes every ~505ms and trails the tape by 150-300ms; our
// replication sits $2.13 from their number on a $76.3k price, while BTC moves a
// median of $0.00 in 300ms. Being early by less than you are wrong by is not an
// advantage, and this tab says so on its face rather than reporting the lead
// alone. Hyperliquid worked because 2.25 seconds of movement dwarfs a $0.01
// formula error; that is the whole difference.
//
// The one thing here that IS worth watching: they do not republish when their
// median has not changed, so the print on their screen ages. Median 395ms, p90
// 1651ms, p99 4011ms. The tab shows that age live, because it is the only part
// of this that reaches seconds.
//
// See lib/gainsOracle.ts for how the feed was found and what was measured, and
// research/gains-oracle/ for the captures, the guards, and the test of whether
// the price they SHOW is the price they FILL at.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import {
  GAINS_MARKETS,
  GAINS_FEE_BP_PER_SIDE,
  SPOT_LEGS,
  subscribeGainsPrices,
  subscribeSpotComposite,
  fetchIndexSources,
  verifyGainsPairIndices,
  medianOf,
  type SpotLegId,
  type GainsSource,
} from '../lib/gainsOracle';

interface GainsLeadTabProps { theme?: 'light' | 'dark'; }

const HISTORY_MS = 60_000;     // how much of our own series the fit can reach back into
const LEAD_SAMPLES = 60;       // rolling window of their publishes used by the fit
const BASIS_SAMPLES = 40;      // rolling window for the level-offset calibration
const MIN_SAMPLES = 10;        // below this the fit is not reported at all
const MAX_LEAD_MS = 3000;      // their cadence is ~505ms; a "lead" past 3s is a coincidence
const LEAD_STEP_MS = 25;
// The fallback fans out to seven exchange REST endpoints per call. At 400ms
// that is ~17 upstream requests a second per client and the test run started
// drawing 429s, which turns a degraded path into a broken one. This path is
// already the slow one and the UI says so, so it is paced to stay alive rather
// than to compete.
const FALLBACK_POLL_MS = 600;

const fmt = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};

const median = (a: number[]): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

export const GainsLeadTab: React.FC<GainsLeadTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(GAINS_MARKETS[0].sym);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ours, setOurs] = useState<number | null>(null);
  const [legs, setLegs] = useState<Partial<Record<SpotLegId, number>>>({});
  /** Books the polled fallback returned, already converted to USD. Kept apart
   *  from `legs` so the inputs panel always describes the path actually in use
   *  rather than showing five empty streaming legs while the poll works. */
  const [polledLegs, setPolledLegs] = useState<Array<{ label: string; price: number }>>([]);
  const [usdtUsd, setUsdtUsd] = useState<number | null>(null);
  const [theirs, setTheirs] = useState<number | null>(null);
  const [theirGapMs, setTheirGapMs] = useState<number | null>(null);
  const [leadMs, setLeadMs] = useState<number | null>(null);
  const [leadN, setLeadN] = useState(0);
  const [fit, setFit] = useState<number | null>(null);
  const [ourMode, setOurMode] = useState<'streaming' | 'polled'>('streaming');
  const [gainsLive, setGainsLive] = useState(false);
  const [transportMs, setTransportMs] = useState<number | null>(null);
  const [drifted, setDrifted] = useState<number[]>([]);
  const [, setTick] = useState(0);

  const historyRef = useRef<Array<{ t: number; px: number }>>([]);
  const eventsRef = useRef<Array<{ t: number; px: number }>>([]);
  /** Observed (their print − our value) for past publishes only. */
  const biasRef = useRef<number[]>([]);
  const [basis, setBasis] = useState<number | null>(null);
  const lastTheirsRef = useRef<number | null>(null);
  const lastTheirsAtRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const market = useMemo(
    () => GAINS_MARKETS.find((m) => m.sym === selected) ?? GAINS_MARKETS[0],
    [selected],
  );

  // Gains' pair indices are positional and would silently shift if they
  // relisted. A drifted index is refused rather than priced.
  useEffect(() => {
    let alive = true;
    verifyGainsPairIndices().then((r) => { if (alive && r) setDrifted(r.drifted); });
    return () => { alive = false; };
  }, []);

  // Reset everything when the market changes — a lead fitted on BTC says
  // nothing about SOL, and carrying it across would be a lie by leftover state.
  useEffect(() => {
    historyRef.current = [];
    eventsRef.current = [];
    lastTheirsRef.current = null;
    lastTheirsAtRef.current = null;
    biasRef.current = [];
    setOurs(null); setTheirs(null); setLeadMs(null); setLeadN(0); setFit(null);
    setTheirGapMs(null); setLegs({}); setPolledLegs([]); setGainsLive(false);
    setOurMode('streaming'); setBasis(null);
  }, [market.sym]);

  /** Our replicated value as of time `t`, from the rolling history. */
  const ourAt = useCallback((t: number): number | null => {
    const h = historyRef.current;
    if (!h.length || t < h[0].t) return null;
    let lo = 0, hi = h.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (h[m].t <= t) lo = m; else hi = m - 1; }
    return h[lo].px;
  }, []);

  /** Gains just published `px`. Re-fit the lead across every publish we hold.
   *
   *  This is the level test from research/lead-lag run in the browser: for each
   *  candidate shift, move our own history back by that much and see which
   *  shift best reproduces the sequence of values they published. A constant
   *  offset between the two — a different source set, a different quote
   *  currency — is not lag, so the median difference is removed before the
   *  error is taken rather than counted as one.
   *
   *  Two simpler things were tried first on the Hyperliquid version of this and
   *  both were wrong: closest matching value anywhere in history read 16s
   *  (a range-bound tape revisits levels constantly), and most-recent-crossing
   *  read 5.6s (their oracle only reprints when the value changes, so a quiet
   *  stretch puts the crossing far in the past through no fault of theirs).
   *  Fitting across many publishes at once is immune to both. */
  const scorePublish = useCallback((px: number) => {
    const now = Date.now();
    if (lastTheirsRef.current === px) return;   // resent, unchanged — not a publish
    if (lastTheirsAtRef.current != null) setTheirGapMs(now - lastTheirsAtRef.current);
    lastTheirsRef.current = px;
    lastTheirsAtRef.current = now;
    setTheirs(px);

    // Calibrate the level offset between their number and ours, from publishes
    // that have already happened. A persistent basis — a different source set, a
    // USDT rate that is not exactly theirs — is not lag and it is not error in
    // any useful sense, because it can be measured and removed live. Leaving it
    // in costs a lot: measured over 1,064 publishes, removing it cut our mean
    // error against their next print from $2.28 to $1.32.
    //
    // Strictly backward-looking on purpose. It is updated only after the print
    // it is being scored against has landed, so it can never see the value it
    // is helping to predict.
    const ourNow = ourAt(now - 30);
    if (ourNow != null) {
      const b = biasRef.current;
      b.push(px - ourNow);
      while (b.length > BASIS_SAMPLES) b.shift();
      if (b.length >= MIN_SAMPLES) setBasis(median(b));
    }

    const ev = eventsRef.current;
    ev.push({ t: now, px });
    while (ev.length > LEAD_SAMPLES) ev.shift();
    if (ev.length < MIN_SAMPLES) { setLeadN(ev.length); return; }

    // Only score publishes that landed while the tape was moving. On a flat
    // stretch every candidate shift fits equally well, so those events carry no
    // timing information and just let the minimum wander. The offline study
    // drops them the same way.
    const moves = ev.map((e) => {
      const a = ourAt(e.t - 2000), b = ourAt(e.t);
      return a != null && b != null ? Math.abs(b - a) : 0;
    });
    const cut = median(moves.filter((m) => m > 0)) ?? 0;
    const active = ev.filter((_, i) => moves[i] >= cut && moves[i] > 0);
    const scored = active.length >= MIN_SAMPLES ? active : ev;

    let best: { lag: number; err: number } | null = null;
    for (let lag = 0; lag <= MAX_LEAD_MS; lag += LEAD_STEP_MS) {
      const d: number[] = [];
      for (const e of scored) {
        const o = ourAt(e.t - lag);
        if (o != null) d.push(e.px - o);
      }
      if (d.length < MIN_SAMPLES) continue;
      const basis = median(d) ?? 0;
      const err = d.reduce((s, x) => s + Math.abs(x - basis), 0) / d.length;
      if (!best || err < best.err) best = { lag, err };
    }
    if (!best) return;
    setFit(best.err);
    setLeadMs(best.lag);
    setLeadN(ev.length);
  }, [ourAt]);

  const record = useCallback((px: number) => {
    setOurs(px);
    const h = historyRef.current;
    const now = Date.now();
    if (!h.length || h[h.length - 1].px !== px) h.push({ t: now, px });
    while (h.length && now - h[0].t > HISTORY_MS) h.shift();
  }, []);

  // ---- our side: the exchange books, streamed ----
  useEffect(() => {
    let alive = true;
    let fellBack = false;
    let poll: ReturnType<typeof setInterval> | null = null;
    const dead = new Set<SpotLegId>();

    const tickPoll = async () => {
      const r = await fetchIndexSources(market.sym);
      if (!alive || !r) return;
      const rate = r.usdtUsd;
      setUsdtUsd(rate ?? null);
      // Every book behind this route is USDT-quoted, so without the rate there
      // is no USD price to publish — and publishing the USDT one would be 9bp
      // wrong, which is larger than anything on this page.
      if (rate == null) return;
      const quotes = (Object.keys(r.sources) as GainsSource[])
        .map((src) => ({ src, mid: (r.sources[src] as number) * rate }));
      setPolledLegs(quotes.map((q) => ({ label: q.src, price: q.mid })));
      const px = medianOf(quotes);
      if (px != null) record(px);
    };

    const startFallback = () => {
      if (fellBack || !alive) return;
      fellBack = true;
      setOurMode('polled');
      setLegs({});
      tickPoll();
      poll = setInterval(tickPoll, FALLBACK_POLL_MS);
    };

    const stop = subscribeSpotComposite(market.sym, (u) => {
      if (!alive || fellBack) return;
      setLegs(u.legs);
      setUsdtUsd(u.usdtUsd);
      if (u.price != null) record(u.price);
    }, (leg) => {
      // One exchange dropping is normal and the median absorbs it. Falling back
      // only makes sense once too few legs are left to form a median at all —
      // the polled path is materially slower and the UI says so, so it is a
      // last resort, not a first response.
      dead.add(leg);
      if (dead.size > SPOT_LEGS.length - 3) startFallback();
    });

    // Watchdog. Counting failed legs is not enough on its own: a proxy that
    // answers the upgrade with a 200 instead of a 101 can leave a socket that
    // never errors and never delivers, and the page would sit on "—" forever
    // looking like a bug rather than a blocked transport. If nothing has been
    // recorded by now, take the slow path.
    const watchdog = setTimeout(() => {
      if (alive && historyRef.current.length === 0) startFallback();
    }, 4000);

    return () => { alive = false; clearTimeout(watchdog); stop(); if (poll) clearInterval(poll); };
  }, [market.sym, record]);

  // ---- their side: pushed straight from their socket ----
  useEffect(() => {
    let alive = true;
    const stop = subscribeGainsPrices([market.idx], (t) => {
      if (!alive) return;
      setGainsLive(true);
      scorePublish(t.price);
    }, (serverMs, localMs) => {
      // Their heartbeat carries their own clock. This is the transport delay on
      // their leg of the comparison, shown rather than assumed: if it were
      // large or jittery the lead figure would not mean much.
      if (alive && Number.isFinite(serverMs)) setTransportMs(localMs - serverMs);
    }, () => { if (alive) setGainsLive(false); });
    return () => { alive = false; stop(); };
  }, [market.idx, scorePublish]);

  // Drives the "Xs ago" readouts between publishes.
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 100);
    return () => clearInterval(t);
  }, []);

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

  // What we show is our estimate of the number Gains is about to print, so the
  // measured level offset belongs in it. The raw composite stays visible
  // underneath, because "we calibrated to you" and "we reproduced you" are
  // different claims and the page should not blur them.
  const calibrated = ours != null && basis != null ? ours + basis : ours;
  const gap = calibrated != null && theirs != null ? theirs - calibrated : null;
  const gapBp = gap != null && calibrated ? (1e4 * gap) / calibrated : null;
  const printAgeMs = lastTheirsAtRef.current != null ? Date.now() - lastTheirsAtRef.current : null;
  const totalStaleMs = leadMs != null && printAgeMs != null ? leadMs + printAgeMs : null;
  const roundTripBp = market.spreadBp + 2 * GAINS_FEE_BP_PER_SIDE;
  const breakEven = ours != null ? (roundTripBp / 1e4) * ours : null;
  const indexDrifted = drifted.includes(market.idx);
  // One list, whichever path is live, so the panel never shows five empty
  // streaming legs while the poll is quietly doing the work.
  const inputs = ourMode === 'streaming'
    ? SPOT_LEGS.map((l) => ({ key: l.id, label: l.label, quote: l.quote, price: legs[l.id] ?? null }))
    : polledLegs.map((p) => ({ key: p.label, label: p.label, quote: 'usdt' as const, price: p.price }));
  const liveCount = inputs.filter((i) => i.price != null).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Gains Lead</h2>
        <p className={`text-[13px] mt-1 ${subtle}`}>
          Creode rebuilds Gains&apos; oracle from the same exchange books it is computed from, and shows it next to the
          number Gains is publishing right now.
        </p>
      </div>

      {/* market selector */}
      <div className="relative w-fit" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[14px] border ${cardBg} text-foreground`}
        >
          <span>{market.sym}</span>
          <span className={`font-normal text-[12px] ${subtle}`}>{market.name}</span>
          <CaretDown size={14} className={subtle} />
        </button>
        {menuOpen && (
          <div className={`absolute z-20 mt-2 w-[280px] max-h-[340px] overflow-y-auto rounded-[12px] border shadow-lg backdrop-blur-xl ${
            isDark ? 'bg-[#0B0F14]/95 border-white/10' : 'bg-white/95 border-[#EAECEF]'
          }`}>
            {GAINS_MARKETS.map((m) => (
              <button
                key={m.sym}
                onClick={() => { setSelected(m.sym); setMenuOpen(false); }}
                className={`flex items-center justify-between w-full px-4 py-2.5 text-left text-[13px] hover:bg-[#00A8E8]/10 ${
                  m.sym === selected ? 'text-[#00A8E8] font-bold' : 'text-foreground'
                }`}
              >
                <span className="font-bold">{m.sym}</span>
                <span className={subtle}>{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {indexDrifted && (
        <div className="rounded-[12px] border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-[12px] text-[#B45309] dark:text-[#FCD34D]">
          Gains&apos; pair index {market.idx} no longer carries {market.sym}/USD on their own trading-variables endpoint,
          so this market is not being priced. Pair indices are positional and move when they relist; showing a price
          from a shifted index would be confidently wrong rather than merely missing.
        </div>
      )}

      {/* the race */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#00A8E8]">
            Creode Replication
            <span className={`normal-case font-normal ${subtle}`}>
              {' '}· {ourMode === 'streaming' ? 'recomputed on every book update' : `polled every ${FALLBACK_POLL_MS}ms (fallback)`}
            </span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {calibrated != null && !indexDrifted ? `$${fmt(calibrated)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>
            median of {liveCount} live book{liveCount === 1 ? '' : 's'}
            {usdtUsd != null ? ` · USDT/USD ${usdtUsd.toFixed(5)}` : ' · waiting for USDT/USD'}
          </div>
          <div className={`text-[11px] mt-0.5 ${subtle}`}>
            {basis != null && ours != null
              ? <>raw median ${fmt(ours)} · level offset {basis >= 0 ? '+' : '−'}${fmt(Math.abs(basis))} calibrated from their last {Math.min(BASIS_SAMPLES, leadN)} publishes</>
              : 'calibrating level offset…'}
          </div>
        </div>

        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>
            Gains Oracle
            <span className="normal-case font-normal">
              {' '}· {gainsLive ? 'pushed live from their socket' : 'connecting…'}
            </span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {theirs != null && !indexDrifted ? `$${fmt(theirs)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>
            {printAgeMs != null ? `this print is ${(printAgeMs / 1000).toFixed(2)}s old` : 'waiting for their first publish…'}
            {theirGapMs != null ? ` · last interval ${(theirGapMs / 1000).toFixed(2)}s` : ''}
            {transportMs != null ? ` · transport ${transportMs}ms` : ''}
          </div>
        </div>
      </div>

      {/* measured lead */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Measured lead, this session</div>
            <div className="text-[30px] font-bold text-foreground mt-1 tabular-nums">
              {leadMs != null ? `${leadMs}ms ahead` : 'measuring…'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>
              fitted across their last {leadN} publishes · needs {MIN_SAMPLES} before it reports
              {fit != null ? ` · fit $${fit.toFixed(2)}` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Live difference</div>
            <div className="text-[22px] font-bold text-foreground mt-1 tabular-nums">
              {gap != null ? `${gap >= 0 ? '+' : '−'}$${fmt(Math.abs(gap))}` : '—'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>
              {gapBp != null ? `${gapBp >= 0 ? '+' : ''}${gapBp.toFixed(2)}bp vs ours` : ''}
            </div>
          </div>
        </div>
        <div className={`mt-4 pt-4 border-t text-[11px] leading-relaxed ${isDark ? 'border-white/5' : 'border-black/5'} ${subtle}`}>
          <span className="text-foreground font-bold">The lead above is smaller than our own formula error.</span>{' '}
          Their oracle trails by 150ms while BTC moves a median of $0.00, p90 $4.30, inside 300ms. Recovering their
          source set cut our error from $1.60 to <span className="text-foreground font-bold">$1.43</span>, and
          calibrating the level offset cut it again to <span className="text-foreground font-bold">$1.24</span> — but
          asked directly whether our value predicts their next print better than their own current print does, it still
          wins only <span className="text-foreground font-bold">33.9%</span> of the time. Their last print carries
          $0.95 of error because the market barely moves in half a second. To beat that we would need their complete
          source set, and two or three of their seven venues could not be streamed from the measurement environment.
          <br /><br />
          What does reach seconds is the age of the print itself: they do not republish when their median has not
          changed. Sampled every 25ms across the capture, that age ran a median of 395ms, p90 1651ms and p99 4011ms,
          with a longest freeze of 8.5s — and their once-a-second heartbeat kept flowing through all 75 gaps over two
          seconds, so those are theirs, not a dropped socket on our side.
          {totalStaleMs != null
            ? <> Right now their number is <span className="text-foreground font-bold">{(totalStaleMs / 1000).toFixed(2)}s</span> behind the tape, fit plus print age.</>
            : null}
        </div>
      </div>

      {/* inputs */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle} mb-3`}>
          The books the replication is built from, read directly
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {inputs.map((leg) => (
            <div key={leg.key} className={`rounded-[10px] px-3 py-2 border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="flex items-baseline justify-between">
                <span className="text-[12px] font-bold text-foreground capitalize">{leg.label}</span>
                <span className={`text-[10px] uppercase ${subtle}`}>{leg.quote}</span>
              </div>
              <div className={`text-[13px] tabular-nums mt-0.5 ${leg.price != null ? 'text-foreground' : subtle}`}>
                {leg.price != null ? `$${fmt(leg.price)}` : 'unavailable'}
              </div>
            </div>
          ))}
        </div>
        {ourMode === 'polled' && (
          <div className={`text-[11px] mt-3 ${subtle}`}>
            <span className="text-foreground font-bold">Websockets are blocked here, so this is the slow path.</span>{' '}
            These books are being polled through our own origin every {FALLBACK_POLL_MS}ms instead of streamed, which
            adds the poll interval plus a round trip to our side of the comparison. Gains&apos; whole lead window is
            about that long, so in this mode expect the measured lead to read near zero — that is the transport, not
            the finding.
          </div>
        )}
        <div className={`text-[11px] mt-3 ${subtle}`}>
          These six are not a guess. Gains publishes no source list, so the set was recovered by trying all 4,083
          subsets of twelve streamed books and level-testing each one&apos;s median against their prints: Bitget,
          Coinbase, Binance, Bybit and Gate came out{' '}
          <span className="text-foreground font-bold">1.4–1.85x</span> over-represented among the best-fitting
          subsets, while Gemini, Bitstamp, Bitfinex and Crypto.com came out at{' '}
          <span className="text-foreground font-bold">0.24–0.68x</span>. OKX is carried untested — it could not be
          streamed from where this was measured, and a median absorbs a wrong member better than a missing one.
          <br /><br />
          USDT-quoted books are multiplied by the live USDT/USD rate before the median is taken. Gains quotes USD, and
          on BTC the USDT books sit about <span className="text-foreground font-bold">$72 (9.4bp)</span> above the USD
          ones — nine times Gains&apos; own quoted spread. An earlier version took the median over both currencies at
          once and was wrong by exactly that much.
        </div>
      </div>

      {/* what this is, and what it is not */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        <span className="font-bold text-foreground">Where the lead comes from, and why it is small.</span>{' '}
        A perp DEX oracle is not an independent observation of the market — it is a function of exchange books,
        recomputed on a fixed drumbeat. Between publishes the number is frozen while the inputs keep moving, so
        reading the same inputs continuously reaches their next value before they print it. That lead is arithmetic,
        and it is bounded by their publish interval. Gains republishes every{' '}
        <span className="font-bold text-foreground">~0.5s</span>, six times faster than Hyperliquid&apos;s 3-second
        cadence, so the lead here is a sixth of the size — and our formula error against them is two hundred times
        larger, because Hyperliquid publishes its exact recipe and Gains does not. Their oracle is one of the fastest
        measured anywhere in this project, not one of the slowest.
        <br /><br />
        <span className="font-bold text-foreground">This is not a trading edge, and nothing here should be traded on.</span>{' '}
        Gains&apos; round trip on {market.sym} is {market.spreadBp.toFixed(1)}bp of spread plus{' '}
        {GAINS_FEE_BP_PER_SIDE.toFixed(1)}bp per side = <span className="font-bold text-foreground">{roundTripBp.toFixed(1)}bp</span>
        {breakEven != null
          ? <>, a <span className="font-bold text-foreground">${breakEven.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> move on today&apos;s price</>
          : null}
        , against a 99th-percentile 300ms move of $9.80. Separately, a Gains market order carries no price: you submit
        it and their oracle prices it when it settles. Pooling 111 settled fills across every pair, the executed price
        matched the displayed feed from 750–1000ms earlier — so execution is not materially staler than display, and
        there is no second-scale lag anywhere in this venue to reach for.
        <br /><br />
        <span className="font-bold text-foreground">What it is good for</span> is seeing when their number has stopped
        moving and the market has not. Funding, margin and liquidation levels all follow this oracle, and it freezes
        for seconds at a time.
      </div>
    </div>
  );
};
