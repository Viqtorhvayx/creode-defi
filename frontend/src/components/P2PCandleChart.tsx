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

    // Generate some dummy candlestick data that looks like the image (downward trend then spike)
    const data = [];
    let currentTime = Math.floor(Date.now() / 1000) - (100 * 3600); // Start 100 hours ago
    let currentPrice = 72000;

    for (let i = 0; i < 100; i++) {
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 500;
      // Make it trend downward overall, but have some spikes
      const trend = i > 70 ? 200 : -100; 
      const close = open + change + trend;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;

      data.push({
        time: currentTime as any,
        open,
        high,
        low,
        close,
      });

      currentPrice = close;
      currentTime += 3600; // 1 hour per candle
    }

    candleSeries.setData(data);
    chart.timeScale().fitContent();

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
