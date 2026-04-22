"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

/**
 * @title PriceChart
 * @author Viqtorhvayx
 * @dev Live HBAR/USDT price chart using Lightweight Charts.
 * Integrated with the protocol's industrial design system and real-time Binance data.
 */
export const PriceChart: React.FC<PriceChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [interval, setInterval] = useState('15m');
  const [price, setPrice] = useState<number | null>(null);

  // Theme-aware color tokens
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: labelColor,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        horzLine: { visible: false, labelVisible: true },
        vertLine: { 
          visible: true, 
          style: 0, 
          width: 1, 
          color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', 
          labelVisible: true 
        }
      },
      handleScale: true,
      handleScroll: true,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#00A8E8',
      topColor: 'rgba(0, 168, 232, 0.2)',
      bottomColor: 'rgba(0, 168, 232, 0)',
      lineWidth: 2,
      priceFormat: { type: 'price', precision: 4, minMove: 0.0001 }
    });

    const volumeSeries = chart.addHistogramSeries({
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // Overlay
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;

    const fetchData = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=HBARUSDT&interval=${interval}&limit=100`);
        const data = await response.json();

        const formattedPriceData = data.map((d: any) => ({
          time: d[0] / 1000,
          value: parseFloat(d[4])
        }));

        const formattedVolumeData = data.map((d: any) => ({
          time: d[0] / 1000,
          value: parseFloat(d[5]),
          color: parseFloat(d[4]) > parseFloat(d[1]) ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        }));

        areaSeries.setData(formattedPriceData);
        volumeSeries.setData(formattedVolumeData);

        if (formattedPriceData.length > 0) {
          setPrice(formattedPriceData[formattedPriceData.length - 1].value);
        }

        chart.timeScale().fitContent();
      } catch (error) {
        console.error("Error fetching HBAR data:", error);
      }
    };

    fetchData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme, interval]);

  const intervals = ['15m', '1h', '1d', '1M'];

  return (
    <div className="industrial-panel bg-surface flex flex-col h-[350px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider mb-1"
            style={{ color: labelColor }}
          >
            HBAR / USDT
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-xl font-black" style={{ color: primaryTextColor }}>
              ${price?.toFixed(4) || '0.0000'}
            </p>
            <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-full font-bold uppercase">
              High Liquidity
            </span>
          </div>
        </div>
        <div className="flex gap-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
          {intervals.map((i) => (
            <button
              key={i}
              onClick={() => setInterval(i)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 ${
                interval === i 
                  ? 'bg-[#00A8E8] text-white shadow-md' 
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {i.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-grow w-full overflow-hidden" />
    </div>
  );
};
