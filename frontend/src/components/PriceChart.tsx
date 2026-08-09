// Implementation and CoinGecko API integration for UI update by Viqtorhvayx
"use client";


import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import { CaretDown } from '@phosphor-icons/react';
import { TokenLogo } from './TokenLogo';
import { subscribePythPrice } from '../lib/pythStream';
import { subscribeBinancePrice } from '../lib/binanceStream';
import { VAULT_WATCH_TOKENS } from '../lib/market';

interface PriceChartProps {
  theme?: 'light' | 'dark';
}

const PYTH_BENCHMARKS_URL = "https://benchmarks.pyth.network/v1/shims/tradingview/history";

// Bucket width (seconds) matching each history resolution, so live streamed
// ticks fold into the same bar width as the loaded history instead of adding
// a jagged point per tick.
const BUCKET_SECS: Record<string, number> = { '1': 60, '60': 3600, 'D': 86400, 'W': 604800 };

// 01 Exchange/N1 (terminal.trade) publishes its own indexPrice/markPrice
// once per update cycle on its own server, so its real on-screen lag behind
// Binance itself varies with however often that cycle runs. Creode can't
// control that refresh cadence, only how close it stays to Binance itself;
// polling every 50ms (same reliable REST endpoint, same code path — just a
// faster timer) keeps that gap as small as reasonably possible. Measured
// real round-trip latency to Binance is ~165-170ms, so requests already
// overlap in flight at this interval — going lower than this doesn't buy
// additional freshness, just more redundant in-flight requests for no
// benefit.
const BINANCE_POLL_MS = 50;
const BINANCE_FAIL_GRACE = Math.ceil(1000 / BINANCE_POLL_MS); // ~1s of consecutive failures before treating it as an outage.

// Tokens with no safe CEX source at all — not even as a fallback. LIT is
// here because Binance's LITUSDT is a different, unrelated coin (Litentry)
// than N1's LIT (Lighter): confirmed live, Binance priced it ~$0.74 while
// Pyth's correct feed read ~$2.34 at the same instant. Unlike HBAR (which
// has a real Binance/Bybit pair and uses it as a staleness fallback), these
// symbols get Pyth only — no fallback — since the CEX pair itself would be
// wrong, not just slow.
const PYTH_ONLY_SYMS = new Set(['LIT']);

