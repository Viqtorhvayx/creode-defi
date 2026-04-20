"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Logo } from './Logo';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * @title Header
 * @author Viqtorhvayx
 * @dev Navigation component with refined vertical alignment and explicit theme passing to Logo.
 */
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const { address, isConnected, connect, disconnect, walletType } = useWeb3();
  const [isToggling, setIsToggling] = useState(false);

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  const formatAddress = (addr: string | null, type: string | null) => {
    if (!addr) return "";
    if (type?.includes('hashpack') || addr.startsWith('0.0.')) return addr; 
    return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="mb-12">
      {/* Navigation Bar: Perfectly horizontally aligned and shifted up via reduced bottom margin */}
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
                    {formatAddress(address, walletType)}
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
                className="btn-action !px-4 !py-2 !text-xs shadow-lg shadow-[#00A8E8]/10"
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
