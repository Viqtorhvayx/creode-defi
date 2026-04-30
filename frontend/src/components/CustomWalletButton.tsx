"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Specialized wallet button integrated with the Advanced Identity Engine.
 * Dynamically switches between Hedera native (0.0.x) and EVM (0x...) formats.
 */

import React from 'react';
import { useWallet } from '../context/WalletContext';

export default function CustomWalletButton({ theme }: { theme?: 'light' | 'dark' }) {
  const { 
    isConnected, 
    accountId, 
    evmAddress, 
    walletType, 
    balance, 
    balanceSymbol, 
    connect, 
    disconnect 
  } = useWallet();

  // Determine display address based on wallet type requirements
  const displayAddress = walletType === 'hashpack' ? accountId : evmAddress;
  
  // Truncate EVM address for UI cleanliness, but keep HashPack ID full if possible
  const truncatedDisplay = (displayAddress && walletType === 'evm') 
    ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
    : displayAddress;

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect();
  };

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => !isConnected && connect()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[170px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : (
        <div className="flex items-center space-x-3 w-full justify-between">
          {/* Section 1: Identity (Native 0.0.x or Truncated 0x) */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
            <span className="font-mono text-[10px] tracking-tight">{truncatedDisplay}</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-3 bg-white/20"></div>

          {/* Section 2: Balance */}
          <div className="flex items-center">
            <span className="font-bold text-[10px] whitespace-nowrap">{balance} {balanceSymbol}</span>
          </div>

          {/* Section 3: Disconnect Action */}
          <div 
            onClick={handleDisconnect}
            className="p-1 hover:bg-white/20 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-center ml-1"
            title="Disconnect Wallet"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
