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
      className={`transition-all duration-300 min-h-[40px] flex items-center justify-center cursor-pointer select-none rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 px-4 py-2 ${
        !isConnected 
          ? "bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20 border-none hover:bg-[#0090C7]" 
          : "bg-white dark:bg-black/20 text-black dark:text-white"
      }`}
    >
      {!isConnected ? (
        <span className="text-[12px] font-bold">Connect Wallet</span>
      ) : (
        <div className="flex items-center gap-3">
          {/* Mainnet Tag */}
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            <span className="text-[11px] font-bold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
              Mainnet
            </span>
          </div>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10"></div>

          {/* Balance & Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-baseline space-x-1">
              <span className="text-[12px] font-bold">{balance}</span>
              <span className="text-[10px] font-bold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{balanceSymbol}</span>
            </div>
            
            <button 
              onClick={handleDisconnect}
              className="flex items-center justify-center text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors"
              title="Disconnect Wallet"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
