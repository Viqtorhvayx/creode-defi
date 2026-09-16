"use client";

// Lead vs Mirror — a live test of whether Binance leads Hotstuff's book.
//
// It holds a rolling buffer of Creode's Binance reads and shows the value
// from ~2s ago beside the live one, both compared against Hotstuff's current
// mid. If a 2s lead existed, the DELAYED value would sit closer to their
// book. It doesn't: in testing the live value ran roughly half the error of
// the delayed one, and an offline check on 107 quote changes agreed (best
// fit at 0-500ms, error rising steadily past that).
//
// This tab is what caught an earlier wrong claim of a ~2s lead — see the
// comment block in lib/hotstuffFastPrice.ts. It's kept as a standing check
// rather than a demonstration, because a live instrument that can falsify a
// stated result is worth more than one built to confirm it.
//
// Why the basis adjustment: Binance sits persistently ~0.055% above their
// mid (measured, never flipped sign over 359s). Raw differences would be
// dominated by that standing offset rather than by timing, so both figures
// have a rolling estimate of it subtracted before comparison. Without that
// the comparison would be meaningless.
//
// The naming is the point: one side LEADS (a different venue's price that
// their book tends to follow), the other is MIRRORED (their own number,
// relayed — it can arrive same-time or later, never earlier).
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribePythPrice } from '../lib/pythStream';
import {
  HOTSTUFF_MARKETS,
  fetchHotstuffTicker,
  subscribeHotstuffTicker,
  type HotstuffTicker,
} from '../lib/hotstuffFastPrice';

interface LeadMirrorTabProps {
  theme?: 'light' | 'dark';
}

const BINANCE_POLL_MS = 50;
const TICKER_POLL_MS = 400;
const LAG_MS = 2000;        // the lead hypothesis under test
const BUFFER_MS = 8000;     // keep enough history to look back LAG_MS
const BASIS_ALPHA = 0.02;   // EMA weight for the standing Binance-vs-mid offset
// A quote change only tells us something about timing if Binance actually
// moved across the lookback window — otherwise both candidate values are the
// same number and the "winner" is noise in the basis estimate.
//
// Sized against the resolution of the comparison, not against the spread: on
// BTC-PERP their book quotes in $1 ticks and the two distances typically
// differ by ~$1, so a Binance move of ~2 ticks is already distinguishable.
// 0.003% is ~$2.30 at $76k. An earlier 0.02% (~$15 in a 2s window) was far
// too strict and skipped every normal observation — 14 of 14 in testing.
const MIN_MOVE_FRAC = 0.00003;

const fmt = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};

// Distances are dollar amounts, not token prices — the 8-decimal tail the
// price formatter needs for assets like PEPE just makes these unreadable.
const fmtDistance = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
};

