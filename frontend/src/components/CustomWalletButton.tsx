"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Refined Dropdown Edition)
 * Description: Premium interactive wallet control for CREODE Protocol.
 * Enforces native Hedera identity resolution and provides a sophisticated dropdown for account management.
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

  /**
   * Handle Outside Clicks
   */
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

  /**
   * Trigger Action
   */
  const handleToggle = () => {
    if (isConnected) {
      setIsOpen(!isOpen);
    } else {
      connect();
    }
  };

  /**
   * Disconnect Execution
   */
  const handleDisconnect = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setIsOpen(false);
      await disconnect();
    } catch (err) {
      console.error("[CustomWalletButton] Disconnect failed:", err);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Primary Connect/Status Button */}
      <button 
        id="custom-wallet-button"
        onClick={handleToggle} 
        className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[180px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 group"
      >
        {!isConnected ? (
          "Connect Wallet"
        ) : (
          <div className="flex items-center space-x-2 w-full justify-between">
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
              className={`ml-2 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* Industrial Dropdown Menu */}
      {isConnected && isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[260px] z-[9999] animate-in fade-in slide-in-from-top-2 duration-300 transform-gpu">
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
            {/* Header / ID Section */}
            <div className="mb-5">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2">Connected ID</p>
              <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                <p className="text-[11px] font-mono text-white font-medium break-all select-all">{accountId}</p>
              </div>
            </div>

            {/* Balance Section */}
            <div className="mb-6">
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2">Wallet Balance</p>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-black text-white">{balance}</span>
                <span className="text-[10px] font-bold text-white/60">{balanceSymbol}</span>
              </div>
            </div>

            {/* Action Section */}
            <div className="pt-2 border-t border-white/5">
              <button 
                onClick={handleDisconnect}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all duration-300 active:scale-[0.98] group"
              >
                <div className="flex items-center space-x-3">
                  <svg 
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span className="text-[11px] font-black uppercase tracking-[0.1em]">Disconnect</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              </button>
            </div>
          </div>
          
          {/* Subtle glow effect behind dropdown */}
          <div className="absolute -inset-1 bg-[#00A8E8]/5 blur-2xl -z-10 rounded-2xl"></div>
        </div>
      )}
    </div>
  );
}
