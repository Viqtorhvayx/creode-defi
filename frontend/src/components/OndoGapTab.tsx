"use client";

// Ondo Gap Monitor — live oracle vs. mark price for Ondo Perps' equity and
// commodity markets, side by side. Display-only: this shows you the same
// two numbers Ondo Perps itself publishes (their own oraclePrice, fed
// straight from Chainlink, and their own markPrice, driven by their order
// book and pulled toward oracle over time via funding) — nothing predicted,
// nothing traded on your behalf. No wallet connection to Ondo, no order
// placement. See relay-server/ondoGapPx.js for the live data source.
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribeOndoGap, ONDO_GAP_MARKETS, type OndoGapTick } from '../lib/ondoGapStream';

interface OndoGapTabProps {
  theme?: 'light' | 'dark';
}

// Session-only rolling history for the sparkline + stats — resets on page
// reload. Not persisted; this is a live-watching tool, not a historical
// archive.
const HISTORY_MAX = 180; // ~a few minutes at roughly 1 tick/sec

const formatMoney = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
};

export const OndoGapTab: React.FC<OndoGapTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(ONDO_GAP_MARKETS[0].sym);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tick, setTick] = useState<OndoGapTick | null>(null);
  const historyRef = useRef<number[]>([]); // rolling basis % history for the sparkline
  const [historyVersion, setHistoryVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const market = ONDO_GAP_MARKETS.find((m) => m.sym === selected) ?? ONDO_GAP_MARKETS[0];

  useEffect(() => {
    setTick(null);
    historyRef.current = [];
    setHistoryVersion((v) => v + 1);
    const unsubscribe = subscribeOndoGap(selected, (t) => {
      setTick(t);
      const basisPct = ((t.markPrice - t.oraclePrice) / t.oraclePrice) * 100;
      const hist = historyRef.current;
      hist.push(basisPct);
      if (hist.length > HISTORY_MAX) hist.shift();
      setHistoryVersion((v) => v + 1);
    });
    return unsubscribe;
  }, [selected]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const basis = tick ? tick.markPrice - tick.oraclePrice : null;
  const basisPct = tick ? (basis! / tick.oraclePrice) * 100 : null;
  const history = historyRef.current;
  const absHistory = history.map((v) => Math.abs(v));
  const sessionMax = absHistory.length ? Math.max(...absHistory) : null;
  const sessionMedian = absHistory.length
    ? [...absHistory].sort((a, b) => a - b)[Math.floor(absHistory.length / 2)]
    : null;

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-white/[0.03] border-white/5' : 'bg-white border-black/5';
  const subtleText = isDark ? 'text-white/50' : 'text-slate-500';

  // Sparkline geometry — simple SVG polyline over the rolling basis% history.
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
        <h2 className="text-[22px] font-bold text-foreground">Ondo Gap Monitor</h2>
        <p className={`text-[13px] mt-1 ${subtleText}`}>
          Live oracle vs. mark price for Ondo Perps&apos; equity &amp; commodity markets — both numbers straight from Ondo&apos;s own public feed.
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
            {ONDO_GAP_MARKETS.map((m) => (
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
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Oracle Price</div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>Leads — sourced straight from Chainlink</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {tick ? `$${formatMoney(tick.oraclePrice)}` : '—'}
          </div>
        </div>
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Mark Price</div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>What you&apos;d actually trade at on Ondo</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {tick ? `$${formatMoney(tick.markPrice)}` : '—'}
          </div>
        </div>
      </div>

      {/* Basis / gap */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Gap (Mark − Oracle)</div>
            <div className={`text-[24px] font-bold mt-1 tabular-nums ${
              basis == null ? 'text-foreground' : basis >= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
            }`}>
              {basis == null ? '—' : `${basis >= 0 ? '+' : ''}$${formatMoney(Math.abs(basis))}`}
              {basisPct != null && (
                <span className="text-[14px] font-normal ml-2">
                  ({basisPct >= 0 ? '+' : ''}{basisPct.toFixed(4)}%)
                </span>
              )}
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
        <div className={`flex gap-6 mt-4 text-[12px] ${subtleText}`}>
          <div>Session median |gap|: <span className="text-foreground font-bold">{sessionMedian != null ? `${sessionMedian.toFixed(4)}%` : '—'}</span></div>
          <div>Session max |gap|: <span className="text-foreground font-bold">{sessionMax != null ? `${sessionMax.toFixed(4)}%` : '—'}</span></div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className={`rounded-[12px] border p-4 text-[12px] leading-relaxed ${cardBg} ${subtleText}`}>
        This shows raw price data only — trading fees, bid-ask spread, and your own execution latency aren&apos;t reflected here.
        The gap between mark and oracle is typically small (well under 0.1% in normal conditions) and tends to close within a
        few seconds once it widens. This is not a trading signal or a guarantee of profit — it&apos;s the same two numbers
        Ondo Perps already publishes, shown side by side.
      </div>
    </div>
  );
};
