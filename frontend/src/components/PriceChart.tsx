"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

/**
 * @title PriceChart
 * @author Viqtorhvayx
 * @dev Minimalist HBAR Market Chart with Price, Volume, and Liquidity overlays.
 * Supports HBAR/USDT and HBAR/USDC toggles with multiple time intervals.
 */
export const PriceChart: React.FC<PriceChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [activePair, setActivePair] = useState<'USDT' | 'USDC'>('USDT');
  const [activeInterval, setActiveInterval] = useState<'15min' | 'Hour' | 'Day' | 'Week'>('Day');

  // Simulated metrics
  const volume = activePair === 'USDT' ? "1.2M" : "850K";
  const liquidity = activePair === 'USDT' ? "$4.5M" : "$3.1M";
  const currentPrice = 0.0942;

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
      width: chartContainerRef.current.clientWidth,
      height: 220,
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.2,
          bottom: 0.2,
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
      priceFormat: {
        type: 'price',
        precision: 4,
        minMove: 0.0001,
      },
    });

    const volumeSeries = chart.addHistogramSeries({
        color: isDark ? 'rgba(0, 168, 232, 0.1)' : 'rgba(0, 168, 232, 0.05)',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', // overlay
    });

    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.7, // volume at bottom 30%
            bottom: 0,
        },
    });

    // Mock Data Generation
    const generateData = () => {
      const data = [];
      const volumeData = [];
      let basePrice = activePair === 'USDT' ? 0.092 : 0.093;
      const now = new Date();
      
      const count = activeInterval === '15min' ? 100 : activeInterval === 'Hour' ? 72 : 30;
      const step = activeInterval === '15min' ? 15 * 60 : activeInterval === 'Hour' ? 3600 : 86400;

      for (let i = count; i >= 0; i--) {
        const time = Math.floor(now.getTime() / 1000) - (i * step);
        const change = (Math.random() - 0.5) * 0.002;
        basePrice += change;
        data.push({ time, value: basePrice });
        volumeData.push({ 
            time, 
            value: Math.random() * 1000000,
            color: change >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
        });
      }
      return { data, volumeData };
    };

    const { data, volumeData } = generateData();
    areaSeries.setData(data);
    volumeSeries.setData(volumeData);

    chartRef.current = chart;
    seriesRef.current = areaSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, activePair, activeInterval]);

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all duration-200 ${
        active 
          ? 'bg-[#00A8E8] text-white' 
          : 'bg-black/5 dark:bg-white/5 text-black/40 dark:text-white/40 hover:bg-black/10 dark:hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="industrial-panel bg-surface !p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
              HBAR / {activePair}
            </span>
            <div className="flex bg-black/5 dark:bg-white/5 p-0.5 rounded-lg">
              <button 
                onClick={() => setActivePair('USDT')}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${activePair === 'USDT' ? 'bg-[#00A8E8] text-white shadow-sm' : 'text-black/40 dark:text-white/40'}`}
              >
                USDT
              </button>
              <button 
                onClick={() => setActivePair('USDC')}
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${activePair === 'USDC' ? 'bg-[#00A8E8] text-white shadow-sm' : 'text-black/40 dark:text-white/40'}`}
              >
                USDC
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black" style={{ color: primaryTextColor }}>{currentPrice}</span>
            <span className="text-[10px] font-bold !text-[#10B981]">+1.24%</span>
          </div>
        </div>

        <div className="flex gap-1">
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

      <div className="relative w-full h-[220px]">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>24H Volume</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>{volume} <span className="text-[9px] font-bold opacity-40">HBAR</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>Liquidity</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>{liquidity}</span>
        </div>
      </div>
    </div>
  );
};
