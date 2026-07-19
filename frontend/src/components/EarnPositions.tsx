"use client";

import React, { useState } from 'react';
import { Info, MagnifyingGlass, ShieldCheck, ArrowUpRight } from '@phosphor-icons/react';

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

// Smooth area chart for the two summary cards.
const AreaChart: React.FC<{ color: string; data: number[] }> = ({ color, data }) => {
  const w = 520, h = 96, pad = 6;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`;
  const id = `grad-${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[96px]">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

// Tiny sparkline for the 7D Change column.
const Sparkline: React.FC<{ color: string; data: number[] }> = ({ color, data }) => {
  const w = 92, h = 34, pad = 3;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const line = data
    .map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (d - min) / range) * (h - pad * 2);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Utilization donut.
const Donut: React.FC<{ pct: number; track: string }> = ({ pct, track }) => {
  const size = 44, sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
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

const suppliedTrend = [42, 40, 44, 43, 47, 45, 49, 46, 44, 47, 45, 48, 46, 50, 48];
const yieldTrend = [30, 32, 31, 34, 33, 35, 34, 37, 36, 38, 37, 39, 41, 40, 43];
const upSpark = [2, 3, 2.4, 3.6, 3.1, 4.2, 3.8, 5.0, 4.6, 5.4];

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

  const colTemplate = 'grid-cols-[minmax(190px,1.7fr)_110px_130px_130px_120px_110px_84px_150px]';

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-500 pb-4">

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Total Supplied Capital */}
        <div className={`${cardBg} border ${border} rounded-[16px] p-6 flex flex-col shadow-sm`}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[13px] font-semibold ${textMuted}`}>Total Supplied Capital</span>
              <Info size={13} className={textMuted} />
            </div>
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-lg border text-center leading-none" style={{ color: BLUE, borderColor: 'rgba(0,168,232,0.3)' }}>
              +2,850.40<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
            </span>
          </div>
          <span className={`text-[34px] font-bold tracking-tight ${textMain}`}>$42,500.00</span>
          <div className="mt-3 -mx-1"><AreaChart color={BLUE} data={suppliedTrend} /></div>
        </div>

        {/* Total Accrued Yield */}
        <div className={`${cardBg} border ${border} rounded-[16px] p-6 flex flex-col shadow-sm`}>
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[13px] font-semibold ${textMuted}`}>Total Accrued Yield</span>
              <Info size={13} className={textMuted} />
            </div>
            <span className="text-[12px] font-bold px-3 py-1.5 rounded-lg border text-center leading-none" style={{ color: GREEN, borderColor: 'rgba(0,192,118,0.3)' }}>
              +8.24%<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
            </span>
          </div>
          <span className="text-[34px] font-bold tracking-tight" style={{ color: GREEN }}>+$3,240.50</span>
          <div className="mt-3 -mx-1"><AreaChart color={GREEN} data={yieldTrend} /></div>
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

        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header */}
            <div className={`grid ${colTemplate} gap-3 items-center px-2 pb-3 border-b ${rowBorder} text-[12px] font-semibold ${textMuted}`}>
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
              <div key={p.pair} className={`grid ${colTemplate} gap-3 items-center px-2 py-5 border-b last:border-0 ${rowBorder}`}>
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
                <div className="flex flex-col items-start gap-1">
                  <Sparkline color={p.trendUp ? GREEN : '#F43F5E'} data={upSpark} />
                  <span className="text-[11px] font-semibold" style={{ color: p.trendUp ? GREEN : '#F43F5E' }}>{p.change7d}</span>
                </div>

                {/* APR */}
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${textMain}`}>{p.apr}</span>
                  <span className={`text-[11px] font-medium ${textMuted}`}>Net APY</span>
                </div>

                {/* Utilization */}
                <div className={textMain}><Donut pct={p.utilization} track={donutTrack} /></div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  <button className="w-[130px] h-9 rounded-[8px] text-[12px] font-bold text-white transition-colors" style={{ backgroundColor: BLUE }}>Supply More</button>
                  <button className={`w-[130px] h-9 rounded-[8px] text-[12px] font-bold border transition-colors ${border} ${textMain} ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>Withdraw</button>
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
