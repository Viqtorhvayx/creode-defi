"use client";

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet } from '@phosphor-icons/react';
import { useWallet } from '../context/WalletContext';
import { FaucetPanel } from './FaucetPanel';
import { CTA_BLUE } from '../lib/ui';

export default function CustomWalletButton({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const { isConnected, address, accountId, balance, balanceSymbol, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Panel is portalled to <body> so its backdrop-blur isn't killed by the
  // header's own backdrop-blur ancestor; track the trigger's viewport rect.
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const reposition = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 8, right: window.innerWidth - r.right });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [isOpen]);

  // Close the dropdown on outside click (trigger + portalled panel).
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current && ref.current.contains(t)) return;
      if (panelRef.current && panelRef.current.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsOpen(false);
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const displayBalance = balance ? `${Number(balance).toFixed(2)} ${balanceSymbol}` : '0.00 HBAR';

  if (!isConnected) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => connect()}
        className="transition-all duration-300 flex items-center justify-center cursor-pointer select-none border border-[#00A8E8] hover:bg-[#0090C7] active:scale-95 bg-[#00A8E8] text-white shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:shadow-[0_0_15px_rgba(0,168,232,0.3)] hover:shadow-[0_0_20px_#00A8E8] dark:hover:shadow-[0_0_25px_#00A8E8] rounded-[8px] px-5 py-2"
      >
        <span className="text-[13px] font-bold tracking-wide">Connect Wallet</span>
      </div>
    );
  }

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-[#EAECEF]';

  // Hedera Native ID (0.0.x); fall back to a truncated EVM address while it resolves.
  const walletLabel = accountId || (address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Connected');

  return (
    <div className="relative" ref={ref}>
      {/* Trigger (toggles dropdown) — CTA_BLUE: tinted at rest, solid on hover. */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        className={`${CTA_BLUE} flex items-center gap-2 px-4 py-2 cursor-pointer select-none active:scale-95`}
      >
        <Wallet size={17} weight="bold" />
        <span className="text-[13px] font-bold leading-none tabular-nums">{walletLabel}</span>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown — portalled to <body> so its backdrop-blur samples the real
          page behind it, not the header's own blurred layer. */}
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: coords.top, right: coords.right, zIndex: 60 }}
          className={`w-[300px] origin-top-right transition-all duration-200 border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-lg dark:shadow-none backdrop-blur-xl rounded-xl p-4 ${
            isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
          }`}
        >
          {/* Account summary */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className={`text-[11px] font-medium ${textMuted}`}>Balance</span>
              <span className={`text-[15px] font-bold ${textMain}`}>{displayBalance}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wide text-[#00A8E8] bg-[#00A8E8]/10 px-2 py-0.5 rounded-full">Hedera Testnet</span>
          </div>

          <div className={`border-t ${borderColor} my-3`} />

          {/* Faucet */}
          <FaucetPanel theme={theme} />

          <div className={`border-t ${borderColor} my-3`} />

          {/* Disconnect */}
          <button
            onClick={handleDisconnect}
            className={`w-full h-9 rounded-lg text-[12px] font-bold transition-colors border ${
              theme === 'dark'
                ? 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                : 'border-red-200 text-red-500 hover:bg-red-50'
            }`}
          >
            Disconnect
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
