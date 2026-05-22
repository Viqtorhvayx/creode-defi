"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Restored Stable Edition)
 * Description: High-reliability inline wallet interface with real-time identity resolution.
 * Features: Inline balance display, glowing status beacon, and hardened disconnect functionality.
 */

import React from 'react';
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

  /**
   * Hardened Disconnect with propagation suppression
   */
  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[CustomWalletButton] Disconnecting...");
    try {
      await disconnect();
    } catch (err) {
      console.error("[CustomWalletButton] Disconnect failed:", err);
    }
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) {
      connect();
    }
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleConnect}
      className={`transition-all duration-300 min-h-[40px] flex items-center justify-center cursor-pointer select-none rounded-xl border border-[#00A8E8]/10 font-bold hover:-translate-y-1 hover:shadow-md active:scale-95 px-6 py-2.5 ${
        !isConnected 
          ? "bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20" 
          : "bg-[#00A8E8]/10 text-[#00A8E8]"
      }`}
    >
      {!isConnected ? (
        <span className="text-[11px] tracking-wider">Connect Wallet</span>
      ) : (
        <div className="flex items-center gap-4">
          {/* Status & ID Group */}
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
            </span>
            <span className="font-mono text-[10px] tracking-tight text-[#00A8E8] font-bold">
              {accountId && accountId.length > 12 ? `${accountId.slice(0, 8)}...` : accountId}
            </span>
          </div>

          {/* Divider */}
          <div className="h-3 w-[1px] bg-[#00A8E8]/20"></div>

          {/* Inline Balance */}
          <div className="flex items-baseline space-x-1">
            <span className="text-[11px] font-black text-[#00A8E8]">{balance}</span>
            <span className="text-[8px] font-bold text-[#00A8E8]/60">{balanceSymbol}</span>
          </div>

          {/* Hardened Disconnect Button */}
          <button 
            onClick={handleDisconnect}
            className="p-1.5 rounded-lg bg-[#00A8E8]/5 hover:bg-red-500/10 text-[#00A8E8] hover:text-red-500 transition-all duration-300 group"
            title="Disconnect Wallet"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
