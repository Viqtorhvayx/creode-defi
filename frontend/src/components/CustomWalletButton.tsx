"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Ultimate Edition)
 * Description: High-reliability wallet interface with unmissable disconnect control.
 * Features: Immediate execution, state synchronization, and industrial-grade UX.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '../context/WalletContext';

export default function CustomWalletButton({ theme }: { theme?: 'light' | 'dark' }) {
  const { 
    isConnected, 
    accountId, 
    balance, 
    balanceSymbol, 
    connect, 
    disconnect 
  } = useWallet();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isConnected) {
      setIsOpen(!isOpen);
    } else {
      connect();
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event from bubbling to parent toggle
    
    console.log("[CustomWalletButton] User triggered disconnect.");
    setIsOpen(false); // Close UI immediately
    
    try {
      await disconnect();
      alert("Wallet Disconnected Successfully");
    } catch (err) {
      console.error("[CustomWalletButton] Disconnect failed:", err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Main UI Button */}
      <button 
        id="custom-wallet-button"
        onClick={handleToggle} 
        className="custom-wallet-glow bg-[#00A8E8] hover:bg-[#0092c8] text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[190px] text-[11px] uppercase tracking-wider shadow-lg shadow-[#00A8E8]/20 active:scale-95 select-none"
      >
        {!isConnected ? (
          "Connect Wallet"
        ) : (
          <div className="flex items-center space-x-2 w-full justify-between pointer-events-none">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
              </span>
              <span className="font-mono text-[10px] tracking-tight">
                {accountId && accountId.length > 12 ? `${accountId.slice(0, 8)}...` : accountId}
              </span>
            </div>
            <svg 
              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              width="10" height="6" viewBox="0 0 10 6" fill="none"
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* Industrial Dropdown Menu */}
      {isConnected && isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[280px] z-[99999] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Identity Info */}
            <div className="mb-5">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Account ID</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] font-mono text-white font-medium break-all select-all">{accountId}</p>
              </div>
            </div>

            {/* Balance Info */}
            <div className="mb-6">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Portfolio Balance</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">{balance}</span>
                <span className="text-[10px] font-bold text-[#00A8E8]">{balanceSymbol}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5 mb-5"></div>

            {/* CRITICAL: DISCONNECT BUTTON */}
            <button 
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between px-5 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-300 active:scale-95 group shadow-lg shadow-red-500/20"
            >
              <div className="flex items-center space-x-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span className="text-[12px] font-black uppercase tracking-widest">Disconnect</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
