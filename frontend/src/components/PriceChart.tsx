// Implementation and CoinGecko API integration for UI update by Viqtorhvayx
"use client";


import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CaretDown } from '@phosphor-icons/react';
import { TokenLogo } from './TokenLogo';
import { subscribePythPrice } from '../lib/pythStream';
import { VAULT_WATCH_TOKENS } from '../lib/market';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";

// Bucket width (seconds) matching each history resolution, so live streamed
// ticks fold into the same bar width as the loaded history instead of adding
// a jagged point per tick.
const BUCKET_SECS: Record<string, number> = { '1': 60, '60': 3600, 'D': 86400, 'W': 604800 };

export const PriceChart: React.FC<PriceChartProps> = ({ theme = 'light' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  const [activeSym, setActiveSym] = useState('HBAR');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const token = VAULT_WATCH_TOKENS.find((t) => t.sym === activeSym) || VAULT_WATCH_TOKENS[0];

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [marketCap, setMarketCap] = useState<string | null>(null);
  const [circSupply, setCircSupply] = useState<string | null>(null);
  const [marketCapRank, setMarketCapRank] = useState<number | null>(null);

  // Close the symbol picker on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatCompact = (val: number | undefined) => {
    if (val === undefined || val === null) return "...";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };
  const formatSupply = (val: number | undefined, sym: string) => {
    if (!val) return undefined;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B ${sym}`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M ${sym}`;
    return `${val.toLocaleString()} ${sym}`;
  };

  // Real-time price: a direct Pyth Hermes SSE stream (sub-second push), not a
  // polling loop — switches feed the instant a different token is selected.
  useEffect(() => {
    setLivePrice(null);
    const unsubscribe = subscribePythPrice(token.pythFeedId, ({ price }) => setLivePrice(price));
    return unsubscribe;
  }, [token.pythFeedId]);

  // Market cap / 24h change / volume / rank / supply — CoinGecko, best-effort
  // (same tolerance as the rest of the app: a failed call just leaves the
  // placeholder dashes rather than breaking anything).
  useEffect(() => {
    setPriceChange24h(null); setVolume24h(null); setMarketCap(null); setCircSupply(null); setMarketCapRank(null);
    let cancelled = false;
    const fetchMarketMetrics = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${token.coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const md = data?.market_data;
        if (!md) return;
        setPriceChange24h(md.price_change_percentage_24h ?? null);
        setVolume24h(formatCompact(md.total_volume?.usd));
        setMarketCap(formatCompact(md.market_cap?.usd));
        setCircSupply(formatSupply(md.circulating_supply, token.sym) ?? null);
        setMarketCapRank(data.market_cap_rank ?? null);
      } catch { /* best-effort */ }
    };
    fetchMarketMetrics();
    const interval = setInterval(fetchMarketMetrics, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token.coingeckoId, token.sym]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.5)';
    const lineColor = '#00A8E8';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)' },
      },
      autoSize: true,
      width: chartContainerRef.current.clientWidth || 400,
      height: 280,
      localization: {
        priceFormatter: (price: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: 4, maximumFractionDigits: 6,
          }).format(price);
        },
      },
      timeScale: { borderVisible: false, timeVisible: true },
      rightPriceScale: {
        borderVisible: false, autoScale: true,
        scaleMargins: { top: 0.25, bottom: 0.25 },
      },
      handleScroll: false, handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor,
      topColor: isDark ? `${lineColor}33` : `${lineColor}22`,
      bottomColor: `${lineColor}00`,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });
    chartRef.current = chart;
    seriesRef.current = areaSeries;

    let alive = true;
    let points: { time: UTCTimestamp; value: number }[] = [];
    let unsubTick: (() => void) | null = null;

    let resolution = 'D';
    let secondsBack = 30 * 24 * 60 * 60;
    if (activeInterval === '1H') { resolution = '1'; secondsBack = 60 * 60; }
    else if (activeInterval === '1D') { resolution = '60'; secondsBack = 7 * 24 * 60 * 60; }
    else if (activeInterval === '1W') { resolution = 'D'; secondsBack = 30 * 24 * 60 * 60; }
    else if (activeInterval === '1M') { resolution = 'D'; secondsBack = 90 * 24 * 60 * 60; }
    else if (activeInterval === 'ALL') { resolution = 'W'; secondsBack = 365 * 24 * 60 * 60; }
    const bucketSecs = BUCKET_SECS[resolution] ?? 3600;

    const loadHistory = async () => {
      const to = Math.floor(Date.now() / 1000);
      const from = to - secondsBack;
      try {
        const response = await fetch(`${PYTH_BENCHMARKS_URL}?symbol=Crypto.${token.sym}/USD&resolution=${resolution}&from=${from}&to=${to}`);
        const data = await response.json();
        if (!alive) return;
        if (data.s === "ok") {
          points = data.t.map((t: number, i: number) => ({ time: t as UTCTimestamp, value: data.c[i] }));
          areaSeries.setData(points);
          chart.timeScale().fitContent();
        }
      } catch (err) { console.error("History Error:", err); }
    };

    loadHistory().then(() => {
      if (!alive) return;
      // Live streaming: fold each Pyth tick into the current bucket so the
      // chart's last point moves in real time instead of waiting on the next
      // full history re-fetch.
      unsubTick = subscribePythPrice(token.pythFeedId, ({ price, time }) => {
        if (!alive || !seriesRef.current) return;
        const bucket = (Math.floor(time / bucketSecs) * bucketSecs) as UTCTimestamp;
        const last = points[points.length - 1];
        if (last && last.time === bucket) {
          last.value = price;
        } else {
          points = [...points, { time: bucket, value: price }];
        }
        seriesRef.current.update(points[points.length - 1]);
      });
    });

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      alive = false;
      unsubTick?.();
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [theme, activeInterval, token.sym, token.pythFeedId]);

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => {
    if (theme === 'dark') {
      return (
        <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-full py-1.5 px-3.5 tracking-wide ${active ? 'bg-transparent text-[#00A8E8] border border-transparent shadow-[inset_0_0_20px_rgba(0,168,232,0.35)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}>
          {label}
        </button>
      );
    }
    // Light Mode Button
    return (
      <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-full py-1.5 px-3.5 tracking-wide ${active ? 'bg-transparent text-[#00A8E8] border border-transparent shadow-[inset_0_0_20px_rgba(0,168,232,0.35)]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}`}>
        {label}
      </button>
    );
  };

  const priceStr = livePrice != null
    ? (livePrice >= 1 ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : livePrice.toPrecision(4))
    : null;

  return (
    <div className="w-full mx-auto flex flex-col h-full relative overflow-visible">

      {/* Header section exactly as reference */}
      <div className="flex justify-between items-start w-full mb-8">
        <div className="relative" ref={pickerRef}>
          <button onClick={() => setPickerOpen((o) => !o)} className="flex items-center gap-4 group">
            <TokenLogo sym={token.sym} size={48} className="border border-slate-200 dark:border-white/5" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] font-bold tracking-tight mb-0.5 text-slate-900 dark:text-white">{token.name} Market</h3>
                <CaretDown size={12} weight="bold" className={`text-slate-400 dark:text-white/40 transition-transform mt-[-2px] ${pickerOpen ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[12px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">{token.sym} / USD</span>
            </div>
          </button>

          {pickerOpen && (
            <div className={`absolute top-full left-0 mt-2 w-[220px] max-h-[320px] overflow-y-auto rounded-xl border shadow-lg z-50 ${theme === 'dark' ? 'bg-[#0F141A] border-white/10' : 'bg-white border-[#EAECEF]'}`}>
              {VAULT_WATCH_TOKENS.map((t) => (
                <button
                  key={t.sym}
                  onClick={() => { setActiveSym(t.sym); setPickerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${t.sym === activeSym ? 'bg-[#00A8E8]/10' : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                >
                  <TokenLogo sym={t.sym} size={22} />
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${t.sym === activeSym ? 'text-[#00A8E8]' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.sym}</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-white/40">{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-full shadow-sm dark:shadow-none">
          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(interval => (
            <FilterButton key={interval} label={interval} active={activeInterval === interval} onClick={() => setActiveInterval(interval)} />
          ))}
        </div>
      </div>

      {/* Massive Price section */}
      <div className="flex flex-col mb-2">
        <span className="text-[44px] leading-none font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
          {priceStr ? `$${priceStr}` : "..."}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-bold flex items-center gap-1 ${priceChange24h && priceChange24h >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
            {priceChange24h && priceChange24h >= 0 ? '▲' : '▼'} {priceChange24h ? Math.abs(priceChange24h).toFixed(2) : "..."}%
            <span className="text-[12px] ml-1 text-slate-500 dark:text-white/60 font-medium">(24h)</span>
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[240px] mt-2 mb-6"><div ref={chartContainerRef} className="absolute inset-0" /></div>

      {/* Bottom Stats Footer */}
      <div className="bg-slate-50 dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between mt-auto dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col text-left flex-1 pl-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Market Cap</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{marketCap || "—"}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">{token.sym === 'HBAR' ? 'Vault TVL' : '24h Volume'}</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{token.sym === 'HBAR' ? '24.58M HBAR' : (volume24h || '—')}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Circulating Supply</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{circSupply || "—"}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Rank</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{marketCapRank || "—"}</span>
        </div>
      </div>
    </div>
  );
};
