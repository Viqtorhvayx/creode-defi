"use client";

import React from 'react';
import { useWallet } from '../context/WalletContext';

export default function CustomWalletButton({ theme = 'light' }: { theme?: 'light' | 'dark' }) {
  const { 
    isConnected, 
    balance, 
    balanceSymbol, 
    connect, 
    disconnect 
  } = useWallet();

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await disconnect();
    } catch (err) {
      console.error("Disconnect failed:", err);
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) {
      connect();
    }
  };

  const displayBalance = balance ? `${Number(balance).toFixed(2)} ${balanceSymbol}` : "0.0123456 HBAR";

  if (!isConnected) {
    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={handleConnect}
        className={`transition-all duration-300 flex items-center justify-center cursor-pointer select-none border hover:opacity-90 active:scale-95 ${
          theme === 'dark'
            ? "bg-[#00A8E8] text-white shadow-[0_0_15px_rgba(0,168,232,0.3)] border-[#00A8E8] rounded-full px-4 py-1.5" 
            : "bg-white text-slate-800 shadow-sm border-slate-200 rounded-full px-4 py-1.5"
        }`}
      >
        <span className="text-[12px] font-bold tracking-wide">Connect Wallet</span>
      </div>
    );
  }

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleConnect}
      className={`transition-all duration-300 flex items-center justify-center cursor-pointer select-none border active:scale-95 ${
        theme === 'dark'
          ? "bg-[#04080F] text-white border-[#1A2332] rounded-full px-4 py-2 hover:bg-white/5"
          : "bg-white border-slate-200 rounded-full px-3 py-1.5 shadow-sm hover:bg-slate-50"
      }`}
    >
      {theme === 'dark' ? (
        // Dark Mode: Inline Pill Layout
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span className="text-[12px] font-bold text-white">Mainnet</span>
          </div>
          <div className="w-px h-4 bg-[#1A2332]"></div>
          <span className="text-[12px] font-bold text-white tracking-wide">
            {displayBalance}
          </span>
          <button onClick={handleDisconnect} className="text-white/40 hover:text-white ml-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      ) : (
        // Light Mode: Stacked Avatar Layout
        <div className="flex items-center gap-3">
          {/* Circular Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#00A8E8] flex items-center justify-center text-white font-bold text-[14px]">
            C
          </div>
          
          {/* Stacked Text */}
          <div className="flex flex-col text-left">
            <span className="text-[13px] font-bold text-slate-900 leading-tight">
              {displayBalance.replace(' HBAR', '')}
            </span>
            <span className="text-[11px] font-medium text-slate-500 leading-tight">
              Mainnet
            </span>
          </div>

          <button onClick={handleDisconnect} className="text-slate-400 hover:text-slate-700 ml-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
