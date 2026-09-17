"use client";

// GMX Lead — Creode's live read of the market against the price GMX's keepers
// actually execute orders at, with the lead measured live.
//
// This is the tab where the number is large. Every other venue measured in this
// project publishes an oracle that trails the market by a fraction of a second:
// Gains 150-300ms, Avantis 200-400ms, Ostium 650-900ms. GMX's EXECUTION feed
// trails by 3.2 seconds, and unlike an order-book venue's oracle it is not a
// side quantity — it is the price a fill is priced from.
//
// It is also still not a trade, and the tab says so at the same size as the
// headline. GMX orders are executed by a keeper a block or two after you
// submit, at whatever the oracle says then, so you cannot lock in the stale
// price you can see. Against a 10.4bp round trip the largest move BTC made in
// any 3.2-second window across a 10-minute capture was $69.90, against a $79
// break-even. Hit rate 0.00%.
//
// See lib/gmxOracle.ts for the two-feed trap and research/oracle-execution-venues/
// for the capture.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import {
  GMX_MARKETS,
  GMX_POLL_MS,
  GMX_BAND_BP,
  GMX_FEE_BP_PER_SIDE,
  GMX_ROUND_TRIP_BP,
  subscribeGmxSigned,
  type GmxSignedPrice,
} from '../lib/gmxOracle';
// The composite is imported from the Gains module because that is where it was
// built and measured. Its source set was recovered against GAINS, not GMX —
// GMX prices from Chainlink Data Streams, whose publisher set is not public —
// so it is used here purely as a fast, accurate BTC/USD read, and no claim is
// made that these are GMX's own inputs.
import {
  SPOT_LEGS,
  subscribeSpotComposite,
  fetchIndexSources,
  medianOf,
  type SpotLegId,
  type GainsSource,
} from '../lib/gainsOracle';

interface GmxLeadTabProps { theme?: 'light' | 'dark'; }

const HISTORY_MS = 90_000;     // must comfortably exceed the lag being fitted
const LEAD_SAMPLES = 60;
const MIN_SAMPLES = 10;
const MAX_LEAD_MS = 8000;      // their lag is ~3.2s, so the grid has to reach past it
const LEAD_STEP_MS = 50;
const BASIS_SAMPLES = 40;
const FALLBACK_POLL_MS = 600;

const fmt = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};
const money = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const median = (a: number[]): number | null => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const h = s.length >> 1;
  return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2;
};

