"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

/**
 * @title PriceChart
 * @author Viqtorhvayx
 * @dev HBAR/USD Market Chart with optimized control layout and precise label casing.
 * Implements smooth left-to-right entry animation, auto-scaling strict currency 
 * Y-axis, and dynamic X-axis time formatting.
 */
export const PriceChart: React.FC<PriceChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'15min' | 'Hour' | 'Day' | 'Week'>('Day');

  // Simulated metrics for HBAR/USD
  const volumeValue = "1.8M";
  const liquidityValue = "$6.2M";
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
        tickMarkFormatter: (time: UTCTimestamp, tickMarkType: any, locale: string) => {
          const date = new Date(time * 1000);
          if (activeInterval === '15min' || activeInterval === 'Hour') {
            return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
          } else {
            return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
          }
        },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: true,
        alignLabels: true,
        scaleMargins: {
          top: 0.1, // Slight padding to prevent top clipping
          bottom: 0.25, // Room for volume bars
        },
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = (chart as any).addAreaSeries({
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

    const volumeSeries = (chart as any).addHistogramSeries({
        color: isDark ? 'rgba(0, 168, 232, 0.1)' : 'rgba(0, 168, 232, 0.05)',
        priceFormat: {
            type: 'volume',
        },
        priceScaleId: '', 
    });

    volumeSeries.priceScale().applyOptions({
        scaleMargins: {
            top: 0.7,
            bottom: 0,
        },
    });

    const generateData = () => {
      const data = [];
      const volumeData = [];
      let basePrice = 0.094;
      const now = new Date();
      
      const count = activeInterval === '15min' ? 100 : activeInterval === 'Hour' ? 72 : 30;
      const step = activeInterval === '15min' ? 15 * 60 : activeInterval === 'Hour' ? 3600 : 86400;

      for (let i = count; i >= 0; i--) {
        const time = (Math.floor(now.getTime() / 1000) - (i * step)) as UTCTimestamp;
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
    
    let animationId: number;
    const start = performance.now();
    const duration = 1500; // Smooth 1500ms entry draw animation

    const animateDraw = (timestamp: number) => {
      const elapsed = timestamp - start;
      const t = Math.min(elapsed / duration, 1);
      
      // Use an ease-out quadratic function for a natural landing
      const easeOut = t * (2 - t); 
      
      const pointsToShow = Math.max(1, Math.floor(data.length * easeOut));
      
      areaSeries.setData(data.slice(0, pointsToShow));
      volumeSeries.setData(volumeData.slice(0, pointsToShow));
      
      // Dynamically fit the X-axis so it doesn't bunch up during drawing
      chart.timeScale().fitContent();

      if (t < 1) {
        animationId = requestAnimationFrame(animateDraw);
      }
    };

    animationId = requestAnimationFrame(animateDraw);

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
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, activeInterval]);

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  /**
   * Compact FilterButton Styling with exact casing requirement:
   * - Removed 'uppercase' utility to honor exact string case.
   * - Maintained text-[8px] and py-1 for compact hierarchy.
   */
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
    <div className="industrial-panel w-full mx-auto !p-6 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <div className="flex flex-col relative">
          <div className="z-10 bg-surface pb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>
              HBAR / USD
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black" style={{ color: primaryTextColor }}>{currentPrice}</span>
              <span className="text-[10px] font-bold !text-[#10B981]">+1.24%</span>
            </div>
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
      </div>

      <div className="relative w-full flex-grow mt-2 min-h-[230px]">
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-4 transform -translate-y-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>24H Volume</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>{volumeValue} <span className="text-[9px] font-bold opacity-40">HBAR</span></span>
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: labelColor }}>Liquidity</span>
          <span className="text-xs font-black" style={{ color: primaryTextColor }}>{liquidityValue}</span>
        </div>
      </div>
    </div>
  );
};
