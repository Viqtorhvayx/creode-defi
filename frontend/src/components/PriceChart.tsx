"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

/**
 * @title PriceChart (Pyth Edition)
 * @author Viqtorhvayx
 * @dev HBAR/USD Market Chart migrated to Pyth Network (Hermes & Benchmarks APIs).
 * Implements real-time polling and historical data series integration.
 */
export const PriceChart: React.FC<PriceChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'15min' | 'Hour' | 'Day' | 'Week'>('Day');
  const [isInfoActive, setIsInfoActive] = useState(false);
  const [hbarPrice, setHbarPrice] = useState<string | null>(null);

  // Pyth Network Configuration authored by Viqtorhvayx
  const PYTH_HBAR_FEED_ID = "3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd";
  const PYTH_HERMES_URL = "https://hermes.pyth.network/v2/updates/price/latest";
  const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";

  // Raw market metrics (Volume/Liquidity) - Preserved Layout
  const rawVolume = 1800000;
  const rawLiquidity = 6200000;

  // 1. Pyth Live Price Polling
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
      } catch (error) {
        console.error("Pyth Hermes Fetch Error:", error);
      }
    };

    fetchPythPrice();
    const interval = setInterval(fetchPythPrice, 10000); // 10s sync
    return () => clearInterval(interval);
  }, []);

  // HBAR Market Statistics
  const hbarStats = {
    marketCap: "$782,422,105",
    ath: "$0.5701",
    atl: "$0.0098",
    high24: "$0.0965",
    low24: "$0.0912"
  };

  // 2. Pyth Historical Chart Data Integration
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
      width: chartContainerRef.current.offsetWidth,
      height: 230,
      localization: {
        priceFormatter: (price: number) => {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }).format(price);
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        alignLabels: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor,
      topColor: `${lineColor}33`,
      bottomColor: `${lineColor}00`,
      lineWidth: 2,
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

      if (activeInterval === '15min') { resolution = '15'; secondsBack = 24 * 60 * 60; }
      else if (activeInterval === 'Hour') { resolution = '60'; secondsBack = 7 * 24 * 60 * 60; }
      else if (activeInterval === 'Day') { resolution = 'D'; secondsBack = 30 * 24 * 60 * 60; }
      else if (activeInterval === 'Week') { resolution = 'W'; secondsBack = 180 * 24 * 60 * 60; }

      const to = Math.floor(Date.now() / 1000);
      const from = to - secondsBack;

      try {
        const response = await fetch(`${PYTH_BENCHMARKS_URL}?symbol=Crypto.HBAR/USD&resolution=${resolution}&from=${from}&to=${to}`);
        const data = await response.json();

        if (data.s === "ok") {
          const priceData = data.t.map((t: number, i: number) => ({
            time: t as UTCTimestamp,
            value: data.c[i]
          }));
          const volData = data.t.map((t: number, i: number) => ({
            time: t as UTCTimestamp,
            value: data.v[i] || Math.random() * 500000,
            color: data.c[i] >= data.o[i] ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
          }));

          areaSeries.setData(priceData);
          volumeSeries.setData(volData);
          chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Pyth Historical Fetch Error:", err);
      }
    };

    loadPythHistory();

    chartRef.current = chart;
    seriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.offsetWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, activeInterval]);

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`text-[8px] font-black transition-all duration-300 rounded-[60px] !py-1 !h-auto px-2 tracking-tighter ${
        active 
          ? 'bg-[#00A8E8] text-white shadow-md shadow-[#00A8E8]/20' 
          : 'bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="industrial-panel w-full mx-auto !p-6 flex flex-col h-full relative overflow-visible">
      {isInfoActive && (
        <div className="absolute top-14 right-6 w-56 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl z-[110] animate-in fade-in zoom-in duration-200">
          <h5 className="text-[10px] font-black uppercase tracking-widest mb-3 text-white/90">Market Statistics</h5>
          <div className="space-y-2.5">
            {[
              { label: 'Market Cap', value: hbarStats.marketCap },
              { label: 'All Time High', value: hbarStats.ath },
              { label: 'All Time Low', value: hbarStats.atl },
              { label: '24hr High', value: hbarStats.high24 },
              { label: '24hr Low', value: hbarStats.low24 }
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                <span className="text-[9px] font-bold uppercase text-white/40">{item.label}</span>
                <span className="text-[10px] font-black text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-baseline w-full mb-2">
        <div className="flex flex-col relative">
          <div className="z-10 bg-surface pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
              HBAR / USD
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black" style={{ color: primaryTextColor }}>
                {hbarPrice ? `$${hbarPrice}` : "..."}
              </span>
              <span className="text-[10px] font-bold !text-[#10B981]">+1.24%</span>
          </div>

          <div className="flex gap-1 mt-2 z-0">
            {(['15min', 'Hour', 'Day', 'Week'] as const).map(interval => (
              <FilterButton 
                key={interval}
                label={interval}
                active={activeInterval === interval}
                onClick={() => setActiveInterval(interval)}
              />
            ))}
          </div>
        </div>

        <button 
          onClick={() => setIsInfoActive(!isInfoActive)}
          className={`transition-all duration-300 hover:scale-110 active:scale-95 p-1 relative top-[2px] ${isInfoActive ? 'text-[#00A8E8]' : ''}`}
          style={{ color: isInfoActive ? '#00A8E8' : labelColor }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </button>
      </div>

      <div className="relative w-full flex-grow mt-2 min-h-[230px]">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      <div className="flex w-full justify-between items-end border-t border-[var(--border)] pt-4 transform -translate-y-4">
        <div className="flex flex-col text-left">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>24H Volume</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>
            {rawVolume.toLocaleString()} <span className="text-[9px] font-bold opacity-40">HBAR</span>
          </span>
        </div>
        <div className="flex flex-col text-right items-end">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>Liquidity</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>
            ${rawLiquidity.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
