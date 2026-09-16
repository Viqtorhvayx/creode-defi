"use client";

// Hotstuff Lead — Creode's own direct-exchange read shown against
// Hotstuff's actual market price (order book mid), so the difference
// between them is visible rather than asserted.
//
// Compares against the MID, not the oracle, deliberately: the mid is what
// you'd actually trade near, and the oracle is only used for their margin
// and liquidation math. The oracle still arrives in the same ticker call
// and is used in the measured notes below, but it isn't the headline
// comparison.
//
// This tab shows two numbers on purpose (unlike the Bullbit Fast Price tab,
// which is deliberately single-price): the whole point here is the *gap*
// between Creode's live read and Hotstuff's own book, and a lone number
// can't show that. Everything shown is measured, not predicted.
//
// See lib/hotstuffFastPrice.ts for measured characteristics, and the
// disclaimer at the bottom of this file for why a steady basis is not a
// trading edge.
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribePythPrice } from '../lib/pythStream';
import {
  HOTSTUFF_MARKETS,
  fetchHotstuffTicker,
  subscribeHotstuffTicker,
  type HotstuffTicker,
} from '../lib/hotstuffFastPrice';

interface HotstuffFastPriceTabProps {
  theme?: 'light' | 'dark';
}

const BINANCE_POLL_MS = 50;   // same proven cadence as the Vault market chart
// Only used if the WebSocket can't be established — see the fallback note in
// lib/hotstuffFastPrice.ts.
const TICKER_POLL_MS = 400;
const HISTORY_MAX = 180;

const formatMoney = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};

