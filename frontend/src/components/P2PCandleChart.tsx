"use client";

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { fetchCandles, getPair, RESOLUTIONS, PYTH_FEED_IDS, type Timeframe, type Candle } from '../lib/market';
import { subscribePythPrice } from '../lib/pythStream';
import { pollPoolTick } from '../lib/poolStream';
import { POOL_TICK_CONFIG } from '../lib/uniswapV3Pools';

// Fold a new live tick into the candle array for the given timeframe bucket,
// returning the updated array and the single bar to push into the chart
// series. Shared by both live-tick sources (Pyth streaming, pool polling).
function mergeTick(candles: Candle[], bucketSecs: number, price: number, time: number): { candles: Candle[]; bar: Candle } {
  const bucket = Math.floor(time / bucketSecs) * bucketSecs;
  const last = candles[candles.length - 1];
  if (last && last.time === bucket) {
    const bar: Candle = { ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price };
    return { candles: [...candles.slice(0, -1), bar], bar };
  }
  const bar: Candle = { time: bucket, open: price, high: price, low: price, close: price };
  return { candles: [...candles, bar], bar };
}

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

  // Load history, then either stream live ticks (Pyth-sourced "majors") or
  // fall back to polling a fresh snapshot (GeckoTerminal-sourced pairs, which
  // have no live push feed) whenever the pair or interval changes.
  useEffect(() => {
    let alive = true;
    let fitted = false;
    let candles: Candle[] = [];
    let teardown: (() => void) | null = null;

    const applyStats = () => {
      const stats = computeStats(candles);
      if (stats && onStatsRef.current) onStatsRef.current(stats);
    };

    const load = async () => {
      try {
        const fresh = await fetchCandles(pairId, interval);
        if (!alive || !seriesRef.current || fresh.length === 0) return;
        candles = fresh;
        seriesRef.current.setData(candles as any);
        if (!fitted) { chartRef.current?.timeScale().fitContent(); fitted = true; }
        applyStats();
      } catch (err) {
        console.error('[P2PCandleChart] load failed:', err);
      }
    };

    const pair = getPair(pairId);
    const feedId = pair.source === 'pyth' && pair.pythSymbol ? PYTH_FEED_IDS[pair.pythSymbol] : null;
    const hasPoolTick = pairId in POOL_TICK_CONFIG;

    load().then(() => {
      if (!alive) return;
      const secs = RESOLUTIONS[interval].secs;
      if (feedId) {
        // Live stream (Pyth Hermes): bucket each tick into the active
        // timeframe's candle width and push it straight into the chart.
        teardown = subscribePythPrice(feedId, ({ price, time }) => {
          if (!alive || !seriesRef.current) return;
          const { candles: next, bar } = mergeTick(candles, secs, price, time);
          candles = next;
          seriesRef.current.update(bar as any);
          applyStats();
        });
      } else if (hasPoolTick) {
        // No push feed (GeckoTerminal-sourced), but reading the pool's own
        // Swap events directly is far faster than re-fetching a GeckoTerminal
        // snapshot every 15-30s.
        teardown = pollPoolTick(pairId, ({ price, time }) => {
          if (!alive || !seriesRef.current) return;
          const { candles: next, bar } = mergeTick(candles, secs, price, time);
          candles = next;
          seriesRef.current.update(bar as any);
          applyStats();
        });
      } else {
        // Fallback for any pair without a configured live source.
        const period = interval === '15m' || interval === '1H' ? 15000 : 30000;
        const t = setInterval(load, period);
        teardown = () => clearInterval(t);
      }
    });

    return () => { alive = false; teardown?.(); };
  }, [pairId, interval]);

  return <div className="w-full h-full relative" ref={chartContainerRef} />;
};
