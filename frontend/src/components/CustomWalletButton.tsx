"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Strict Modal Suppression Edition)
 * Description: High-reliability wallet interface with strict state-gated modal control.
 * Features: Guaranteed suppression of AppKit modal when connected, ensuring only the dropdown appears.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Strictly Gated Toggle Handler
   * Ensures the connection modal is NEVER triggered while a session is active.
   */
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`[CustomWalletButton] Triggered. isConnected: ${isConnected}`);

    if (isConnected) {
      // Logic: If already connected, only toggle the local dropdown. 
      // Do NOT trigger any external wallet modal.
      setIsOpen(prev => !prev);
    } else {
      // Logic: Only trigger connection flow if explicitly disconnected.
      connect();
    }
  }, [isConnected, connect]);

  /**
   * Hardened Disconnect
   */
  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsOpen(false);
    console.log("[CustomWalletButton] Disconnecting...");
    
    try {
      await disconnect();
    } catch (err) {
      console.error("[CustomWalletButton] Disconnect failed:", err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Main UI Button - Using a div with onClick to avoid any browser/library button behaviors */}
      <div 
        role="button"
        tabIndex={0}
        onClick={handleToggle} 
        className={`flex items-center justify-center min-w-[140px] h-10 py-2 px-4 font-bold transition-all duration-300 rounded-lg hover:-translate-y-1 active:scale-95 text-sm cursor-pointer select-none border border-transparent ${
          !isConnected 
            ? 'bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20' 
            : 'bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20'
        }`}
      >
        {!isConnected ? (
          "Connect Wallet"
        ) : (
          <div className="flex items-center justify-between w-full pointer-events-none space-x-3">
            {/* White Wallet Icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>

            {/* Wallet ID */}
            <span className="font-mono text-[10px] tracking-tight text-white flex-grow text-center">
              {accountId && accountId.length > 12 ? `${accountId.slice(0, 8)}...` : accountId}
            </span>

            {/* White Dropdown Icon */}
            <svg 
              className={`transition-transform duration-300 text-white ${isOpen ? 'rotate-180' : ''}`}
              width="10" height="6" viewBox="0 0 10 6" fill="none"
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Industrial Dropdown Menu */}
      {isConnected && isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[280px] z-[99999] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="mb-5">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Account ID</p>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-[11px] font-mono text-white font-medium break-all select-all">{accountId}</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Portfolio Balance</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">{balance}</span>
                <span className="text-[10px] font-bold text-[#00A8E8]">{balanceSymbol}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5 mb-5"></div>

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
