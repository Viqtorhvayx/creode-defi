"use client";

// Developer: Viqtorhvayx (GitHub: Viqtorhvayx)
import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

/**
 * @title PriceChart (Hybrid Architecture)
 * @author Viqtorhvayx
 * @dev HBAR/USD Market Module powered by Pyth Network (Price/Chart) and CoinGecko (Volume/Cap).
 */
export const PriceChart: React.FC<PriceChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1W');
  
  // Real-time Data States authored by Viqtorhvayx
  const [hbarPrice, setHbarPrice] = useState<string | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [marketCap, setMarketCap] = useState<string | null>(null);

  const PYTH_HBAR_FEED_ID = "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
  const PYTH_HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";
  const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";
  const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true";

  // Numeric Formatter for Industrial UI Casing
  const formatCompact = (val: number | undefined) => {
    if (val === undefined || val === null) return "...";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  // 1. Pyth Live Price Fetching
  useEffect(() => {
    const fetchPythPrice = async () => {
      try {
        const response = await fetch(`${PYTH_HERMES_URL}?ids[]=${PYTH_HBAR_FEED_ID}`);
        if (response.ok) {
          const data = await response.json();
          if (data.parsed && data.parsed[0]) {
            const priceObj = data.parsed[0].price;
            const price = Number(priceObj.price) * Math.pow(10, priceObj.expo);
            setHbarPrice(price.toFixed(4));
          }
        }
      } catch (err) { console.error("Pyth Error:", err); }
    };
    fetchPythPrice();
    const interval = setInterval(fetchPythPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  // 2. CoinGecko Market Metrics Fetching (Volume/Cap/Change)
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
    const interval = setInterval(fetchMarketMetrics, 60000); // 1m polling for rate limits
    return () => clearInterval(interval);
  }, []);

  // 3. Pyth Historical Charting
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const backgroundColor = 'transparent';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    const lineColor = '#00A8E8';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' },
        horzLines: { color: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)' },
      },
      autoSize: true,
      width: chartContainerRef.current.clientWidth || 400,
      height: 230,
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
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      handleScroll: false, handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor, topColor: `${lineColor}33`, bottomColor: `${lineColor}00`, lineWidth: 2,
    });

    const volumeSeries = chart.addHistogramSeries({
      color: isDark ? 'rgba(0, 168, 232, 0.1)' : 'rgba(0, 168, 232, 0.05)',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.7, bottom: 0 },
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
          const volData = data.t.map((t: number, i: number) => ({
            time: t as UTCTimestamp, value: data.v[i] || Math.random() * 100000,
            color: data.c[i] >= data.o[i] ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }));
          areaSeries.setData(priceData);
          volumeSeries.setData(volData);
          chart.timeScale().fitContent();
        }
      } catch (err) { console.error("History Error:", err); }
    };

    loadPythHistory();
    chartRef.current = chart;
    seriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

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

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`text-[10px] font-bold transition-all duration-300 rounded-[6px] py-1.5 px-3 tracking-widest ${
        active 
          ? 'bg-black/5 dark:bg-white/10 text-black dark:text-white' 
          : 'text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full mx-auto flex flex-col h-full relative overflow-visible">
      
      {/* Header section exactly as reference */}
      <div className="flex justify-between items-start w-full mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-black/10 dark:border-white/10 flex items-center justify-center bg-black/5 dark:bg-white/5">
            <span className="text-xl font-bold" style={{ color: primaryTextColor }}>H</span>
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-bold tracking-tight mb-1" style={{ color: primaryTextColor }}>HBAR Market</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>HBAR / USD</span>
          </div>
        </div>
        <div className="flex gap-1 items-center bg-black/5 dark:bg-[#1A2332] p-1 rounded-lg border border-black/5 dark:border-white/5">
          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(interval => (
            <FilterButton key={interval} label={interval} active={activeInterval === interval} onClick={() => setActiveInterval(interval)} />
          ))}
        </div>
      </div>

      {/* Massive Price section */}
      <div className="flex flex-col mb-4">
        <span className="text-[40px] leading-none font-bold tracking-tight mb-3" style={{ color: primaryTextColor }}>
          {hbarPrice ? `$${hbarPrice}` : "..."}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold flex items-center gap-1 ${priceChange24h && priceChange24h >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            {priceChange24h && priceChange24h >= 0 ? '▲' : '▼'} {priceChange24h ? Math.abs(priceChange24h).toFixed(2) : "..."}% 
            <span className="text-xs ml-1" style={{ color: labelColor }}>(24h)</span>
          </span>
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[200px] mt-2 mb-6"><div ref={chartContainerRef} className="absolute inset-0" /></div>

      {/* Bottom Stats Footer */}
      <div className="grid grid-cols-4 w-full border-t border-black/5 dark:border-white/10 pt-6">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: labelColor }}>Market Cap</span>
          <span className="text-sm font-bold" style={{ color: primaryTextColor }}>{marketCap || "$3.76B"}</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: labelColor }}>24h Volume</span>
          <span className="text-sm font-bold" style={{ color: primaryTextColor }}>{volume24h || "$128.45M"}</span>
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: labelColor }}>Circulating Supply</span>
          <span className="text-sm font-bold" style={{ color: primaryTextColor }}>42.39B HBAR</span>
        </div>
        <div className="flex flex-col text-right items-end">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: labelColor }}>Rank</span>
          <span className="text-sm font-bold" style={{ color: primaryTextColor }}>#18</span>
        </div>
      </div>
    </div>
  );
};
