"use client";

// Bullbit Gap Monitor — live index vs. mark price for Bullbit's perpetual
// markets, side by side. Display-only: this shows you the same two numbers
// Bullbit itself publishes (their own indexPrice, aggregated from major
// CEXes + external oracles, and their own markPrice, which runs that index
// through a 300-block EMA basis — see their own Pricing Engine docs)
// — nothing predicted, nothing traded on your behalf. No wallet connection
// to Bullbit, no order placement. See relay-server/bullbitPx.js for the
// live data source.
import React, { useEffect, useRef, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { subscribeBullbitGap, BULLBIT_GAP_MARKETS, type BullbitGapTick } from '../lib/bullbitGapStream';

interface BullbitGapTabProps {
  theme?: 'light' | 'dark';
}

// Session-only rolling history for the sparkline + stats — resets on page
// reload. Not persisted; this is a live-watching tool, not a historical
// archive.
const HISTORY_MAX = 180; // ~a few minutes at roughly 1 tick/sec

// Below this, the gap is within ordinary EMA-smoothing noise — showing a
// directional hint on noise-floor movement would be actively misleading,
// so it stays neutral instead.
const HINT_THRESHOLD_PCT = 0.01;

// "Favors long/short" rather than "BUY"/"SELL" — long/short are neutral
// trading terms (which position type this tendency would benefit), not a
// command to act. Names the position directly rather than just the price
// direction, since an earlier "may drift up/down" version of this exact
// wording (on the now-removed Ondo Gap Monitor) turned out to be genuinely
// confusing — a trader still had to work out which side that favored. Still
// not a recommendation — see the disclaimer below.
function directionalHint(basisPct: number | null): { label: string; color: string } | null {
  if (basisPct == null) return null;
  if (basisPct <= -HINT_THRESHOLD_PCT) return { label: 'Mark below index — favors long', color: '#10B981' };
  if (basisPct >= HINT_THRESHOLD_PCT) return { label: 'Mark above index — favors short', color: '#EF4444' };
  return { label: 'Roughly in line', color: '#94A3B8' };
}

const formatMoney = (v: number): string => {
  if (!Number.isFinite(v)) return '—';
  if (v >= 1000) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (v >= 1) return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return v.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 8 });
};

export const BullbitGapTab: React.FC<BullbitGapTabProps> = ({ theme = 'light' }) => {
  const [selected, setSelected] = useState(BULLBIT_GAP_MARKETS[0].sym);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tick, setTick] = useState<BullbitGapTick | null>(null);
  const historyRef = useRef<number[]>([]); // rolling basis % history for the sparkline
  const [historyVersion, setHistoryVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const market = BULLBIT_GAP_MARKETS.find((m) => m.sym === selected) ?? BULLBIT_GAP_MARKETS[0];

  useEffect(() => {
    setTick(null);
    historyRef.current = [];
    setHistoryVersion((v) => v + 1);
    const unsubscribe = subscribeBullbitGap(selected, (t) => {
      setTick(t);
      const basisPct = ((t.markPrice - t.indexPrice) / t.indexPrice) * 100;
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

  const basis = tick ? tick.markPrice - tick.indexPrice : null;
  const basisPct = tick ? (basis! / tick.indexPrice) * 100 : null;
  const hint = directionalHint(basisPct);
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
        <h2 className="text-[22px] font-bold text-foreground">Bullbit Gap Monitor</h2>
        <p className={`text-[13px] mt-1 ${subtleText}`}>
          Live index vs. mark price for Bullbit&apos;s perpetual markets — both numbers straight from Bullbit&apos;s own public feed.
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
            {BULLBIT_GAP_MARKETS.map((m) => (
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
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Index Price</div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>Bullbit&apos;s aggregated oracle — major CEXes + external oracles</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {tick ? `$${formatMoney(tick.indexPrice)}` : '—'}
          </div>
        </div>
        <div className={`rounded-[16px] border p-5 ${cardBg}`}>
          <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Mark Price</div>
          <div className={`text-[11px] mt-0.5 ${subtleText}`}>What you&apos;d actually trade at on Bullbit</div>
          <div className="text-[32px] font-bold text-foreground mt-2 tabular-nums">
            {tick ? `$${formatMoney(tick.markPrice)}` : '—'}
          </div>
        </div>
      </div>

      {/* Basis / gap */}
      <div className={`rounded-[16px] border p-5 ${cardBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className={`text-[12px] font-bold uppercase tracking-wide ${subtleText}`}>Gap (Mark − Index)</div>
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
            {hint && (
              <div
                className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[11px] font-bold"
                style={{ backgroundColor: `${hint.color}1A`, color: hint.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hint.color }} />
                {hint.label}
              </div>
            )}
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
        Bullbit&apos;s mark price runs its index price through a 300-block EMA smoothing filter, so the gap is typically small
        and closes as that filter catches up. The colored hint above names which position (long or short) that reversion
        tendency favors, so the direction isn&apos;t left ambiguous — but it is
        <span className="font-bold text-foreground"> not a buy/sell recommendation</span> or a guarantee the gap will close
        before it widens further. It&apos;s the same two numbers Bullbit already publishes, shown side by side.
      </div>
    </div>
  );
};
