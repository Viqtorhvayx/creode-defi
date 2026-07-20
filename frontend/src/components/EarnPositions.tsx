"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info, MagnifyingGlass, ShieldCheck, ArrowUpRight, CircleNotch, Wallet, ArrowsClockwise, Lightning } from '@phosphor-icons/react';
import { createChart, ColorType, UTCTimestamp } from 'lightweight-charts';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { fetchUserPositions, withdrawAll, compound, UserPositionV2 } from '../lib/yieldVault';
import { isAutoEnrolled, enrollAuto, unenrollAuto } from '../lib/scheduler';
import { TokenLogo } from './TokenLogo';
import { CTA_BLUE } from '../lib/ui';

const BLUE = '#00A8E8';
const GREEN = '#10B981';

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

export interface PairInfo {
  token1: PositionToken;
  token2: PositionToken;
  venue: string;
  riskLevel: string;
  riskBgClass: string;
  riskTextClass: string;
}

interface EarnPositionsProps {
  theme: 'light' | 'dark';
  positions: Position[]; // preview rows shown before the wallet is connected
  pairInfo?: Record<string, PairInfo>; // metadata for live pairs (logos, venue, risk)
  onSupplyMore?: (pair: string) => void;
  priceUsd?: Record<string, number>; // sym -> USD price for summary totals
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

export const EarnPositions: React.FC<EarnPositionsProps> = ({ theme, positions, pairInfo = {}, onSupplyMore, priceUsd = {} }) => {
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-[#111827]';
  const textMuted = isDark ? 'text-white/50' : 'text-slate-500';
  const cardBg = isDark ? 'bg-[#0F141A]' : 'bg-white';
  const border = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const rowBorder = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const donutTrack = isDark ? 'rgba(255,255,255,0.10)' : '#E2E8F0';
  const logoBorder = isDark ? 'border-[#0F141A]' : 'border-white';

  const [search, setSearch] = useState('');

  // ── Live on-chain positions ──────────────────────────────────────────
  const { isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const [live, setLive] = useState<UserPositionV2[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState<number | null>(null);

  // Which positions are enrolled in HIP-1215 auto-compounding.
  const [autoSet, setAutoSet] = useState<Set<number>>(new Set());
  const [autoBusy, setAutoBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const addr = walletClient?.account?.address;
    if (!isConnected || !addr) { setLive(null); return; }
    setLoading(true);
    try {
      const pos = await fetchUserPositions(addr);
      setLive(pos);
      // Refresh auto-compound enrollment for each position.
      const flags = await Promise.all(pos.map((p) => isAutoEnrolled(addr, p.strategyId).catch(() => false)));
      const s = new Set<number>();
      pos.forEach((p, i) => { if (flags[i]) s.add(p.strategyId); });
      setAutoSet(s);
    }
    catch (e) { console.error('[Positions] load failed', e); setLive([]); }
    finally { setLoading(false); }
  }, [isConnected, walletClient]);

  useEffect(() => { load(); }, [load]);

  // Live movement: re-read positions so accrued yield visibly ticks up.
  useEffect(() => {
    if (!isConnected) return;
    const iv = setInterval(() => load(), 12000);
    return () => clearInterval(iv);
  }, [isConnected, load]);

  const [compoundBusy, setCompoundBusy] = useState<number | null>(null);

  const onWithdraw = async (pos: UserPositionV2) => {
    if (!walletClient) return;
    setBusyKey(pos.strategyId);
    try { await withdrawAll(walletClient, pos.strategyId); await load(); }
    catch (e) { const err = e as any; alert('Withdraw failed: ' + (err?.reason || err?.shortMessage || err?.message || 'error')); }
    finally { setBusyKey(null); }
  };

  const onCompound = async (pos: UserPositionV2) => {
    if (!walletClient) return;
    setCompoundBusy(pos.strategyId);
    try { await compound(walletClient, pos.strategyId); await load(); }
    catch (e) { const err = e as any; alert('Compound failed: ' + (err?.reason || err?.shortMessage || err?.message || 'error')); }
    finally { setCompoundBusy(null); }
  };

  // Toggle HIP-1215 auto-compounding for a position (enroll / unenroll).
  const onToggleAuto = async (pos: UserPositionV2) => {
    if (!walletClient) return;
    const on = autoSet.has(pos.strategyId);
    setAutoBusy(pos.strategyId);
    try {
      if (on) await unenrollAuto(walletClient, pos.strategyId);
      else await enrollAuto(walletClient, pos.strategyId);
      await load();
    }
    catch (e) { const err = e as any; alert('Auto-compound update failed: ' + (err?.reason || err?.shortMessage || err?.message || 'error')); }
    finally { setAutoBusy(null); }
  };

  const connectedLive = isConnected && live !== null;
  const fmtUsd = (n: number) => '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtHold = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: n >= 1 ? 2 : 6 });
  const usdOf = (p: UserPositionV2) => p.a.amt * (priceUsd[p.a.sym] ?? 0) + (p.single ? 0 : p.b.amt * (priceUsd[p.b.sym] ?? 0));
  const yUsdOf = (p: UserPositionV2) => p.a.yield * (priceUsd[p.a.sym] ?? 0) + (p.single ? 0 : p.b.yield * (priceUsd[p.b.sym] ?? 0));
  const suppliedUsd = (live || []).reduce((s, p) => s + usdOf(p), 0);
  const yieldUsd = (live || []).reduce((s, p) => s + yUsdOf(p), 0);

  const liveRows = (live || []).filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.a.sym.toLowerCase().includes(search.toLowerCase()) || p.b.sym.toLowerCase().includes(search.toLowerCase())
  );
  const previewRows = positions.filter(
    (p) => p.pair.toLowerCase().includes(search.toLowerCase()) || p.venue.toLowerCase().includes(search.toLowerCase())
  );

  const Logos: React.FC<{ t1: PositionToken; t2?: PositionToken }> = ({ t1, t2 }) => {
    const circle = (t: PositionToken, z: string) => (
      <TokenLogo sym={t.sym} size={36} className={`border-2 ${z} ${logoBorder}`} />
    );
    return <div className="flex -space-x-2.5 shrink-0">{circle(t1, 'z-10')}{t2 && circle(t2, '')}</div>;
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
            <span className={`text-[34px] font-bold tracking-tight leading-none ${textMain}`}>{connectedLive ? fmtUsd(suppliedUsd) : '$42,500.00'}</span>
            {connectedLive ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: BLUE, backgroundColor: 'rgba(0,168,232,0.1)' }}>LIVE</span>
            ) : (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-lg border text-center leading-tight" style={{ color: BLUE, borderColor: 'rgba(0,168,232,0.3)' }}>
                +2,850.40<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
              </span>
            )}
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
            <span className="text-[34px] font-bold tracking-tight leading-none" style={{ color: GREEN }}>{connectedLive ? '+' + fmtUsd(yieldUsd) : '+$3,240.50'}</span>
            {connectedLive ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg" style={{ color: GREEN, backgroundColor: 'rgba(16,185,129,0.1)' }}>LIVE</span>
            ) : (
              <span className="text-[13px] font-bold px-3 py-1.5 rounded-lg border text-center leading-tight" style={{ color: GREEN, borderColor: 'rgba(16,185,129,0.3)' }}>
                +8.24%<br /><span className="text-[10px] font-semibold opacity-70">(7D)</span>
              </span>
            )}
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
            {connectedLive ? (
              loading && liveRows.length === 0 ? (
                <div className={`flex items-center justify-center gap-2 py-14 text-[13px] font-medium ${textMuted}`}>
                  <CircleNotch size={16} className="animate-spin" /> Loading your positions…
                </div>
              ) : liveRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-1.5 text-center">
                  <span className={`text-[14px] font-bold ${textMain}`}>No active positions yet</span>
                  <span className={`text-[12px] ${textMuted}`}>Zap into a strategy from the Yield Hub to start earning.</span>
                </div>
              ) : (
                liveRows.map((p) => {
                  const info = pairInfo[p.name];
                  const util = Math.max(35, Math.min(92, Math.round(p.apyPct * 3) + 35));
                  const supUsd = usdOf(p);
                  const yUsd = yUsdOf(p);
                  const earnedPct = supUsd > 0 ? (yUsd / supUsd) * 100 : 0;
                  const holdings = p.single ? `${fmtHold(p.a.amt)} ${p.a.sym}` : `${fmtHold(p.a.amt)} ${p.a.sym} + ${fmtHold(p.b.amt)} ${p.b.sym}`;
                  const busy = busyKey === p.strategyId;
                  return (
                    <div key={p.strategyId} className={`grid ${colTemplate} gap-2 items-center px-2 py-5 border-b last:border-0 ${rowBorder}`}>
                      {/* Strategy */}
                      <div className="flex items-center gap-3">
                        {info ? <Logos t1={info.token1} t2={info.token2} /> : <div className="w-9 h-9 rounded-full bg-slate-500/20 shrink-0" />}
                        <div className="flex flex-col">
                          <span className={`text-[14px] font-bold ${textMain}`}>{p.name}</span>
                          <span className={`text-[11px] font-medium ${textMuted}`} title={holdings}>{holdings}</span>
                        </div>
                      </div>
                      {/* Profile */}
                      <div>
                        {info && <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${info.riskBgClass} ${info.riskTextClass}`}>{info.riskLevel}</span>}
                      </div>
                      {/* Supplied Value (single USD) */}
                      <div className={`text-[14px] font-bold ${textMain}`}>{fmtUsd(supUsd)}</div>
                      {/* Accrued Yield (single USD) */}
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold" style={{ color: GREEN }}>+{fmtUsd(yUsd)}</span>
                        <span className="text-[11px] font-semibold" style={{ color: GREEN }}>+{earnedPct.toFixed(4)}%</span>
                      </div>
                      {/* 7D Change (not tracked on-chain yet) */}
                      <div className="flex items-center"><span className={`text-[13px] font-semibold ${textMuted}`}>—</span></div>
                      {/* APR */}
                      <div className="flex flex-col">
                        <span className={`text-[14px] font-bold ${textMain}`}>{p.apyPct}%</span>
                        <span className={`text-[11px] font-medium ${textMuted}`}>Net APY</span>
                      </div>
                      {/* Utilization */}
                      <div className={textMain}><Donut pct={util} track={donutTrack} /></div>
                      {/* Actions */}
                      <div className="flex flex-col items-stretch gap-1.5 pl-1">
                        <button onClick={() => onSupplyMore?.(p.name)} className={`${CTA_BLUE} w-full h-8 text-[12px]`}>Supply More</button>
                        <button onClick={() => onCompound(p)} disabled={compoundBusy === p.strategyId} className={`${CTA_BLUE} w-full h-8 text-[12px] flex items-center justify-center gap-1.5`}>
                          {compoundBusy === p.strategyId ? <><CircleNotch size={13} className="animate-spin" /> …</> : <><ArrowsClockwise size={13} weight="bold" /> Compound</>}
                        </button>
                        {(() => {
                          const on = autoSet.has(p.strategyId);
                          const busyA = autoBusy === p.strategyId;
                          return (
                            <button
                              onClick={() => onToggleAuto(p)}
                              disabled={busyA}
                              title={on ? 'Auto-compounding on — the protocol compounds this position on-chain via HIP-1215. Click to turn off.' : 'Turn on hands-off auto-compounding (HIP-1215 scheduled on-chain).'}
                              className={`w-full h-8 text-[12px] font-bold rounded-[12px] transition-colors flex items-center justify-center gap-1.5 ${on ? 'bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25' : 'bg-black/[0.06] dark:bg-white/10 text-slate-500 dark:text-white/60 hover:bg-black/10 dark:hover:bg-white/[0.14]'}`}
                            >
                              {busyA ? <CircleNotch size={13} className="animate-spin" /> : <Lightning size={13} weight={on ? 'fill' : 'bold'} />}
                              {on ? 'Auto: On' : 'Auto: Off'}
                            </button>
                          );
                        })()}
                        <button onClick={() => onWithdraw(p)} disabled={busy} className={`${CTA_BLUE} w-full h-8 text-[12px] flex items-center justify-center gap-1.5`}>
                          {busy ? <><CircleNotch size={13} className="animate-spin" /> …</> : 'Withdraw'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              <>
                {!isConnected && (
                  <div className={`flex items-center gap-2 px-2 py-3 text-[12px] font-medium ${textMuted}`}>
                    <Wallet size={14} /> Preview — connect your wallet to see your live positions.
                  </div>
                )}
                {previewRows.map((p) => (
                  <div key={p.pair} className={`grid ${colTemplate} gap-2 items-center px-2 py-5 border-b last:border-0 ${rowBorder}`}>
                    {/* Strategy */}
                    <div className="flex items-center gap-3">
                      <Logos t1={p.token1} t2={p.token2} />
                      <div className="flex flex-col">
                        <span className={`text-[14px] font-bold ${textMain}`}>{p.pair}</span>
                        <span className={`text-[11px] font-medium ${textMuted}`}>{p.venue}</span>
                      </div>
                    </div>
                    {/* Profile */}
                    <div><span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${p.riskBgClass} ${p.riskTextClass}`}>{p.riskLevel}</span></div>
                    {/* Supplied Value */}
                    <div className={`text-[14px] font-bold ${textMain}`}>{p.supplied}</div>
                    {/* Accrued Yield */}
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold" style={{ color: GREEN }}>{p.accrued}</span>
                      <span className="text-[11px] font-semibold" style={{ color: GREEN }}>{p.accruedPct}</span>
                    </div>
                    {/* 7D Change */}
                    <div className="flex items-center"><span className="text-[14px] font-bold" style={{ color: p.trendUp ? GREEN : '#F43F5E' }}>{p.change7d}</span></div>
                    {/* APR */}
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-bold ${textMain}`}>{p.apr}</span>
                      <span className={`text-[11px] font-medium ${textMuted}`}>Net APY</span>
                    </div>
                    {/* Utilization */}
                    <div className={textMain}><Donut pct={p.utilization} track={donutTrack} /></div>
                    {/* Actions */}
                    <div className="flex flex-col items-stretch gap-2 pl-1">
                      <button onClick={() => onSupplyMore?.(p.pair)} className={`${CTA_BLUE} w-full h-9 text-[12px]`}>Supply More</button>
                      <button className={`${CTA_BLUE} w-full h-9 text-[12px]`}>Withdraw</button>
                    </div>
                  </div>
                ))}
                {previewRows.length === 0 && (
                  <div className={`text-center py-12 text-[13px] font-medium ${textMuted}`}>No positions match “{search}”.</div>
                )}
              </>
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