export const LeadMirrorTab: React.FC<LeadMirrorTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(HOTSTUFF_MARKETS[0].sym);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fastPrice, setFastPrice] = useState<number | null>(null);
  const [ticker, setTicker] = useState<HotstuffTicker | null>(null);
  const [, setTick] = useState(0);

  const bufferRef = useRef<{ t: number; price: number }[]>([]);
  const basisRef = useRef<number | null>(null);  // EMA of (binance - hsMid)
  // Running MEAN of each distance rather than a win/lose tally. A win-rate
  // discards magnitude and converges slowly — in testing it read 33% off six
  // observations, which is noise, but reads as though it contradicts the
  // measured result. Averaging uses the size of each miss, so it settles far
  // sooner on the same underlying question.
  const scoreRef = useRef({ n: 0, sumLive: 0, sumLag: 0, skipped: 0 });
  const lastScoredMidRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const market = HOTSTUFF_MARKETS.find((m) => m.sym === selected) ?? HOTSTUFF_MARKETS[0];

  // Creode's own fast read (Binance, or Pyth for HYPE).
  useEffect(() => {
    setFastPrice(null);
    bufferRef.current = [];
    basisRef.current = null;
    scoreRef.current = { n: 0, sumLive: 0, sumLag: 0, skipped: 0 };
    lastScoredMidRef.current = null;
    let alive = true;

    const record = (price: number) => {
      if (!alive) return;
      const now = Date.now();
      const buf = bufferRef.current;
      buf.push({ t: now, price });
      while (buf.length && now - buf[0].t > BUFFER_MS) buf.shift();
      setFastPrice(price);
    };

    if (market.source === 'pyth' && market.pythFeedId) {
      const un = subscribePythPrice(market.pythFeedId, ({ price }) => record(price));
      return () => { alive = false; un(); };
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(market.sym)}&source=binance`);
        if (!res.ok || !alive) return;
        const d = await res.json();
        if (d.price != null) record(d.price);
      } catch { /* keep last known */ }
    };
    poll();
    const timer = setInterval(poll, BINANCE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [market.sym, market.source, market.pythFeedId]);

  // Hotstuff's mid — pushed over their WebSocket, REST as fallback.
  useEffect(() => {
    setTicker(null);
    let alive = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    // Score exactly once per REAL quote change, not once per render.
    //
    // An earlier version tallied on every 250ms tick, which was wrong twice
    // over: their mid only moves every ~3.3s in discrete ticks, so the same
    // event got counted ~13 times, and flat stretches (where the live and
    // delayed Binance values are identical) contributed pure coin-flips.
    // That produced wildly unstable results — 60% on one run and 0% on the
    // next. One observation per quote change is what the offline
    // cross-correlation actually measured.
    const scoreOnMidChange = (t: HotstuffTicker) => {
      const prevMid = lastScoredMidRef.current;
      if (prevMid === t.midPrice) return;      // no new event
      lastScoredMidRef.current = t.midPrice;
      if (prevMid === null) return;            // first sighting, nothing to compare

      const now = Date.now();
      const b = bufferRef.current;
      const liveNow = b.length ? b[b.length - 1].price : null;
      let lagged: number | null = null;
      for (let i = b.length - 1; i >= 0; i--) {
        if (b[i].t <= now - LAG_MS) { lagged = b[i].price; break; }
      }
      const bas = basisRef.current;
      if (liveNow == null || lagged == null || bas == null) return;

      // Only informative when Binance actually moved across the window —
      // otherwise both candidates are the same number and the "winner" is
      // noise in the basis estimate.
      if (Math.abs(liveNow - lagged) < MIN_MOVE_FRAC * t.midPrice) {
        scoreRef.current.skipped++;
        return;
      }

      scoreRef.current.n++;
      scoreRef.current.sumLive += Math.abs(liveNow - bas - t.midPrice);
      scoreRef.current.sumLag += Math.abs(lagged - bas - t.midPrice);
    };

    const apply = (t: HotstuffTicker) => {
      if (!alive) return;
      scoreOnMidChange(t);
      setTicker(t);
    };

    fetchHotstuffTicker(market.instrument).then((t) => { if (t) apply(t); });

    const startFallback = () => {
      if (!alive || pollTimer) return;
      pollTimer = setInterval(async () => {
        const t = await fetchHotstuffTicker(market.instrument);
        if (t) apply(t);
      }, TICKER_POLL_MS);
    };

    const un = subscribeHotstuffTicker(market.instrument, apply, startFallback);
    return () => {
      alive = false;
      un();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [market.instrument]);

  // Re-render on a timer so the delayed lookup and "ago" readouts advance
  // between upstream ticks.
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 250);
    return () => clearInterval(t);
  }, []);

  // Binance's value from ~LAG_MS ago: the newest sample at or before the
  // cutoff, so we compare against a real observation rather than an
  // interpolation.
  const cutoff = Date.now() - LAG_MS;
  const buf = bufferRef.current;
  let delayed: number | null = null;
  for (let i = buf.length - 1; i >= 0; i--) {
    if (buf[i].t <= cutoff) { delayed = buf[i].price; break; }
  }

  const hsMid = ticker?.midPrice ?? null;

  // Standing offset between the two venues, tracked as an EMA so the
  // comparison below reflects timing rather than the persistent basis.
  if (fastPrice != null && hsMid != null) {
    const raw = fastPrice - hsMid;
    basisRef.current = basisRef.current == null
      ? raw
      : basisRef.current * (1 - BASIS_ALPHA) + raw * BASIS_ALPHA;
  }
  const basis = basisRef.current;

  let liveErr: number | null = null;
  let delayedErr: number | null = null;
  if (fastPrice != null && hsMid != null && basis != null) {
    liveErr = Math.abs(fastPrice - basis - hsMid);
    if (delayed != null) delayedErr = Math.abs(delayed - basis - hsMid);
  }

  const score = scoreRef.current;
  const total = score.n;
  const avgLive = total > 0 ? score.sumLive / total : null;
  const avgLag = total > 0 ? score.sumLag / total : null;

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtle = isDark ? 'text-white/50' : 'text-slate-500';

  const Badge = ({ text, color }: { text: string; color: string }) => (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      {text}
    </span>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Lead vs Mirror</h2>
        <p className={`text-[13px] mt-1 ${subtle}`}>
          Which number is Hotstuff&apos;s book actually tracking — Binance live, or Binance from ~2s ago?
        </p>
      </div>

      {/* Market selector */}
      <div className="relative w-fit" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[14px] border ${cardBg} text-foreground`}
        >
          <span>{market.sym}</span>
          <span className={`font-normal text-[12px] ${subtle}`}>{market.name}</span>
          <CaretDown size={14} className={subtle} />
        </button>
        {dropdownOpen && (
          <div className={`absolute z-20 mt-2 w-[260px] max-h-[320px] overflow-y-auto rounded-[12px] border shadow-lg backdrop-blur-xl ${
            isDark ? 'bg-[#0B0F14]/95 border-white/10' : 'bg-white/95 border-[#EAECEF]'
          }`}>
            {HOTSTUFF_MARKETS.map((m) => (
              <button
                key={m.sym}
                onClick={() => { setSelected(m.sym); setDropdownOpen(false); }}
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

      {/* Three readouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${subtle}`}>Binance · live</span>
            <Badge text="leads" color="#10B981" />
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>A different venue&apos;s price</div>
          <div className="text-[26px] font-bold text-foreground mt-2 tabular-nums">
            {fastPrice != null ? `$${fmt(fastPrice)}` : '—'}
          </div>
        </div>

        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${subtle}`}>Binance · 2s ago</span>
            <Badge text="held back" color="#00A8E8" />
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>Same feed, held back by the lag being tested</div>
          <div className="text-[26px] font-bold text-foreground mt-2 tabular-nums">
            {delayed != null ? `$${fmt(delayed)}` : '—'}
          </div>
        </div>

        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[11px] font-bold uppercase tracking-wide ${subtle}`}>Hotstuff · mid</span>
            <Badge text="mirrored" color="#94A3B8" />
          </div>
          <div className={`text-[11px] mt-1 ${subtle}`}>Their number — never arrives early</div>
          <div className="text-[26px] font-bold text-foreground mt-2 tabular-nums">
            {hsMid != null ? `$${fmt(hsMid)}` : '—'}
          </div>
        </div>
      </div>

      {/* The comparison */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>
          Which one is their book closer to?
        </div>
        <div className={`text-[11px] mt-1 ${subtle}`}>
          Standing offset between the venues removed from both, so this reflects timing and not the basis.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <div className={`text-[11px] ${subtle}`}>Distance from Binance · live</div>
            <div className="text-[20px] font-bold text-foreground tabular-nums">
              {liveErr != null ? `$${fmtDistance(liveErr)}` : '—'}
            </div>
          </div>
          <div>
            <div className={`text-[11px] ${subtle}`}>Distance from Binance · 2s ago</div>
            <div
              className="text-[20px] font-bold tabular-nums"
              style={{
                color: delayedErr != null && liveErr != null
                  ? (delayedErr < liveErr ? '#10B981' : '#94A3B8')
                  : undefined,
              }}
            >
              {delayedErr != null ? `$${fmtDistance(delayedErr)}` : '—'}
            </div>
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtle}`}>
            Session average distance
            <span className="normal-case font-normal"> · {total} quote {total === 1 ? 'change' : 'changes'}</span>
          </div>
          {total >= 5 && avgLive != null && avgLag != null ? (
            <div className="flex gap-8 mt-2 flex-wrap">
              <div>
                <div className={`text-[11px] ${subtle}`}>Binance · live</div>
                <div
                  className="text-[20px] font-bold tabular-nums"
                  style={{ color: avgLive <= avgLag ? '#10B981' : undefined }}
                >
                  ${fmtDistance(avgLive)}
                </div>
              </div>
              <div>
                <div className={`text-[11px] ${subtle}`}>Binance · 2s ago</div>
                <div
                  className="text-[20px] font-bold tabular-nums"
                  style={{ color: avgLag < avgLive ? '#10B981' : undefined }}
                >
                  ${fmtDistance(avgLag)}
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-[14px] mt-2 ${subtle}`}>
              gathering — {total} of 5 quote changes so far
            </div>
          )}
          <div className={`text-[11px] mt-1.5 ${subtle}`}>
            The smaller average is the one their book is really tracking. Measured{' '}
            <span className="text-foreground font-bold">once per quote change</span>{' '}
            — not per second — and only when Binance moved enough across the window to tell the two candidates apart
            {score.skipped > 0 ? ` (${score.skipped} skipped as too flat to be informative)` : ''}. Their book
            requotes every ~3s, so this accumulates slowly and stays noisy for the first few dozen observations; the
            0.61 correlation on the Hotstuff Lead tab rests on 107 of them, and that measurement is the
            authoritative one. Session counter — resets on reload or market switch.
          </div>
        </div>
      </div>

      {/* Note */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtle}`}>
        Two distinct things are being separated here.{' '}
        <span className="font-bold text-foreground">Hotstuff&apos;s mid is mirrored</span>{' '}
        — Creode reads it from their API, so it can arrive at the same moment or later, never earlier. No copy
        precedes its source, so a lead could only ever exist between different venues, never between a number and its
        own relay. The open question was whether Binance, as a separate venue, leads their book.{' '}
        <span className="font-bold text-foreground">On the evidence so far it does not.</span>{' '}
        The live value tracks their quotes about as well or better than the delayed one, and an offline check across
        107 quote changes put the best fit inside 500ms — within our own polling latency. This tab exists to keep
        testing that rather than to assert it; an earlier ~2s figure was an artifact of resampling, and this
        comparison is what exposed it.
      </div>
    </div>
  );
};
