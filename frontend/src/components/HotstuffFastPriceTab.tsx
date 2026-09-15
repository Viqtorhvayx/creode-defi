"use client";

// Hotstuff Lead — Creode's own direct-exchange read shown against Hotstuff's
// published oracle, so the lead time between them is visible rather than
// asserted.
//
// This tab shows two numbers on purpose (unlike the Bullbit Fast Price tab,
// which is deliberately single-price): the whole point here is the *gap*
// between Creode's live read and Hotstuff's slower published oracle, and a
// lone number can't show that. Everything shown is measured, not predicted —
// Creode's own read on one side, Hotstuff's own published figure on the
// other.
//
// See lib/hotstuffFastPrice.ts for the measured characteristics of their
// oracle, and the disclaimer at the bottom of this file for why a slow
// oracle is not the same thing as a trading edge.
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribePythPrice } from '../lib/pythStream';
import { HOTSTUFF_MARKETS, fetchHotstuffOracle, type HotstuffOracleTick } from '../lib/hotstuffFastPrice';

interface HotstuffFastPriceTabProps {
  theme?: 'light' | 'dark';
}

const BINANCE_POLL_MS = 50;   // same proven cadence as the Vault market chart
const ORACLE_POLL_MS = 400;   // their oracle only refreshes ~every 2.16s; 400ms is plenty
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
  const [oracle, setOracle] = useState<HotstuffOracleTick | null>(null);
  // When Hotstuff's oracle value last actually CHANGED (not just when we
  // last polled it) — this is what makes their ~2.16s refresh cadence
  // visible instead of hidden behind our own polling rate.
  const [oracleChangedAt, setOracleChangedAt] = useState<number | null>(null);
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

  // Hotstuff's published oracle.
  useEffect(() => {
    setOracle(null);
    setOracleChangedAt(null);
    let alive = true;
    let lastIndex: number | null = null;

    const poll = async () => {
      const tick = await fetchHotstuffOracle(market.oracleSymbol);
      if (!alive || !tick) return;
      if (lastIndex === null || tick.indexPrice !== lastIndex) {
        lastIndex = tick.indexPrice;
        setOracleChangedAt(Date.now());
      }
      setOracle(tick);
    };
    poll();
    const timer = setInterval(poll, ORACLE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [market.oracleSymbol]);

  // Drives the "Xs ago" readout so it counts up between oracle refreshes
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

  const gap = fastPrice != null && oracle != null ? fastPrice - oracle.indexPrice : null;
  const gapPct = gap != null && oracle != null ? (gap / oracle.indexPrice) * 100 : null;

  if (gapPct != null) {
    const hist = historyRef.current;
    if (hist.length === 0 || hist[hist.length - 1] !== gapPct) {
      hist.push(gapPct);
      if (hist.length > HISTORY_MAX) hist.shift();
    }
  }
  const history = historyRef.current;

  const oracleAgeMs = oracleChangedAt != null ? Date.now() - oracleChangedAt : null;

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
          Creode&apos;s own live exchange read against Hotstuff&apos;s published oracle — measured, not predicted.
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
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Hotstuff Oracle</div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>Weighted median of 9 venues — refreshes ~every 2s</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {oracle != null ? `$${formatMoney(oracle.indexPrice)}` : '—'}
          </div>
          <div className={`text-[11px] mt-1 ${subtleText}`}>
            {oracleAgeMs != null
              ? `last changed ${(oracleAgeMs / 1000).toFixed(1)}s ago`
              : 'waiting for first refresh…'}
          </div>
        </div>
      </div>

      {/* Gap */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Gap (Creode − Hotstuff)</div>
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
              Measured median on BTC: <span className="text-foreground font-bold">0.0127%</span> (~$9.74 at $77k)
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
        Hotstuff&apos;s oracle is a weighted median of nine venues (Binance, Bybit, Gate.io, Hyperliquid, Kraken,
        KuCoin, MEXC, OKX, Pyth) with outlier filtering, refreshing roughly every 2 seconds — so Creode&apos;s
        single-source read genuinely does move first. Measured on BTC, the correlation peak sits around 3 seconds.
        <span className="font-bold text-foreground"> That is not a trading edge.</span>{' '}
        You don&apos;t fill orders
        against the oracle — you fill against Hotstuff&apos;s order book, and the market makers quoting it read the
        same exchanges in real time. A slow oracle affects margin and liquidation math, not the price you trade at.
        The gap itself is also small: a median of ~0.013% is a fraction of what fees and spread cost to cross.
        This is a measurement, shown honestly, not a signal.
      </div>
    </div>
  );
};
