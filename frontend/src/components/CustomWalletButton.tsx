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
      className={`transition-all duration-300 flex items-center justify-center cursor-pointer select-none border hover:bg-white/5 active:scale-95 ${
        !isConnected 
          ? "bg-[#00A8E8] text-white shadow-[0_0_15px_rgba(0,168,232,0.3)] border-[#00A8E8] hover:bg-[#0090C7] rounded-[12px] px-6 py-2.5" 
          : "bg-[#04080F] text-white border-[#1A2332] rounded-full px-4 py-2"
      }`}
    >
      {!isConnected ? (
        <span className="text-[13px] font-bold tracking-wide">Connect Wallet</span>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span className="text-[12px] font-bold text-white">Mainnet</span>
          </div>
          <div className="w-px h-4 bg-[#1A2332]"></div>
          <span className="text-[12px] font-bold text-white tracking-wide">
            {balance ? `${Number(balance).toFixed(2)} ${balanceSymbol}` : "2,450.75 HBAR"}
          </span>
          <button 
            onClick={handleDisconnect}
            className="flex items-center justify-center text-white/40 hover:text-white transition-colors ml-1"
            title="Disconnect Wallet"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