export const PriceChart: React.FC<PriceChartProps> = ({ theme = 'light' }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const [activeInterval, setActiveInterval] = useState<'1H' | '1D' | '1W' | '1M' | 'ALL'>('1D');
  const [activeSym, setActiveSym] = useState('HBAR');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const token = VAULT_WATCH_TOKENS.find((t) => t.sym === activeSym) || VAULT_WATCH_TOKENS[0];

  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [marketCap, setMarketCap] = useState<string | null>(null);
  const [circSupply, setCircSupply] = useState<string | null>(null);
  const [marketCapRank, setMarketCapRank] = useState<number | null>(null);

  // Close the symbol picker on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formatCompact = (val: number | undefined) => {
    if (val === undefined || val === null) return "...";
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(2)}K`;
    return `$${val.toFixed(2)}`;
  };
  const formatSupply = (val: number | undefined, sym: string) => {
    if (!val) return undefined;
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B ${sym}`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M ${sym}`;
    return `${val.toLocaleString()} ${sym}`;
  };

  // Real-time price. HBAR (not an 01 Exchange/N1 pair) keeps its original
  // direct Pyth Hermes SSE stream with Binance/Bybit only as a 10s-staleness
  // fallback. Every other token here is one 01 Exchange/N1 (terminal.trade)
  // also lists, so its live price instead tracks the same underlying
  // source: Binance spot, polled every 300ms — same proven REST poll, just
  // a faster timer than waiting on N1's own publish cycle. Falls back to
  // Pyth then Bybit if Binance goes quiet.
  const [priceSource, setPriceSource] = useState<'binance' | 'pyth' | 'bybit' | null>(null);
  useEffect(() => {
    setLivePrice(null);
    setPriceSource(null);
    let alive = true;

    if (token.sym === 'HBAR') {
      let lastPythTick = 0;
      let fallbackTimer: ReturnType<typeof setInterval> | null = null;
      const stopFallback = () => { if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; } };
      const pollFallback = async () => {
        try {
          const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}`);
          if (!res.ok || !alive) return;
          const d = await res.json();
          if (Date.now() - lastPythTick < 10_000) return; // Pyth resumed while this was in flight.
          if (d.price != null) { setLivePrice(d.price); setPriceSource(d.source); }
        } catch { /* keep last known price */ }
      };

      const unsubscribe = subscribePythPrice(token.pythFeedId, ({ price }) => {
        lastPythTick = Date.now();
        setPriceSource(null);
        setLivePrice(price);
        stopFallback();
      });

      const staleCheck = setInterval(() => {
        if (!alive || fallbackTimer) return;
        if (lastPythTick === 0 || Date.now() - lastPythTick >= 10_000) {
          pollFallback();
          fallbackTimer = setInterval(pollFallback, 3000);
        }
      }, 2000);

      return () => { alive = false; unsubscribe(); stopFallback(); clearInterval(staleCheck); };
    }

    if (PYTH_ONLY_SYMS.has(token.sym)) {
      const unsubscribe = subscribePythPrice(token.pythFeedId, ({ price }) => {
        setPriceSource(null);
        setLivePrice(price);
      });
      return () => { alive = false; unsubscribe(); };
    }

    // Binance-primary cascade for N1-matching tokens. Untouched from the
    // last known-stable version — the poll below never depends on the
    // stream layered on top of it further down, so this half of the effect
    // works exactly as it already does regardless of what the stream does.
    let lastPythPrice: number | null = null;
    let lastPythTick = 0;
    const unsubscribePyth = subscribePythPrice(token.pythFeedId, ({ price }) => {
      lastPythPrice = price;
      lastPythTick = Date.now();
    });

    // Guards against a slow in-flight poll response overwriting a fresher
    // tick the stream below already applied while that request was pending.
    let lastAppliedAt = 0;

    let binanceFailStreak = 0;
    const pollBinance = async () => {
      const firedAt = Date.now();
      try {
        const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}&source=binance`);
        const d = res.ok ? await res.json() : { price: null };
        if (!alive) return;
        if (d.price != null) {
          binanceFailStreak = 0;
          if (firedAt >= lastAppliedAt) {
            lastAppliedAt = firedAt;
            setLivePrice(d.price);
            setPriceSource(null); // Binance is primary here — no fallback badge.
          }
          return;
        }
        throw new Error('no binance price');
      } catch {
        if (!alive) return;
        binanceFailStreak++;
        if (binanceFailStreak < BINANCE_FAIL_GRACE) return;
        if (lastPythTick && Date.now() - lastPythTick < 10_000) {
          setLivePrice(lastPythPrice);
          setPriceSource('pyth');
          return;
        }
        try {
          const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}&source=bybit`);
          if (!res.ok || !alive) return;
          const d = await res.json();
          if (d.price != null) { setLivePrice(d.price); setPriceSource('bybit'); }
        } catch { /* keep last known price */ }
      }
    };

    pollBinance();
    const binanceTimer = setInterval(pollBinance, BINANCE_POLL_MS);

    // Pure add-on: a live per-trade stream layered on top of the poll above.
    // The poll keeps running exactly as it always has regardless of this —
    // if the stream never connects, misbehaves, or Vercel does something
    // unexpected with it again, this silently produces no ticks and the
    // poll alone continues to drive the display, unchanged from today.
    const unsubscribeStream = subscribeBinancePrice(token.sym, ({ price }) => {
      if (!alive) return;
      lastAppliedAt = Date.now();
      setLivePrice(price);
      setPriceSource(null);
    });

    return () => { alive = false; unsubscribePyth(); unsubscribeStream(); clearInterval(binanceTimer); };
  }, [token.pythFeedId, token.sym]);

  // Market cap / 24h change / volume / rank / supply — CoinGecko, best-effort
  // (same tolerance as the rest of the app: a failed call just leaves the
  // placeholder dashes rather than breaking anything).
  useEffect(() => {
    setPriceChange24h(null); setVolume24h(null); setMarketCap(null); setCircSupply(null); setMarketCapRank(null);
    let cancelled = false;
    const fetchMarketMetrics = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${token.coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const md = data?.market_data;
        if (!md) return;
        setPriceChange24h(md.price_change_percentage_24h ?? null);
        setVolume24h(formatCompact(md.total_volume?.usd));
        setMarketCap(formatCompact(md.market_cap?.usd));
        setCircSupply(formatSupply(md.circulating_supply, token.sym) ?? null);
        setMarketCapRank(data.market_cap_rank ?? null);
      } catch { /* best-effort */ }
    };
    fetchMarketMetrics();
    const interval = setInterval(fetchMarketMetrics, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [token.coingeckoId, token.sym]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = theme === 'dark';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.5)';
    const lineColor = '#00A8E8';

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
            minimumFractionDigits: 4, maximumFractionDigits: 6,
          }).format(price);
        },
      },
      timeScale: { borderVisible: false, timeVisible: true },
      rightPriceScale: {
        borderVisible: false, autoScale: true,
        scaleMargins: { top: 0.25, bottom: 0.25 },
      },
      handleScroll: false, handleScale: false,
    });

    const areaSeries = chart.addAreaSeries({
      lineColor,
      topColor: isDark ? `${lineColor}33` : `${lineColor}22`,
      bottomColor: `${lineColor}00`,
      lineWidth: 2,
      priceFormat: {
        type: 'price',
        precision: 5,
        minMove: 0.00001,
      },
    });
    chartRef.current = chart;
    seriesRef.current = areaSeries;

    let alive = true;
    let points: { time: UTCTimestamp; value: number }[] = [];
    let unsubTick: (() => void) | null = null;

    let resolution = 'D';
    let secondsBack = 30 * 24 * 60 * 60;
    if (activeInterval === '1H') { resolution = '1'; secondsBack = 60 * 60; }
    else if (activeInterval === '1D') { resolution = '60'; secondsBack = 7 * 24 * 60 * 60; }
    else if (activeInterval === '1W') { resolution = 'D'; secondsBack = 30 * 24 * 60 * 60; }
    else if (activeInterval === '1M') { resolution = 'D'; secondsBack = 90 * 24 * 60 * 60; }
    else if (activeInterval === 'ALL') { resolution = 'W'; secondsBack = 365 * 24 * 60 * 60; }
    const bucketSecs = BUCKET_SECS[resolution] ?? 3600;

    const loadHistory = async () => {
      const to = Math.floor(Date.now() / 1000);
      const from = to - secondsBack;
      try {
        const response = await fetch(`${PYTH_BENCHMARKS_URL}?symbol=Crypto.${token.sym}/USD&resolution=${resolution}&from=${from}&to=${to}`);
        const data = await response.json();
        if (!alive) return;
        if (data.s === "ok") {
          points = data.t.map((t: number, i: number) => ({ time: t as UTCTimestamp, value: data.c[i] }));
          areaSeries.setData(points);
          chart.timeScale().fitContent();
        }
      } catch (err) { console.error("History Error:", err); }
    };

    const applyTick = (price: number, time: number) => {
      if (!alive || !seriesRef.current) return;
      const bucket = (Math.floor(time / bucketSecs) * bucketSecs) as UTCTimestamp;
      const last = points[points.length - 1];
      if (last && last.time === bucket) {
        last.value = price;
      } else {
        points = [...points, { time: bucket, value: price }];
      }
      seriesRef.current.update(points[points.length - 1]);
    };

    // HBAR (not an 01 Exchange/N1 pair) keeps the original 10s
    // Pyth-staleness → Binance/Bybit fallback cascade. Every other token
    // here tracks the same source: Binance polled every 300ms, a faster
    // timer than waiting on N1's own publish cycle, falling back to Pyth
    // then Bybit if Binance goes quiet — kept in sync with the price header above
    // so the chart line moves the same way.
    let lastPythTick = 0;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    const stopFallback = () => { if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; } };
    const pollFallback = async () => {
      try {
        const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}`);
        if (!res.ok || !alive) return;
        const d = await res.json();
        if (Date.now() - lastPythTick < 10_000) return;
        if (d.price != null) applyTick(d.price, Math.floor(Date.now() / 1000));
      } catch { /* keep last known point */ }
    };

    loadHistory().then(() => {
      if (!alive) return;

      if (token.sym === 'HBAR') {
        // Live streaming: fold each Pyth tick into the current bucket so the
        // chart's last point moves in real time instead of waiting on the
        // next full history re-fetch.
        unsubTick = subscribePythPrice(token.pythFeedId, ({ price, time }) => {
          lastPythTick = Date.now();
          stopFallback();
          applyTick(price, time);
        });
        const staleCheck = setInterval(() => {
          if (!alive || fallbackTimer) return;
          if (lastPythTick === 0 || Date.now() - lastPythTick >= 10_000) {
            pollFallback();
            fallbackTimer = setInterval(pollFallback, 3000);
          }
        }, 2000);
        const prevUnsub = unsubTick;
        unsubTick = () => { prevUnsub?.(); clearInterval(staleCheck); stopFallback(); };
        return;
      }

      if (PYTH_ONLY_SYMS.has(token.sym)) {
        unsubTick = subscribePythPrice(token.pythFeedId, ({ price, time }) => {
          applyTick(price, time);
        });
        return;
      }

      // Binance-primary cascade for N1-matching tokens. Untouched from the
      // last known-stable version — the stream layered on top further
      // down is a pure add-on this loop never depends on.
      let lastPythPrice: number | null = null;
      let lastPythTickTime = 0;
      const unsubscribePyth = subscribePythPrice(token.pythFeedId, ({ price }) => {
        lastPythPrice = price;
        lastPythTickTime = Date.now();
      });

      // Guards against a slow in-flight poll response overwriting a fresher
      // tick the stream below already applied while that request was pending.
      let lastAppliedAt = 0;

      let binanceFailStreak = 0;
      const pollBinance = async () => {
        const firedAt = Date.now();
        try {
          const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}&source=binance`);
          const d = res.ok ? await res.json() : { price: null };
          if (!alive) return;
          if (d.price != null) {
            binanceFailStreak = 0;
            if (firedAt >= lastAppliedAt) {
              lastAppliedAt = firedAt;
              applyTick(d.price, Math.floor(Date.now() / 1000));
            }
            return;
          }
          throw new Error('no binance price');
        } catch {
          if (!alive) return;
          binanceFailStreak++;
          if (binanceFailStreak < BINANCE_FAIL_GRACE) return;
          if (lastPythTickTime && Date.now() - lastPythTickTime < 10_000) {
            applyTick(lastPythPrice!, Math.floor(Date.now() / 1000));
            return;
          }
          try {
            const res = await fetch(`/api/market/cex-fallback?symbol=${encodeURIComponent(token.sym)}&source=bybit`);
            if (!res.ok || !alive) return;
            const d = await res.json();
            if (d.price != null) applyTick(d.price, Math.floor(Date.now() / 1000));
          } catch { /* keep last known point */ }
        }
      };

      pollBinance();
      const binanceTimer = setInterval(pollBinance, BINANCE_POLL_MS);

      // Pure add-on: a live per-trade stream layered on top of the poll
      // above. If it never connects or misbehaves, this silently produces
      // no ticks and the poll alone continues driving the chart, unchanged.
      const unsubscribeStream = subscribeBinancePrice(token.sym, ({ price, time }) => {
        if (!alive) return;
        lastAppliedAt = Date.now();
        applyTick(price, time);
      });

      unsubTick = () => { unsubscribePyth(); unsubscribeStream(); clearInterval(binanceTimer); };
    });

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
      alive = false;
      unsubTick?.();
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [theme, activeInterval, token.sym, token.pythFeedId]);

  const FilterButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => {
    if (theme === 'dark') {
      return (
        <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-full py-1.5 px-3.5 tracking-wide ${active ? 'bg-transparent text-[#00A8E8] border border-transparent shadow-[inset_0_0_20px_rgba(0,168,232,0.35)]' : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'}`}>
          {label}
        </button>
      );
    }
    // Light Mode Button
    return (
      <button onClick={onClick} className={`text-[12px] font-bold transition-all duration-300 rounded-full py-1.5 px-3.5 tracking-wide ${active ? 'bg-transparent text-[#00A8E8] border border-transparent shadow-[inset_0_0_20px_rgba(0,168,232,0.35)]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'}`}>
        {label}
      </button>
    );
  };

  const priceStr = livePrice != null
    ? (livePrice >= 1 ? livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : livePrice.toPrecision(4))
    : null;

  return (
    <div className="w-full mx-auto flex flex-col h-full relative overflow-visible">

      {/* Header section exactly as reference */}
      <div className="flex justify-between items-start w-full mb-8">
        <div className="relative" ref={pickerRef}>
          <button onClick={() => setPickerOpen((o) => !o)} className="flex items-center gap-4 group">
            <TokenLogo sym={token.sym} size={48} className="border border-slate-200 dark:border-white/5" />
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[16px] font-bold tracking-tight mb-0.5 text-slate-900 dark:text-white">{token.name} Market</h3>
                <CaretDown size={12} weight="bold" className={`text-slate-400 dark:text-white/40 transition-transform mt-[-2px] ${pickerOpen ? 'rotate-180' : ''}`} />
              </div>
              <span className="text-[12px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-widest">{token.sym} / USD</span>
            </div>
          </button>

          {pickerOpen && (
            <div className={`absolute top-full left-0 mt-2 w-[220px] max-h-[320px] overflow-y-auto rounded-xl border shadow-lg z-50 ${theme === 'dark' ? 'bg-[#0F141A] border-white/10' : 'bg-white border-[#EAECEF]'}`}>
              {VAULT_WATCH_TOKENS.map((t) => (
                <button
                  key={t.sym}
                  onClick={() => { setActiveSym(t.sym); setPickerOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${t.sym === activeSym ? 'bg-[#00A8E8]/10' : theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}
                >
                  <TokenLogo sym={t.sym} size={22} />
                  <div className="flex flex-col">
                    <span className={`text-[13px] font-bold ${t.sym === activeSym ? 'text-[#00A8E8]' : theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{t.sym}</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-white/40">{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-1 items-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 p-1 rounded-full shadow-sm dark:shadow-none">
          {(['1H', '1D', '1W', '1M', 'ALL'] as const).map(interval => (
            <FilterButton key={interval} label={interval} active={activeInterval === interval} onClick={() => setActiveInterval(interval)} />
          ))}
        </div>
      </div>

      {/* Massive Price section */}
      <div className="flex flex-col mb-2">
        <span className="text-[44px] leading-none font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
          {priceStr ? `$${priceStr}` : "..."}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[13px] font-bold flex items-center gap-1 ${priceChange24h && priceChange24h >= 0 ? 'text-[#10B981]' : 'text-red-500'}`}>
            {priceChange24h && priceChange24h >= 0 ? '▲' : '▼'} {priceChange24h ? Math.abs(priceChange24h).toFixed(2) : "..."}%
            <span className="text-[12px] ml-1 text-slate-500 dark:text-white/60 font-medium">(24h)</span>
          </span>
          {priceSource && (
            <span
              className="text-[10px] font-semibold text-amber-500/80"
              title={token.sym === 'HBAR'
                ? 'Pyth feed went quiet for 10s+ — showing a live exchange price instead'
                : 'Binance feed went quiet — showing a backup price instead'}
            >
              via {priceSource === 'binance' ? 'Binance' : priceSource === 'pyth' ? 'Pyth' : 'Bybit'} (fallback)
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full flex-1 min-h-[240px] mt-2 mb-6"><div ref={chartContainerRef} className="absolute inset-0" /></div>

      {/* Bottom Stats Footer */}
      <div className="bg-slate-50 dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between mt-auto dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]">
        <div className="flex flex-col text-left flex-1 pl-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Market Cap</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{marketCap || "—"}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">{token.sym === 'HBAR' ? 'Vault TVL' : '24h Volume'}</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{token.sym === 'HBAR' ? '24.58M HBAR' : (volume24h || '—')}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Circulating Supply</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{circSupply || "—"}</span>
        </div>
        <div className="w-px h-8 bg-[#EAECEF] dark:bg-white/10"></div>
        <div className="flex flex-col text-left flex-1 pl-6">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40 mb-1">Rank</span>
          <span className="text-[13px] font-bold text-slate-900 dark:text-white/90">{marketCapRank || "—"}</span>
        </div>
      </div>
    </div>
  );
};
