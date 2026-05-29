"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

export const PriceChart: React.FC<PriceChartProps> = ({ theme = 'light' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  
  const [hbarPrice, setHbarPrice] = useState<string | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [marketCap, setMarketCap] = useState<string | null>(null);

  const PYTH_HBAR_FEED_ID = "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
  const PYTH_HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";
  const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";
  const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";

  const formatCompact = (val: number | undefined) => {
    if (val === undefined || val === null) return "...";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };

  useEffect(() => {
    const fetchPythPrice = async () => {
      try {
        const response = await fetch(`${PYTH_HERMES_URL}?ids[]=${PYTH_HBAR_FEED_ID}`);
        if (response.ok) {
          const data = await response.json();
          if (data.parsed && data.parsed[0]) {
            const priceObj = data.parsed[0].price;
            const price = Number(priceObj.price) * Math.pow(10, priceObj.expo);
            setHbarPrice(price.toFixed(6));
          }
        }
      } catch (err) { console.error("Pyth Error:", err); }
    };
    fetchPythPrice();
    const interval = setInterval(fetchPythPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchMarketMetrics = async () => {
      try {
        const response = await fetch(COINGECKO_URL);
        if (response.ok) {
          const data = await response.json();
          if (data['hedera-hashgraph']) {
            const hbar = data['hedera-hashgraph'];
            setVolume24h(formatCompact(hbar.usd_24h_vol));
            setMarketCap(formatCompact(hbar.usd_market_cap));
            setPriceChange24h(hbar.usd_24h_change);
          }
        }
      } catch (err) { console.error("CoinGecko Error:", err); }
    };
    fetchMarketMetrics();
    const interval = setInterval(fetchMarketMetrics, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.5)';
    const lineColor = isDark ? '#00A8E8' : '#2563EB';

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
            minimumFractionDigits: 4, maximumFractionDigits: 4,
          }).format(price);
        },
      },
      timeScale: { borderVisible: false, timeVisible: true },
      rightPriceScale: {
        borderVisible: false, autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      handleScroll: false, handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor, 
      topColor: isDark ? `${lineColor}33` : `${lineColor}22`, 
      bottomColor: `${lineColor}00`, 
      lineWidth: 2,
    });

    const loadPythHistory = async () => {
      let resolution = 'D';
      let secondsBack = 30 * 24 * 60 * 60;
      if (activeInterval === '1H') { resolution = '15'; secondsBack = 24 * 60 * 60; }
      else if (activeInterval === '1D') { resolution = '60'; secondsBack = 7 * 24 * 60 * 60; }
      else if (activeInterval === '1W') { resolution = 'D'; secondsBack = 30 * 24 * 60 * 60; }
      else if (activeInterval === '1M') { resolution = 'D'; secondsBack = 90 * 24 * 60 * 60; }
      else if (activeInterval === 'ALL') { resolution = 'W'; secondsBack = 365 * 24 * 60 * 60; }

      const to = Math.floor(Date.now() / 1000);
      const from = to - secondsBack;

      try {
        const response = await fetch(`${PYTH_BENCHMARKS_URL}?symbol=Crypto.HBAR/USD&resolution=${resolution}&from=${from}&to=${to}`);
        const data = await response.json();
        if (data.s === "ok") {
          const priceData = data.t.map((t: number, i: number) => ({ time: t as UTCTimestamp, value: data.c[i] }));
          areaSeries.setData(priceData);
          chart.timeScale().fitContent();
        }
      } catch (err) { console.error("History Error:", err); }
    };

    loadPythHistory();
    chartRef.current = chart;
    seriesRef.current = areaSeries;

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
      resizeObserver.disconnect(); 
      chart.remove(); 
    };
  }, [theme, activeInterval]);

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => {
    if (theme === 'dark') {
      return (
        <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-[8px] py-1.5 px-3.5 tracking-wide ${active ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
          {label}
        </button>
      );
    }
    // Light Mode Button
    return (
      <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-[8px] py-1.5 px-3.5 tracking-wide ${active ? 'bg-blue-50 text-blue-600 shadow-sm border border-transparent' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}`}>
        {label}
      </button>
    );
  };

  return (
    <div className="w-full mx-auto flex flex-col h-full relative overflow-visible">
      
      {/* Header section exactly as reference */}
      <div className="flex justify-between items-start w-full mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/5 flex items-center justify-center bg-white dark:bg-white/5 shadow-sm dark:shadow-none">
            <span className="text-[20px] font-bold text-slate-900 dark:text-white/90">H</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-[16px] font-bold tracking-tight mb-0.5 text-slate-900 dark:text-white">HBAR Market</h3>
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/50 uppercase tracking-widest">HBAR / USD</span>
          </div>
        </div>
        <div className="flex gap-1 items-center bg-white dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 p-1 rounded-[12px] shadow-sm dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(interval => (
            <FilterButton key={interval} label={interval} active={activeInterval === interval} onClick={() => setActiveInterval(interval)} />
          ))}
        </div>
      </div>

      {/* Massive Price section */}
      <div className="flex flex-col mb-2">
        <span className="text-[44px] leading-none font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
          {hbarPrice ? `$${hbarPrice.slice(0, hbarPrice.length - 2)}` : "..."}
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
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{marketCap || "$3.76B"}</span>
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-white/5"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">24h Volume</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{volume24h || "$128.45M"}</span>
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-white/5"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Circulating Supply</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">42.39B HBAR</span>
        </div>
        <div className="w-px h-8 bg-slate-200 dark:bg-white/5"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Rank</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">#18</span>
        </div>
      </div>
    </div>
  );
};