export const HotstuffFastPriceTab: React.FC<HotstuffFastPriceTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(HOTSTUFF_MARKETS[0].sym);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fastPrice, setFastPrice] = useState<number | null>(null);
  const [ticker, setTicker] = useState<HotstuffTicker | null>(null);
  // When Hotstuff's mid last actually CHANGED (not just when we last polled
  // it) — this is what makes their ~3.3s quote cadence visible instead of
  // hidden behind our own polling rate.
  const [midChangedAt, setMidChangedAt] = useState<number | null>(null);
  const [liveSource, setLiveSource] = useState<'connecting' | 'ws' | 'poll'>('connecting');
  const [, setTickVersion] = useState(0);
  const historyRef = useRef<number[]>([]); // rolling gap % for the sparkline
  const dropdownRef = useRef<HTMLDivElement>(null);

  const market = HOTSTUFF_MARKETS.find((m) => m.sym === selected) ?? HOTSTUFF_MARKETS[0];

  // Creode's own fast read.
  useEffect(() => {
    setFastPrice(null);
    historyRef.current = [];
    let alive = true;

    if (market.source === 'pyth' && market.pythFeedId) {
      const unsubscribe = subscribePythPrice(market.pythFeedId, ({ price }) => {
        if (alive) setFastPrice(price);
      });
      return () => { alive = false; unsubscribe(); };
    }

    const poll = async () => {
      try {
        const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(market.sym)}&source=binance`);
        if (!res.ok || !alive) return;
        const d = await res.json();
        if (d.price != null) setFastPrice(d.price);
      } catch { /* keep last known price */ }
    };
    poll();
    const timer = setInterval(poll, BINANCE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [market.sym, market.source, market.pythFeedId]);

  // Hotstuff's own market price (order book mid), plus bid/ask and the
  // oracle — all same-instant, since they arrive together in one ticker
  // payload.
  //
  // Pushed over their WebSocket rather than polled: with a 400ms poll we'd
  // learn about a change up to 400ms after it happened, which is delay
  // Creode was adding on its own. The REST poll stays as a fallback for
  // environments that block raw browser WebSockets, and to paint the card
  // immediately on mount instead of waiting for the first push.
  useEffect(() => {
    setTicker(null);
    setMidChangedAt(null);
    setLiveSource('connecting');
    let alive = true;
    let lastMid: number | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const apply = (t: HotstuffTicker, via: 'ws' | 'poll') => {
      if (!alive) return;
      if (lastMid === null || t.midPrice !== lastMid) {
        lastMid = t.midPrice;
        setMidChangedAt(Date.now());
      }
      setTicker(t);
      setLiveSource(via);
    };

    // Immediate first paint, and the seed value if the socket is slow to
    // deliver its first push.
    fetchHotstuffTicker(market.instrument).then((t) => {
      if (t && alive && lastMid === null) apply(t, 'poll');
    });

    const startPollFallback = () => {
      if (!alive || pollTimer) return;
      pollTimer = setInterval(async () => {
        const t = await fetchHotstuffTicker(market.instrument);
        if (t) apply(t, 'poll');
      }, TICKER_POLL_MS);
    };

    const unsubscribe = subscribeHotstuffTicker(
      market.instrument,
      (t) => apply(t, 'ws'),
      startPollFallback,
    );

    return () => {
      alive = false;
      unsubscribe();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [market.instrument]);

  // Drives the "Xs ago" readout so it counts up between quote updates
  // instead of freezing until the next tick lands.
  useEffect(() => {
    const t = setInterval(() => setTickVersion((v) => v + 1), 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const gap = fastPrice != null && ticker != null ? fastPrice - ticker.midPrice : null;
  const gapPct = gap != null && ticker != null ? (gap / ticker.midPrice) * 100 : null;
  const spreadPct = ticker != null && ticker.bidPrice > 0
    ? ((ticker.askPrice - ticker.bidPrice) / ticker.bidPrice) * 100
    : null;

  if (gapPct != null) {
    const hist = historyRef.current;
    if (hist.length === 0 || hist[hist.length - 1] !== gapPct) {
      hist.push(gapPct);
      if (hist.length > HISTORY_MAX) hist.shift();
    }
  }
  const history = historyRef.current;

  const midAgeMs = midChangedAt != null ? Date.now() - midChangedAt : null;

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtleText = isDark ? 'text-white/50' : 'text-slate-500';

  const sparkW = 100, sparkH = 32;
  let sparkPoints = '';
  if (history.length > 1) {
    const hi = Math.max(...history, 0.0001);
    const lo = Math.min(...history, -0.0001);
    const range = hi - lo || 1;
    sparkPoints = history
      .map((v, i) => {
        const x = (i / (history.length - 1)) * sparkW;
        const y = sparkH - ((v - lo) / range) * sparkH;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Hotstuff Lead</h2>
        <p className={`text-[13px] mt-1 ${subtleText}`}>
          Creode&apos;s own live exchange read against Hotstuff&apos;s order book — measured, not predicted.
        </p>
      </div>

      {/* Market selector */}
      <div className="relative w-fit" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] font-bold text-[14px] border ${cardBg} text-foreground`}
        >
          <span>{market.sym}</span>
          <span className={`font-normal text-[12px] ${subtleText}`}>{market.name}</span>
          <CaretDown size={14} className={subtleText} />
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
                <span className={subtleText}>{m.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price readouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>
            Creode Fast Price <span className="normal-case font-normal">· via {market.source === 'pyth' ? 'Pyth' : 'Binance'}</span>
          </div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>Direct exchange read, polled continuously</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {fastPrice != null ? `$${formatMoney(fastPrice)}` : '—'}
          </div>
        </div>
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>
            Hotstuff Market Price
            {liveSource !== 'connecting' && (
              <span className="normal-case font-normal">
                {' '}· {liveSource === 'ws' ? 'pushed live' : 'polled (fallback)'}
              </span>
            )}
          </div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>Order book mid — what you&apos;d actually trade near</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {ticker != null ? `$${formatMoney(ticker.midPrice)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 tabular-nums ${subtleText}`}>
            {ticker != null
              ? `bid $${formatMoney(ticker.bidPrice)} · ask $${formatMoney(ticker.askPrice)}${
                  spreadPct != null ? ` · spread ${spreadPct.toFixed(4)}%` : ''
                }`
              : ' '}
          </div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>
            {midAgeMs != null
              ? `last changed ${(midAgeMs / 1000).toFixed(1)}s ago`
              : 'waiting for first quote…'}
          </div>
        </div>
      </div>

      {/* Gap */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Gap (Creode − Hotstuff Market)</div>
            <div className={`text-[24px] font-bold mt-1 tabular-nums ${
              gap == null ? 'text-foreground' : gap >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}>
              {gap == null ? '—' : `${gap >= 0 ? '+' : '−'}$${formatMoney(Math.abs(gap))}`}
              {gapPct != null && (
                <span className="text-[14px] font-normal ml-2">
                  ({gapPct >= 0 ? '+' : ''}{gapPct.toFixed(4)}%)
                </span>
              )}
            </div>
            <div className={`text-[11px] mt-2 ${subtleText}`}>
              Measured on BTC: median gap <span className="text-foreground font-bold">0.0551%</span> vs. median
              spread <span className="text-foreground font-bold">0.0474%</span> — the gap runs only ~1.2x the cost
              of crossing it
            </div>
          </div>
          {sparkPoints && (
            <svg width={sparkW} height={sparkH} className="shrink-0">
              <polyline
                points={sparkPoints}
                fill="none"
                stroke="#00A8E8"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtleText}`}>
        This compares Creode&apos;s own direct exchange read against Hotstuff&apos;s order book mid — the price you&apos;d
        actually trade near, rather than their oracle. Hotstuff&apos;s market price tracks its oracle tightly: measured
        over 149s on BTC, the mid held a steady ~0.045% discount to index and never deviated more than 0.098%, far
        inside their ±7.5% bandwidth cap, with funding pinned throughout to sustain it.
        <span className="font-bold text-foreground"> A gap here is not free money.</span>{' '}
        Measured over 75s on BTC, Creode&apos;s read sat a steady 0.0551% above Hotstuff&apos;s mid — never once
        flipping sign — while the spread you&apos;d cross to act on it ran 0.0474%. The gap is roughly 1.2x the
        crossing cost before Hotstuff&apos;s own fees, and a basis that holds steady in one direction is the
        market&apos;s clearing price, not an error waiting to close. This is a measurement, shown honestly, not a
        signal.
      </div>
    </div>
  );
};
