"use client";

import React from 'react';
import { formatPrice } from '../lib/market';
import type { MarketPair } from '../lib/market';
import type { OpenOrder } from '../lib/p2p';

interface Level { price: number; size: number; total: number }

// Aggregate resting orders into price levels (size is in BASE units).
function levels(orders: OpenOrder[], side: 'Short' | 'Long'): Level[] {
  const m = new Map<number, number>();
  for (const o of orders) {
    if (o.side !== side || o.price <= 0) continue;
    const baseSize = side === 'Short' ? o.sellRemaining : o.buyRemaining;
    m.set(o.price, (m.get(o.price) || 0) + baseSize);
  }
  const arr = [...m.entries()].map(([price, size]) => ({ price, size, total: 0 }));
  arr.sort((a, b) => (side === 'Short' ? a.price - b.price : b.price - a.price)); // best first
  let run = 0;
  for (const l of arr) { run += l.size; l.total = run; }
  return arr;
}

interface Props {
  orders: OpenOrder[];
  pair: MarketPair;
  theme: 'light' | 'dark';
  lastPrice: number;
  onPickPrice: (price: number) => void;
}

const ROWS = 9;

export const OrderBook: React.FC<Props> = ({ orders, pair, theme, lastPrice, onPickPrice }) => {
  const dark = theme === 'dark';
  const textMuted = dark ? 'text-white/50' : 'text-slate-500';
  const textMain = dark ? 'text-white' : 'text-slate-900';

  const asks = levels(orders, 'Short').slice(0, ROWS); // maker sells base -> asks
  const bids = levels(orders, 'Long').slice(0, ROWS);  // maker buys base -> bids
  const maxTotal = Math.max(1, ...asks.map((l) => l.total), ...bids.map((l) => l.total));

  const bestAsk = asks[0]?.price ?? 0;
  const bestBid = bids[0]?.price ?? 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestAsk && bestBid ? (spread / bestAsk) * 100 : 0;

  const Row: React.FC<{ l: Level; kind: 'ask' | 'bid' }> = ({ l, kind }) => {
    const color = kind === 'ask' ? '#ff5353' : '#00c076';
    const bar = `${(l.total / maxTotal) * 100}%`;
    return (
      <button
        onClick={() => onPickPrice(l.price)}
        className="relative w-full grid grid-cols-3 items-center px-4 h-[26px] text-[12px] font-semibold tabular-nums hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        title="Click to use this price"
      >
        <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: bar, background: kind === 'ask' ? 'rgba(255,83,83,0.10)' : 'rgba(0,192,118,0.10)' }} />
        <span className="text-left z-10" style={{ color }}>{formatPrice(l.price)}</span>
        <span className={`text-right z-10 ${textMain}`}>{l.size.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
        <span className={`text-right z-10 ${textMuted}`}>{l.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
      </button>
    );
  };

  const empty = asks.length === 0 && bids.length === 0;

  return (
    <div className="flex-1 w-full flex flex-col min-h-0">
      {/* Column headers */}
      <div className={`grid grid-cols-3 px-4 pb-2 text-[11px] font-semibold ${textMuted}`}>
        <span className="text-left">Price ({pair.quote})</span>
        <span className="text-right">Size ({pair.base})</span>
        <span className="text-right">Total</span>
      </div>

      {empty ? (
        <div className={`flex-1 flex items-center justify-center text-[13px] ${textMuted}`}>
          No open orders on this market yet — place a limit order to start the book.
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 justify-center">
          {/* Asks: highest at top, best ask just above the spread */}
          <div className="flex flex-col justify-end">
            {[...asks].reverse().map((l) => <Row key={`a${l.price}`} l={l} kind="ask" />)}
          </div>

          {/* Spread / last price */}
          <div className={`flex items-center justify-between px-4 py-2 my-1 border-y ${dark ? 'border-white/5' : 'border-slate-100'}`}>
            <span className="text-[16px] font-bold tabular-nums" style={{ color: lastPrice && bestBid && lastPrice >= bestBid ? '#00c076' : '#ff5353' }}>
              {lastPrice ? formatPrice(lastPrice) : '—'}
            </span>
            <span className={`text-[11px] font-semibold ${textMuted}`}>
              Spread {spread ? `${formatPrice(spread)} (${spreadPct.toFixed(2)}%)` : '—'}
            </span>
          </div>

          {/* Bids: best bid on top */}
          <div className="flex flex-col">
            {bids.map((l) => <Row key={`b${l.price}`} l={l} kind="bid" />)}
          </div>
        </div>
      )}
    </div>
  );
};
