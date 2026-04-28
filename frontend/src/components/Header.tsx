"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Logo } from './Logo';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * @title Header
 * @author Viqtorhvayx
 * @dev Navigation component with native Hedera address translation and smart truncation.
 */
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const { address, isConnected, connect, disconnect } = useWeb3();
  const [isToggling, setIsToggling] = useState(false);
  
  // 1. Address Translator State
  const [nativeAddress, setNativeAddress] = useState<string>("");

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  // 2. Mirror Node Fetch Logic
  useEffect(() => {
    const resolveNativeAddress = async () => {
      if (!address) {
        setNativeAddress("");
        return;
      }

      // If already in native format, update state directly
      if (address.startsWith("0.0.")) {
        setNativeAddress(address);
        return;
      }

      // If EVM format, translate via Hedera Mirror Node
      if (address.startsWith("0x")) {
        try {
          const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`);
          const data = await response.json();
          if (data.account) {
            setNativeAddress(data.account);
          } else {
            setNativeAddress(address); // Fallback to raw address
          }
        } catch (error) {
          console.error("Mirror Node fetch failed:", error);
          setNativeAddress(address); // Fallback on failure
        }
      }
    };

    resolveNativeAddress();
  }, [address]);

  /**
   * 3. Truncation and UI Rendering Logic
   * Credits: Viqtorhvayx
   */
  const formatDisplayAddress = (addr: string) => {
    if (!addr) return "";
    
    // Native Hedera Format: 0.0.123...789
    if (addr.startsWith("0.0.")) {
      const parts = addr.split('.');
      if (parts.length === 3 && parts[2].length > 6) {
        return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 3)}...${parts[2].substring(parts[2].length - 3)}`;
      }
      return addr;
    }
    
    // EVM Fallback: 0x1234...5678
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="mb-12">
      <nav className="flex justify-between items-center">
        <Logo theme={theme} />
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleThemeToggle}
            className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-90"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg 
                width="18" height="18" viewBox="0 0 24 24" 
                fill={isToggling ? "#00A8E8" : "none"} 
                stroke="#00A8E8" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="transition-all duration-300"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg 
                width="18" height="18" viewBox="0 0 24 24" 
                fill={isToggling ? "#00A8E8" : "none"} 
                stroke="#00A8E8" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="transition-all duration-300"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-[var(--border)]">
                  <div className="w-1.5 h-1.5 bg-[#00A8E8] rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-black/60 dark:text-white font-mono">
                    {formatDisplayAddress(nativeAddress || address || "")}
                  </span>
                </div>
                <button 
                  onClick={disconnect}
                  className="text-[9px] font-black text-red-500 uppercase hover:underline tracking-wider"
                >
                  Exit
                </button>
              </div>
            ) : (
              <button 
                onClick={connect}
                className="btn-action !px-4 !py-2 !text-xs shadow-[0_4px_15px_rgba(0,168,232,0.15)]"
                style={{ borderRadius: '60px' }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};
