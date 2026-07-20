"use client";

import React, { useState } from 'react';

// Bundled real token logos (public/tokens/*.png).
const FILES: Record<string, string> = {
  HBAR: 'hbar', WHBAR: 'hbar', USDC: 'usdc', USDT: 'usdt', SAUCE: 'sauce',
  DOVU: 'dovu', BONZO: 'bonzo', PACK: 'pack', JAM: 'jam', WETH: 'weth', WBTC: 'wbtc',
};

// Fallback colored monogram for anything without a bundled logo.
const FALLBACK: Record<string, { bg: string; label: string; fg?: string }> = {
  HBAR: { bg: '#000', label: 'ℏ' }, USDC: { bg: '#2775CA', label: '$' }, USDT: { bg: '#26A17B', label: '₮' },
  WBTC: { bg: '#F7931A', label: '₿' }, WETH: { bg: '#627EEA', label: 'Ξ' }, SAUCE: { bg: '#E1274B', label: 'S' },
  DOVU: { bg: '#11A67A', label: 'D' }, PACK: { bg: '#6C5CE7', label: 'P' }, JAM: { bg: '#E8202A', label: 'J' },
  BONZO: { bg: '#2B2F3A', label: 'B' },
};

interface Props { sym: string; size?: number; className?: string }

export const TokenLogo: React.FC<Props> = ({ sym, size = 24, className = '' }) => {
  const [errored, setErrored] = useState(false);
  const key = (sym || '').toUpperCase();
  const file = FILES[key];

  if (file && !errored) {
    return (
      <img
        src={`/tokens/${file}.png`}
        alt={sym}
        onError={() => setErrored(true)}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const fb = FALLBACK[key] || { bg: '#64748b', label: (sym || '?').charAt(0).toUpperCase() };
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, background: fb.bg, color: fb.fg || '#fff', fontSize: size * 0.5 }}
    >
      {fb.label}
    </div>
  );
};
