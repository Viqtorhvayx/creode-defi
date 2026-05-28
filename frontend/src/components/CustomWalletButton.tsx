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
      className={`transition-all duration-300 flex items-center justify-center cursor-pointer select-none rounded-full border border-white/5 hover:bg-white/5 active:scale-95 px-2 py-1.5 ${
        !isConnected 
          ? "bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20 border-none hover:bg-[#0090C7]" 
          : "bg-[#0A0F16] text-white"
      }`}
    >
      {!isConnected ? (
        <span className="text-[12px] font-bold px-4 py-1">Connect Wallet</span>
      ) : (
        <div className="flex items-center gap-3 pr-2">
          {/* Circular Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#00A8E8] flex items-center justify-center shadow-[0_0_10px_rgba(0,168,232,0.3)]">
            <span className="text-white font-bold text-sm">C</span>
          </div>

          {/* Stacked Address & Mainnet */}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[12px] font-bold text-white tracking-tight">
              {accountId || "0.0.123456"}
            </span>
            <span className="text-[10px] font-medium text-white/50">
              Mainnet
            </span>
          </div>

          {/* Dropdown Arrow & Action */}
          <button 
            onClick={handleDisconnect}
            className="flex items-center justify-center text-white/40 hover:text-white transition-colors ml-1"
            title="Disconnect Wallet"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
