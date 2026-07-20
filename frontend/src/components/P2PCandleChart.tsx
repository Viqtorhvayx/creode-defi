"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { fetchCandles, type Timeframe, type Candle } from '../lib/market';

export interface MarketStats { price: number; change24h: number; high24h: number; low24h: number }

interface P2PCandleChartProps {
  theme: 'light' | 'dark';
  pairId: string;
  interval: Timeframe;
  onStats?: (s: MarketStats) => void;
}

// Derive 24h price/high/low/change from the loaded candles (source of truth is
// the same real feed the chart draws).
function computeStats(candles: Candle[]): MarketStats | null {
  if (!candles.length) return null;
  const last = candles[candles.length - 1];
  const cutoff = last.time - 86400;
  const window = candles.filter((c) => c.time >= cutoff);
  const ref = (window[0] ?? candles[0]).open || last.close;
  const high24h = Math.max(...window.map((c) => c.high), last.high);
  const low24h = Math.min(...window.map((c) => c.low), last.low);
  const change24h = ref ? ((last.close - ref) / ref) * 100 : 0;
  return { price: last.close, change24h, high24h, low24h };
}

export const P2PCandleChart: React.FC<P2PCandleChartProps> = ({ theme, pairId, interval, onStats }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;

  // Build the chart once per theme.
  useEffect(() => {
    if (!chartContainerRef.current) return;
    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: theme === 'dark' ? '#808a9d' : '#64748b' },
      grid: {
        vertLines: { color: theme === 'dark' ? 'rgba(30, 35, 48, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
        horzLines: { color: theme === 'dark' ? 'rgba(30, 35, 48, 0.5)' : 'rgba(226, 232, 240, 0.5)' },
      },
      timeScale: { borderColor: theme === 'dark' ? '#1e2330' : '#e2e8f0', timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: theme === 'dark' ? '#1e2330' : '#e2e8f0', autoScale: true },
      crosshair: {
        mode: 1,
        vertLine: { color: theme === 'dark' ? '#808a9d' : '#64748b', width: 1, style: 1 },
        horzLine: { color: theme === 'dark' ? '#808a9d' : '#64748b', width: 1, style: 1 },
      },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries({
      upColor: '#10B981', downColor: '#EF4444', borderVisible: false,
      wickUpColor: '#10B981', wickDownColor: '#EF4444',
    });

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => { window.removeEventListener('resize', handleResize); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [theme]);

  // Load + live-poll candles whenever the pair or interval changes.
  useEffect(() => {
    let alive = true;
    let fitted = false;
    const load = async () => {
      try {
        const candles = await fetchCandles(pairId, interval);
        if (!alive || !seriesRef.current || candles.length === 0) return;
        seriesRef.current.setData(candles as any);
        if (!fitted) { chartRef.current?.timeScale().fitContent(); fitted = true; }
        const stats = computeStats(candles);
        if (stats && onStatsRef.current) onStatsRef.current(stats);
      } catch (err) {
        console.error('[P2PCandleChart] load failed:', err);
      }
    };
    load();
    // Movement: intraday frames refresh fast, higher frames slower.
    const period = interval === '15m' || interval === '1H' ? 15000 : 30000;
    const t = setInterval(load, period);
    return () => { alive = false; clearInterval(t); };
  }, [pairId, interval]);

  return <div className="w-full h-full relative" ref={chartContainerRef} />;
};
