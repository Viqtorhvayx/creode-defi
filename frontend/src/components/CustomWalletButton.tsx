"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Dropdown Edition)
 * Description: Interactive wallet button with a multi-functional dropdown for account details and session management.
 * Implementation: Features auto-closing on outside click and strict identity resolution display.
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

  // Close dropdown when clicking outside
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

  const handleToggle = () => {
    if (isConnected) {
      setIsOpen(!isOpen);
    } else {
      connect();
    }
  };

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    disconnect();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Primary Trigger Button */}
      <button 
        id="custom-wallet-button"
        onClick={handleToggle} 
        className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[180px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
      >
        {!isConnected ? (
          "Connect Wallet"
        ) : (
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
            <span className="font-mono text-[10px] tracking-tight">{accountId?.slice(0, 8)}...</span>
            <svg 
              className={`ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* Interactive Dropdown Menu */}
      {isConnected && isOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[240px] z-[9999] animate-in fade-in slide-in-from-top-2 duration-300 transform-gpu">
          <div className="bg-black/60 dark:bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
            {/* Account Information */}
            <div className="mb-4">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Account Identity</p>
              <p className="text-[12px] font-mono text-white font-medium break-all">{accountId}</p>
            </div>

            {/* Balance Information */}
            <div className="mb-6">
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">Available Funds</p>
              <p className="text-lg font-black text-white flex items-baseline">
                {balance} <span className="text-[10px] ml-1 font-bold text-[#00A8E8]">{balanceSymbol}</span>
              </p>
            </div>

            <div className="h-[1px] w-full bg-white/5 mb-4"></div>

            {/* Disconnect Action */}
            <button 
              onClick={handleDisconnect}
              className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all duration-200 active:scale-[0.98] group"
            >
              <span className="text-[11px] font-bold uppercase tracking-widest">Disconnect</span>
              <svg 
                className="group-hover:translate-x-0.5 transition-transform duration-200"
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
