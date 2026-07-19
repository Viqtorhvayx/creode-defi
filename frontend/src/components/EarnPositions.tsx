"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Info, MagnifyingGlass, ShieldCheck, ArrowUpRight } from '@phosphor-icons/react';
import { createChart, ColorType, UTCTimestamp } from 'lightweight-charts';

const BLUE = '#00A8E8';
const GREEN = '#00C076';

interface PositionToken {
  sym: string;
  logo: string | null;
  fallback: string;
  bg: string;
}

export interface Position {
  token1: PositionToken;
  token2: PositionToken;
  pair: string;
  venue: string;
  riskLevel: string;
  riskBgClass: string;
  riskTextClass: string;
  supplied: string;
  accrued: string;
  accruedPct: string;
  change7d: string;
  apr: string;
  utilization: number;
  trendUp: boolean;
}

interface EarnPositionsProps {
  theme: 'light' | 'dark';
  positions: Position[];
}

// Deterministic PRNG so the synthetic series stays stable across renders.
const mulberry32 = (a: number) => () => {
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Smooth area chart using the same lightweight-charts engine as the Vault's
// HBAR Market chart, so the summary charts read as professional, not jagged.
const MiniAreaChart: React.FC<{ color: string; seed: number }> = ({ color, seed }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'transparent', attributionLogo: false },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false, borderVisible: false },
      crosshair: { horzLine: { visible: false, labelVisible: false }, vertLine: { visible: false, labelVisible: false } },
      handleScroll: false,
      handleScale: false,
      width: el.clientWidth || 400,
      height: 104,
    });
    const series = chart.addAreaSeries({
      lineColor: color,
      topColor: `${color}30`,
      bottomColor: `${color}00`,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    const rnd = mulberry32(seed);
    const data: { time: UTCTimestamp; value: number }[] = [];
    let v = 100;
    const start = Math.floor(Date.now() / 1000) - 90 * 86400;
    for (let i = 0; i < 90; i++) {
      v += (rnd() - 0.4) * 2.4; // gentle upward drift + noise
      data.push({ time: (start + i * 86400) as UTCTimestamp, value: v });
    }
    series.setData(data);
    chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
    ro.observe(el);
    return () => { ro.disconnect(); chart.remove(); };
  }, [color, seed]);
  return <div ref={ref} className="w-full" style={{ height: 104 }} />;
};

// Utilization donut.
const Donut: React.FC<{ pct: number; track: string }> = ({ pct, track }) => {
  const size = 48, sw = 5.5, r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BLUE} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{pct}%</span>
    </div>
  );
};

