"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PAIRS, getPair, formatVolume, type MarketPair, type PairStat } from '../lib/market';
import { TokenLogo } from './TokenLogo';

// Overlapping token-pair logos, like the LambdaPlex market list.
const PairIcons: React.FC<{ pair: MarketPair; size?: number }> = ({ pair, size = 26 }) => (
  <div className="flex items-center shrink-0" style={{ width: size * 1.6 }}>
    <div className="rounded-full z-10 ring-2" style={{ ['--tw-ring-color' as any]: 'var(--sel-ring)' }}>
      <TokenLogo sym={pair.base} size={size} />
    </div>
    <div className="rounded-full -ml-2 ring-2" style={{ ['--tw-ring-color' as any]: 'var(--sel-ring)' }}>
      <TokenLogo sym={pair.quote} size={size} />
    </div>
  </div>
);

interface Props {
  pairId: string;
  onSelect: (id: string) => void;
  stats: Record<string, PairStat>;
  theme: 'light' | 'dark';
}

export const MarketSelector: React.FC<Props> = ({ pairId, onSelect, stats, theme }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const pair = getPair(pairId);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const dark = theme === 'dark';
  const border = dark ? 'border-white/10' : 'border-slate-200';
  const textMain = dark ? 'text-white' : 'text-slate-900';
  const textMuted = dark ? 'text-white/50' : 'text-slate-500';
  const ring = dark ? '#0F141A' : '#ffffff';

  const filtered = PAIRS.filter((p) => p.id.toLowerCase().includes(query.toLowerCase().trim()));

  return (
    <div className="relative" ref={rootRef} style={{ ['--sel-ring' as any]: ring }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 group cursor-pointer"
      >
        <PairIcons pair={pair} size={30} />
        <span className={`text-xl font-bold tracking-tight ${textMain} group-hover:text-[#00A8E8] transition-colors`}>{pair.id}</span>
        <ChevronDown className={`w-4 h-4 ${textMuted} group-hover:text-[#00A8E8] transition-colors ${open ? 'rotate-180' : ''} transition-transform`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-[340px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl rounded-xl overflow-hidden">
          <div className={`p-3 border-b ${border}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border ${border} ${dark ? 'bg-black/20' : 'bg-slate-50'}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={textMuted}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search markets…"
                className={`bg-transparent outline-none border-none text-[14px] w-full ${textMain} placeholder:${textMuted}`}
              />
            </div>
          </div>
          <div className={`px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide ${textMuted}`}>Market</div>
          <div className="max-h-[320px] overflow-y-auto pb-2">
            {filtered.length === 0 && (
              <div className={`px-4 py-6 text-center text-[13px] ${textMuted}`}>No markets found</div>
            )}
            {filtered.map((p) => {
              const vol = stats[p.id]?.volume24h ?? 0;
              const chg = stats[p.id]?.change24h ?? 0;
              const active = p.id === pairId;
              return (
                <button
                  key={p.id}
                  onClick={() => { onSelect(p.id); setOpen(false); setQuery(''); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${active ? (dark ? 'bg-white/5' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <PairIcons pair={p} size={28} />
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className={`text-[15px] font-bold tracking-tight ${textMain}`}>{p.id}</span>
                    <span className={`text-[12px] font-semibold ${textMuted}`}>{formatVolume(vol)}</span>
                  </div>
                  <span className={`text-[12px] font-bold tabular-nums ${chg >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
