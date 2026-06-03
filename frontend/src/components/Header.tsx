/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React from 'react';
import CustomWalletButton from './CustomWalletButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center gap-4">
      {/* Theme Toggle Button */}
      <button 
        onClick={toggleTheme}
        className="relative flex items-center justify-center h-[36px] w-[36px] rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors duration-300 border border-transparent"
        aria-label="Toggle Theme"
      >
        <svg 
          width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          className={`transition-transform duration-500 ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
        >
          {/* Left half (blue) */}
          <path d="M12 2 A 10 10 0 0 0 12 22 Z" fill="#00A8E8" stroke="#00A8E8" strokeWidth="2" strokeLinejoin="round" />
          {/* Right half (white) */}
          <path d="M12 2 A 10 10 0 0 1 12 22 Z" fill="white" stroke="#00A8E8" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Wallet Button */}
      <div>
        <CustomWalletButton theme={theme} />
      </div>
    </div>
  );
};