export const EarnPositions: React.FC<EarnPositionsProps> = ({ theme, positions }) => {
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-[#111827]';
  const textMuted = isDark ? 'text-white/50' : 'text-slate-500';
  const cardBg = isDark ? 'bg-[#0F141A]' : 'bg-white';
  const border = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const rowBorder = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const donutTrack = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
  const logoBorder = isDark ? 'border-[#0F141A]' : 'border-white';

  const [search, setSearch] = useState('');
  const filtered = positions.filter(
    (p) => p.pair.toLowerCase().includes(search.toLowerCase()) || p.venue.toLowerCase().includes(search.toLowerCase())
  );

  const Logos: React.FC<{ p: Position }> = ({ p }) => {
    const circle = (t: PositionToken, z: string) =>
      t.logo ? (
        <img src={t.logo} alt={t.sym} className={`w-9 h-9 rounded-full border-2 ${z} ${logoBorder}`} />
      ) : (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] border-2 ${z} ${logoBorder} ${t.bg}`}>{t.fallback}</div>
      );
    return <div className="flex -space-x-2.5 shrink-0">{circle(p.token1, 'z-10')}{circle(p.token2, '')}</div>;
  };

  const colTemplate = 'grid-cols-[1.7fr_0.95fr_1.05fr_1fr_0.95fr_0.8fr_0.7fr_1.2fr]';

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-500 pb-4">

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Supplied Capital */}
        <div className={`${cardBg} border ${border} rounded-[16px] p-6 flex flex-col shadow-sm`}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className={`text-[13px] font-semibold ${textMuted}`}>Total Supplied Capital</span>
            <Info size={13} className={textMuted} />
          </div>
          <div className="flex items-start justify-between">
            <span className={`text-[34px] font-bold tracking-tight leading-none ${textMain}`}>$42,500.00</span>
            <span className="text-[13px] font-bold px-3 py-1.5 rounded-lg border text-center leading-tight" style={{ color: BLUE, borderColor: 'rgba(0,168,232,0.3)' }}>
              +2,850.40<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
            </span>
          </div>
          <div className="mt-2 -mx-1"><MiniAreaChart color={BLUE} seed={7} /></div>
        </div>

        {/* Total Accrued Yield */}
        <div className={`${cardBg} border ${border} rounded-[16px] p-6 flex flex-col shadow-sm`}>
          <div className="flex items-center gap-1.5 mb-3">
            <span className={`text-[13px] font-semibold ${textMuted}`}>Total Accrued Yield</span>
            <Info size={13} className={textMuted} />
          </div>
          <div className="flex items-start justify-between">
            <span className="text-[34px] font-bold tracking-tight leading-none" style={{ color: GREEN }}>+$3,240.50</span>
            <span className="text-[13px] font-bold px-3 py-1.5 rounded-lg border text-center leading-tight" style={{ color: GREEN, borderColor: 'rgba(0,192,118,0.3)' }}>
              +8.24%<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
            </span>
          </div>
          <div className="mt-2 -mx-1"><MiniAreaChart color={GREEN} seed={21} /></div>
        </div>
      </div>

      {/* Active Positions */}
      <div className={`${cardBg} border ${border} rounded-[16px] p-6 mb-6 shadow-sm`}>
        <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
          <h2 className={`text-[18px] font-bold tracking-tight ${textMain}`}>Active Positions</h2>
          <div className={`flex items-center gap-2 px-3.5 h-10 rounded-[10px] border ${border} ${isDark ? 'bg-white/[0.02]' : 'bg-slate-50'} w-full sm:w-[280px]`}>
            <MagnifyingGlass size={16} className={textMuted} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search strategy..."
              className={`bg-transparent border-none outline-none text-[13px] w-full ${textMain} placeholder:${isDark ? 'text-white/30' : 'text-slate-400'}`}
            />
          </div>
        </div>

        <div>
          <div>
            {/* Header */}
            <div className={`grid ${colTemplate} gap-2 items-center px-2 pb-3 border-b ${rowBorder} text-[12px] font-semibold ${textMuted}`}>
              <div>Strategy</div>
              <div>Profile</div>
              <div>Supplied Value</div>
              <div className="flex items-center gap-1">Accrued Yield <Info size={12} /></div>
              <div className="flex items-center gap-1">7D Change <Info size={12} /></div>
              <div className="flex items-center gap-1">APR <Info size={12} /></div>
              <div className="flex items-center gap-1">Utilization <Info size={12} /></div>
              <div className="text-right">Actions</div>
            </div>

            {/* Rows */}
            {filtered.map((p) => (
              <div key={p.pair} className={`grid ${colTemplate} gap-2 items-center px-2 py-5 border-b last:border-0 ${rowBorder}`}>
                {/* Strategy */}
                <div className="flex items-center gap-3">
                  <Logos p={p} />
                  <div className="flex flex-col">
                    <span className={`text-[14px] font-bold ${textMain}`}>{p.pair}</span>
                    <span className={`text-[11px] font-medium ${textMuted}`}>{p.venue}</span>
                  </div>
                </div>

                {/* Profile */}
                <div>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${p.riskBgClass} ${p.riskTextClass}`}>{p.riskLevel}</span>
                </div>

                {/* Supplied Value (total only) */}
                <div className={`text-[14px] font-bold ${textMain}`}>{p.supplied}</div>

                {/* Accrued Yield */}
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold" style={{ color: GREEN }}>{p.accrued}</span>
                  <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{p.accruedPct}</span>
                </div>

                {/* 7D Change */}
                <div className="flex items-center">
                  <span className="text-[14px] font-bold" style={{ color: p.trendUp ? GREEN : '#F43F5E' }}>{p.change7d}</span>
                </div>

                {/* APR */}
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${textMain}`}>{p.apr}</span>
                  <span className={`text-[11px] font-medium ${textMuted}`}>Net APY</span>
                </div>

                {/* Utilization */}
                <div className={textMain}><Donut pct={p.utilization} track={donutTrack} /></div>

                {/* Actions */}
                <div className="flex flex-col items-stretch gap-2 pl-1">
                  <button className="w-full h-9 rounded-[8px] text-[12px] font-bold text-white transition-colors" style={{ backgroundColor: BLUE }}>Supply More</button>
                  <button className={`w-full h-9 rounded-[8px] text-[12px] font-bold border transition-colors ${border} ${textMain} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>Withdraw</button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className={`text-center py-12 text-[13px] font-medium ${textMuted}`}>No positions match “{search}”.</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-center gap-4 px-6 py-5 rounded-[16px] border ${border} ${cardBg}`}>
        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0`} style={{ backgroundColor: 'rgba(0,168,232,0.1)', color: BLUE }}>
          <ShieldCheck size={20} weight="fill" />
        </div>
        <p className={`text-[13px] font-medium ${textMuted}`}>
          Your funds are securely deployed in audited strategies.<br className="hidden sm:block" />
          Past performance does not guarantee future results. <a href="#" className="inline-flex items-center gap-0.5 hover:underline font-semibold" style={{ color: BLUE }}>Learn more <ArrowUpRight size={12} weight="bold" /></a>
        </p>
      </div>
    </div>
  );
};
