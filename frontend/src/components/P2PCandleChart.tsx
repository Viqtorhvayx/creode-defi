"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';

interface P2PCandleChartProps {
  theme: 'light' | 'dark';
}

export const P2PCandleChart: React.FC<P2PCandleChartProps> = ({ theme }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: theme === 'dark' ? '#808a9d' : '#64748b',
      },
      grid: {
        vertLines: { color: theme === 'dark' ? 'rgba(30, 35, 48, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
        horzLines: { color: theme === 'dark' ? 'rgba(30, 35, 48, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
      },
      timeScale: {
        borderColor: theme === 'dark' ? '#1e2330' : '#e2e8f0',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: theme === 'dark' ? '#1e2330' : '#e2e8f0',
        autoScale: true,
      },
      crosshair: {
        mode: 1, // Normal mode
        vertLine: {
          color: theme === 'dark' ? '#808a9d' : '#64748b',
          width: 1,
          style: 1, // Dotted
        },
        horzLine: {
          color: theme === 'dark' ? '#808a9d' : '#64748b',
          width: 1,
          style: 1, // Dotted
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#00c076',
      downColor: '#ff5353',
      borderVisible: false,
      wickUpColor: '#00c076',
      wickDownColor: '#ff5353',
    });

    const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";
    const loadData = async () => {
      try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (100 * 3600); // 100 hours ago
        const response = await fetch(`${PYTH_BENCHMARKS_URL}?symbol=Crypto.BTC/USD&resolution=60&from=${from}&to=${to}`);
        const data = await response.json();
        
        if (data.s === "ok") {
          const candleData = data.t.map((t: number, i: number) => ({
            time: t,
            open: data.o[i],
            high: data.h[i],
            low: data.l[i],
            close: data.c[i],
          }));
          candleSeries.setData(candleData);
          chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Failed to load candle data:", err);
      }
    };

    loadData();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial size
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [theme]);

  return (
    <div className="w-full h-full relative" ref={chartContainerRef}>
      {/* Container for the chart */}
    </div>
  );
};