export const GmxLeadTab: React.FC<GmxLeadTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(GMX_MARKETS[0].sym);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ours, setOurs] = useState<number | null>(null);
  const [legs, setLegs] = useState<Partial<Record<SpotLegId, number>>>({});
  const [polledLegs, setPolledLegs] = useState<Array<{ label: string; price: number }>>([]);
  const [usdtUsd, setUsdtUsd] = useState<number | null>(null);
  const [ourMode, setOurMode] = useState<'streaming' | 'polled'>('streaming');
  const [signed, setSigned] = useState<GmxSignedPrice | null>(null);
  const [theirGapMs, setTheirGapMs] = useState<number | null>(null);
  const [leadMs, setLeadMs] = useState<number | null>(null);
  const [leadN, setLeadN] = useState(0);
  const [fit, setFit] = useState<number | null>(null);
  const [basis, setBasis] = useState<number | null>(null);
  const [reachable, setReachable] = useState(true);
  const [, setTick] = useState(0);

  const historyRef = useRef<Array<{ t: number; px: number }>>([]);
  const eventsRef = useRef<Array<{ t: number; px: number }>>([]);
  const biasRef = useRef<number[]>([]);
  const lastAtRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const market = useMemo(
    () => GMX_MARKETS.find((m) => m.sym === selected) ?? GMX_MARKETS[0],
    [selected],
  );

  useEffect(() => {
    historyRef.current = []; eventsRef.current = []; biasRef.current = [];
    lastAtRef.current = null;
    setOurs(null); setSigned(null); setLeadMs(null); setLeadN(0); setFit(null);
    setBasis(null); setTheirGapMs(null); setLegs({}); setPolledLegs([]);
    setOurMode('streaming'); setReachable(true);
  }, [market.sym]);

  const ourAt = useCallback((t: number): number | null => {
    const h = historyRef.current;
    if (!h.length || t < h[0].t) return null;
    let lo = 0, hi = h.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (h[m].t <= t) lo = m; else hi = m - 1; }
    return h[lo].px;
  }, []);

  const record = useCallback((px: number) => {
    setOurs(px);
    const h = historyRef.current;
    const now = Date.now();
    if (!h.length || h[h.length - 1].px !== px) h.push({ t: now, px });
    while (h.length && now - h[0].t > HISTORY_MS) h.shift();
  }, []);

  /** GMX's signed price just changed. Re-fit the lead across every change we
   *  hold: for each candidate shift, move our own history back by that much and
   *  see which shift best reproduces the values they signed. A constant level
   *  offset is not lag, so the median difference is removed before the error is
   *  taken rather than counted as one. */
  const scoreSigned = useCallback((p: GmxSignedPrice) => {
    const now = p.at;
    if (lastAtRef.current != null) setTheirGapMs(now - lastAtRef.current);
    lastAtRef.current = now;

    const ourNow = ourAt(now - 30);
    if (ourNow != null) {
      const b = biasRef.current;
      b.push(p.mid - ourNow);
      while (b.length > BASIS_SAMPLES) b.shift();
      if (b.length >= MIN_SAMPLES) setBasis(median(b));
    }

    const ev = eventsRef.current;
    ev.push({ t: now, px: p.mid });
    while (ev.length > LEAD_SAMPLES) ev.shift();
    if (ev.length < MIN_SAMPLES) { setLeadN(ev.length); return; }

    // Only score changes that landed while the tape was moving. On a flat
    // stretch every candidate shift fits equally well, so those carry no timing
    // information and just let the minimum wander.
    const moves = ev.map((e) => {
      const a = ourAt(e.t - 4000), b = ourAt(e.t);
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
      const bas = median(d) ?? 0;
      const err = d.reduce((s, x) => s + Math.abs(x - bas), 0) / d.length;
      if (!best || err < best.err) best = { lag, err };
    }
    if (!best) return;
    setFit(best.err);
    setLeadMs(best.lag);
    setLeadN(ev.length);
  }, [ourAt]);

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
      setOurMode('polled'); setLegs({});
      tickPoll();
      poll = setInterval(tickPoll, FALLBACK_POLL_MS);
    };

    const stop = subscribeSpotComposite(market.sym, (u) => {
      if (!alive || fellBack) return;
      setLegs(u.legs); setUsdtUsd(u.usdtUsd);
      if (u.price != null) record(u.price);
    }, (leg) => {
      dead.add(leg);
      if (dead.size > SPOT_LEGS.length - 3) startFallback();
    });

    // A socket that answers the upgrade with a 200 instead of a 101 never
    // errors and never delivers, so leg-counting alone is not enough.
    const watchdog = setTimeout(() => {
      if (alive && historyRef.current.length === 0) startFallback();
    }, 4000);

    return () => { alive = false; clearTimeout(watchdog); stop(); if (poll) clearInterval(poll); };
  }, [market.sym, record]);

  // ---- their side: the signed execution feed ----
  useEffect(() => {
    let alive = true;
    let misses = 0;
    const stop = subscribeGmxSigned(market.sym, (p) => {
      if (!alive) return;
      misses = 0; setReachable(true);
      setSigned(p);
      scoreSigned(p);
    }, (p) => { if (alive) { misses = 0; setReachable(true); setSigned(p); } });
    // If nothing has arrived at all after a few seconds, say so rather than
    // leaving an empty card that looks like a bug.
    const probe = setInterval(() => {
      if (!alive) return;
      if (lastAtRef.current == null && ++misses > 4) setReachable(false);
    }, 2000);
    return () => { alive = false; stop(); clearInterval(probe); };
  }, [market.sym, scoreSigned]);

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

  const calibrated = ours != null && basis != null ? ours + basis : ours;
  const gap = calibrated != null && signed != null ? signed.mid - calibrated : null;
  const gapBp = gap != null && calibrated ? (1e4 * gap) / calibrated : null;
  const signedAge = signed != null ? Date.now() - signed.at : null;
  const bandBp = signed != null && signed.mid ? (1e4 * signed.band) / signed.mid : null;
  const breakEven = signed != null ? (GMX_ROUND_TRIP_BP / 1e4) * signed.mid : null;
  const inputs = ourMode === 'streaming'
    ? SPOT_LEGS.map((l) => ({ key: l.id, label: l.label, price: legs[l.id] ?? null }))
    : polledLegs.map((p) => ({ key: p.label, label: p.label, price: p.price }));
  const liveCount = inputs.filter((i) => i.price != null).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">GMX Lead</h2>
        <p className={`text-[13px] mt-1 ${subtle}`}>
          Creode&apos;s live market read against the price GMX&apos;s keepers actually execute orders at — the slowest
          execution oracle measured anywhere in this project.
        </p>
      </div>

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
            {GMX_MARKETS.map((m) => (
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

      {!reachable && (
        <div className="rounded-[12px] border border-[#F59E0B]/30 bg-[#F59E0B]/10 p-4 text-[12px] text-[#B45309] dark:text-[#FCD34D]">
          GMX&apos;s signed-price endpoint is not answering from here, so there is nothing to race against and the lead
          below is not being measured. Creode&apos;s own read on the left is unaffected.
        </div>
      )}

      {/* the race */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className="text-[12px] font-bold uppercase tracking-wide text-[#00A8E8]">
            Creode Live Read
            <span className={`normal-case font-normal ${subtle}`}>
              {' '}· {ourMode === 'streaming' ? 'recomputed on every book update' : `polled every ${FALLBACK_POLL_MS}ms (fallback)`}
            </span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {calibrated != null ? `$${fmt(calibrated)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>
            median of {liveCount} live book{liveCount === 1 ? '' : 's'}
            {usdtUsd != null ? ` · USDT/USD ${usdtUsd.toFixed(5)}` : ' · waiting for USDT/USD'}
          </div>
        </div>

        <div className={`rounded-[16px] border p-6 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>
            GMX Execution Price
            <span className="normal-case font-normal"> · signed feed, what keepers fill at</span>
          </div>
          <div className="text-[36px] font-bold text-foreground mt-2 tabular-nums">
            {signed != null ? `$${fmt(signed.mid)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 tabular-nums ${subtle}`}>
            {signed != null
              ? `band $${money(signed.band)}${bandBp != null ? ` (${bandBp.toFixed(2)}bp)` : ''} · ${signed.oracleType ?? 'signed'}`
              : 'waiting for their first signed report…'}
          </div>
          <div className={`text-[11px] mt-0.5 ${subtle}`}>
            {signedAge != null ? `read ${(signedAge / 1000).toFixed(1)}s ago` : ''}
            {theirGapMs != null ? ` · last changed ${(theirGapMs / 1000).toFixed(2)}s after the one before` : ''}
          </div>
        </div>
      </div>

      {/* the lead */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-baseline justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Measured lead, this session</div>
            <div className="text-[30px] font-bold text-foreground mt-1 tabular-nums">
              {leadMs != null ? `${(leadMs / 1000).toFixed(2)}s ahead` : 'measuring…'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>
              fitted across their last {leadN} signed changes · needs {MIN_SAMPLES} before it reports
              {fit != null ? ` · fit $${money(fit)}` : ''}
              {basis != null ? ` · level offset ${basis >= 0 ? '+' : '−'}$${money(Math.abs(basis))}` : ''}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>Live difference</div>
            <div className="text-[22px] font-bold text-foreground mt-1 tabular-nums">
              {gap != null ? `${gap >= 0 ? '+' : '−'}$${money(Math.abs(gap))}` : '—'}
            </div>
            <div className={`text-[11px] mt-1 ${subtle}`}>
              {gapBp != null ? `${gapBp >= 0 ? '+' : ''}${gapBp.toFixed(2)}bp vs ours` : ''}
            </div>
          </div>
        </div>
        <div className={`mt-4 pt-4 border-t text-[11px] leading-relaxed ${isDark ? 'border-white/5' : 'border-black/5'} ${subtle}`}>
          Measured offline at <span className="text-foreground font-bold">+3200ms</span> over 10 minutes and 1,631
          signed-price changes, well depth 74%, with the self-control reading +0ms at 99%. This is the largest oracle
          lag found anywhere in this project by an order of magnitude — and unlike an order-book venue&apos;s oracle it
          is not a side quantity, it is the number a fill is priced from.
        </div>
      </div>

      {/* what it is worth */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle} mb-2`}>
          What the 3.2 seconds is worth
        </div>
        <div className={`text-[12px] leading-relaxed ${subtle}`}>
          <span className="font-bold text-foreground">Nothing, and the margin is not close.</span>{' '}
          GMX orders are executed by a keeper a block or two after you submit, at whatever the oracle says
          <em> then</em> — you cannot lock in the stale price you can see, so the window you actually get is 3.2s minus
          your submit-to-execution latency. Against a round trip of {GMX_BAND_BP.toFixed(2)}bp band plus{' '}
          {GMX_FEE_BP_PER_SIDE}bp per side = <span className="font-bold text-foreground">{GMX_ROUND_TRIP_BP.toFixed(1)}bp</span>
          {breakEven != null ? <>, a <span className="font-bold text-foreground">${money(breakEven)}</span> move on today&apos;s price</> : null}
          , the largest move BTC made in <em>any</em> 3.2-second window across the capture was{' '}
          <span className="font-bold text-foreground">$69.90</span>. Hit rate{' '}
          <span className="font-bold text-foreground">0.00%</span>, at zero reaction time, on the cheaper fee
          assumption. The median 3.2s move is 1.25bp against a 10.4bp cost — you need something past the 99.9th
          percentile just to break even. The fee is the wall, not the lag.
        </div>
      </div>

      {/* inputs */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle} mb-3`}>
          The books our read is built from
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {inputs.map((leg) => (
            <div key={leg.key} className={`rounded-[10px] px-3 py-2 border ${isDark ? 'border-white/5' : 'border-black/5'}`}>
              <div className="text-[12px] font-bold text-foreground capitalize">{leg.label}</div>
              <div className={`text-[13px] tabular-nums mt-0.5 ${leg.price != null ? 'text-foreground' : subtle}`}>
                {leg.price != null ? `$${fmt(leg.price)}` : 'unavailable'}
              </div>
            </div>
          ))}
        </div>
        <div className={`text-[11px] mt-3 ${subtle}`}>
          This source set was recovered against <span className="text-foreground font-bold">Gains</span>, not GMX — GMX
          prices from Chainlink Data Streams, whose publisher set is not public. It is used here as a fast, accurate
          USD read, and no claim is made that these are GMX&apos;s own inputs. USDT-quoted books are converted at the
          live USDT/USD rate before the median is taken.
        </div>
      </div>

      {/* the trap */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        <span className="font-bold text-foreground">Why this reads the signed feed and not the ticker.</span>{' '}
        GMX publishes two prices. <span className="font-mono text-[11px]">/prices/tickers</span> is the UI display
        feed — polled, and on BTC its min/max band is collapsed to zero; it reads +2900ms.{' '}
        <span className="font-mono text-[11px]">/signed_prices/latest</span> is what keepers execute against
        (<span className="font-mono text-[11px]">oracleType: realtimeFeed2</span>, Chainlink Data Streams); it reads
        +3200ms and carries a real band. Measuring the ticker and calling it the fill price would have reported a
        zero-spread venue with a 2.9s lag — a considerably better trade than exists. The feed orders actually price
        from is both slower <em>and</em> carries a cost the display feed does not show.
        <br /><br />
        <span className="font-bold text-foreground">Caveats.</span> Ten minutes on a quiet tape; in a violent market
        $79 moves inside 3.2s certainly happen, and the claim is not &ldquo;never&rdquo; but that the fee is 5-8x the
        median move, so the venue is defended by construction rather than by luck. GMX&apos;s fee is shown as 5bp per
        side from their published schedule — it is not on their public API — and price impact is excluded entirely.
        Both omissions make this look better than it is.
      </div>
    </div>
  );
};
