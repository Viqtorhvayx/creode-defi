"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { FaucetPanel } from './FaucetPanel';

export default function CustomWalletButton({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const { isConnected, balance, balanceSymbol, connect, disconnect } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
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
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-[#EAECEF]';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger (toggles dropdown) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        className="transition-all duration-300 flex items-center justify-center cursor-pointer select-none active:scale-95 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm dark:shadow-none rounded-[8px] px-4 py-1.5 hover:bg-black/10 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#00A8E8] flex items-center justify-center text-white font-bold text-[14px]">C</div>
          <div className="flex flex-col text-left">
            <span className={`text-[13px] font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              {displayBalance.replace(' HBAR', '')}
            </span>
            <span className={`text-[11px] font-medium leading-tight ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
              Testnet
            </span>
          </div>
          <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${theme === 'dark' ? 'text-white/40' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      <div
        className={`absolute right-0 mt-2 w-[300px] z-50 origin-top-right transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`${cardBg} border ${borderColor} rounded-[14px] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-4`}>
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
        </div>
      </div>
    </div>
  );
}
