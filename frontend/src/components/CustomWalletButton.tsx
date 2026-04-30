"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton (Dropdown Rebuild)
 * Description: Premium wallet interface for CREODE dApp featuring native identity resolution and session management.
 * Implementation: Strictly follows the rebuild requirements for identity, balance, and dropdown state.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useBalance, useDisconnect, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

export default function CustomWalletButton() {
  // Wagmi & AppKit Hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const chainId = useChainId();

  // 1. State Management for the Dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 2. Data Hook: Fetch HBAR balance using Wagmi hook
  const { data: balanceData } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  /**
   * Hedera Mirror Node Identity Resolution
   * Credits: [Viqtorhvayx]
   */
  const resolveIdentity = useCallback(async () => {
    if (!isConnected || !address) {
      setResolvedId(null);
      return;
    }

    // Use .toLowerCase() to prevent the "ID UNRESOLVED" crash
    const cleanAddress = address.toLowerCase();
    const network = chainId === 295 ? 'mainnet' : 'testnet';
    const truncatedEVM = `${address.slice(0, 6)}...${address.slice(-4)}`;

    try {
      const response = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`);
      if (response.ok) {
        const data = await response.json();
        // If 0.0.x ID is found, use it; otherwise fallback to truncated EVM
        setResolvedId(data.account || truncatedEVM);
      } else {
        setResolvedId(truncatedEVM);
      }
    } catch (error) {
      console.error("[CustomWalletButton] Identity resolution failed:", error);
      setResolvedId(truncatedEVM);
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    resolveIdentity();
  }, [resolveIdentity]);

  // Click Logic as requested
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isConnected) {
      open();
    } else {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  // Disconnect Action: trigger disconnect, close dropdown, and clear data
  const handleDisconnectAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    disconnect();
    setIsDropdownOpen(false);
    setResolvedId(null);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // UI Formatting
  const formattedBalance = balanceData 
    ? `${Number(balanceData.formatted).toFixed(2)} ${balanceData.symbol}` 
    : "0.00 HBAR";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* The Main Button (Connected/Disconnected State) */}
      <button 
        id="custom-wallet-button"
        onClick={handleButtonClick} 
        className="bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[190px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 z-40"
      >
        {!isConnected ? (
          "Connect Wallet"
        ) : (
          <div className="flex items-center space-x-2 pointer-events-none">
            {/* Green status dot */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
            <span className="font-mono text-[10px] tracking-tight">
              {resolvedId ? (resolvedId.length > 12 ? `${resolvedId.slice(0, 8)}...` : resolvedId) : "Resolving..."}
            </span>
            <svg 
              className={`ml-1 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
              width="10" height="6" viewBox="0 0 10 6" fill="none"
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}
      </button>

      {/* 3. The Dropdown Menu (Tailwind CSS Dark Theme) */}
      {isConnected && isDropdownOpen && (
        <div className="absolute right-0 mt-3 w-[280px] bg-[#0c0d10]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-6">
            {/* Top Row: Wallet ID */}
            <div>
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Wallet ID:</p>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <p className="text-[11px] font-mono text-white font-medium break-all select-all">
                  {resolvedId || address}
                </p>
              </div>
            </div>

            {/* Middle Row: Balance */}
            <div>
              <p className="text-[9px] font-black text-[#00A8E8] uppercase tracking-[0.2em] mb-2 opacity-60">Balance:</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{formattedBalance.split(' ')[0]}</span>
                <span className="text-[10px] font-bold text-[#00A8E8]">{formattedBalance.split(' ')[1]}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/5 mb-5"></div>

            {/* Bottom Row: Disconnect Wallet Button */}
            <button 
              onClick={handleDisconnectAction}
              className="w-full flex items-center justify-between px-5 py-4 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all duration-300 active:scale-95 group shadow-lg shadow-red-500/10"
            >
              <div className="flex items-center space-x-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
                <span className="text-[11px] font-black uppercase tracking-widest">Disconnect Wallet</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse group-hover:bg-white"></span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
