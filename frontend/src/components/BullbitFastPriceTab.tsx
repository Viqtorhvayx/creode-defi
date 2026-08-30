"use client";

// Bullbit Fast Price — Creode's own direct-exchange read for Bullbit's
// crypto markets, meant as a faster reference while trading on Bullbit
// itself. This is deliberately a SINGLE price, not a comparison: Bullbit's
// own index/mark prices are not fetched or shown here at all (see the
// earlier, now-removed Bullbit Gap Monitor for that shape — this replaces
// it per explicit request: "I only need the faster oracle, I don't need
// the market price on Creode").
//
// Source per symbol: Binance direct poll for the 22 markets Binance spot-
// lists, Pyth's existing stream for HYPE (the one exception — Binance does
// not list HYPE at all). See lib/bullbitFastPrice.ts for the full mapping
// and how each was verified.
//
// Honesty note baked into the UI itself: a live measurement earlier this
// session found Bullbit's own published index price lags raw Binance by a
// median of roughly ~400ms for BTC under normal conditions — real, but
// modest, and not guaranteed on every tick. This tab does not claim a
// fixed lead time; it just shows Creode's own fast number.
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribePythPrice } from '../lib/pythStream';
import { BULLBIT_FAST_MARKETS } from '../lib/bullbitFastPrice';

interface BullbitFastPriceTabProps {
  theme?: 'light' | 'dark';
}

const BINANCE_POLL_MS = 50; // same proven cadence as the Vault market chart
const HISTORY_MAX = 180; // session-only rolling price history for the sparkline

const formatMoney = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};

export const BullbitFastPriceTab: React.FC<BullbitFastPriceTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(BULLBIT_FAST_MARKETS[0].sym);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const historyRef = useRef<number[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const market = BULLBIT_FAST_MARKETS.find((m) => m.sym === selected) ?? BULLBIT_FAST_MARKETS[0];

  useEffect(() => {
    setPrice(null);
    setUpdatedAt(null);
    historyRef.current = [];
    setHistoryVersion((v) => v + 1);
    let alive = true;

    const applyPrice = (p: number) => {
      if (!alive) return;
      setPrice(p);
      setUpdatedAt(Date.now());
      const hist = historyRef.current;
      hist.push(p);
      if (hist.length > HISTORY_MAX) hist.shift();
      setHistoryVersion((v) => v + 1);
    };

    if (market.source === 'pyth' && market.pythFeedId) {
      const unsubscribe = subscribePythPrice(market.pythFeedId, ({ price: p }) => applyPrice(p));
      return () => { alive = false; unsubscribe(); };
    }

    const pollBinance = async () => {
      try {
        const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(market.sym)}&source=binance`);
        if (!res.ok || !alive) return;
        const d = await res.json();
        if (d.price != null) applyPrice(d.price);
      } catch { /* keep last known price */ }
    };
    pollBinance();
    const timer = setInterval(pollBinance, BINANCE_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [market.sym, market.source, market.pythFeedId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const history = historyRef.current;
  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtleText = isDark ? 'text-white/50' : 'text-slate-500';

  const sparkW = 280, sparkH = 60;
  let sparkPoints = '';
  if (history.length > 1) {
    const hi = Math.max(...history);
    const lo = Math.min(...history);
    const range = hi - lo || 1;
    sparkPoints = history
      .map((v, i) => {
        const x = (i / (history.length - 1)) * sparkW;
        const y = sparkH - ((v - lo) / range) * sparkH;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  const staleSecs = updatedAt != null ? Math.floor((Date.now() - updatedAt) / 1000) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold text-foreground">Bullbit Fast Price</h2>
        <p className={`text-[13px] mt-1 ${subtleText}`}>
          Creode&apos;s own direct-exchange read for Bullbit&apos;s crypto markets — a fast reference for trading on Bullbit, not Bullbit&apos;s own published number.
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
          <div className={`absolute z-20 mt-2 w-[260px] max-h-[320px] overflow-y-auto rounded-[12px] border shadow-lg ${cardBg}`}>
            {BULLBIT_FAST_MARKETS.map((m) => (
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

      {/* Price readout */}
      <div className={`rounded-[16px] border p-6 ${cardBg}`}>
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>
              Fast Price <span className="normal-case font-normal">· via {market.source === 'pyth' ? 'Pyth' : 'Binance'}</span>
            </div>
            <div className="text-[40px] font-bold text-foreground mt-2 tabular-nums">
              {price != null ? `$${formatMoney(price)}` : '—'}
            </div>
            <div className={`text-[11px] mt-1 ${subtleText}`}>
              {staleSecs != null ? (staleSecs <= 1 ? 'updated just now' : `updated ${staleSecs}s ago`) : 'waiting for first tick…'}
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
        This is Creode&apos;s own direct read of the underlying exchange — not Bullbit&apos;s published index or mark price.
        A live measurement earlier found Bullbit&apos;s own oracle typically lags raw exchange prices by roughly
        <span className="font-bold text-foreground"> a few hundred milliseconds</span> under normal conditions — real, but
        modest, and not a fixed or guaranteed lead on every tick. Use this as a fast reference, not a trading signal on its own.
      </div>
    </div>
  );
};
