/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React from 'react';
import CustomWalletButton from './CustomWalletButton';
import { Sun, Moon } from '@phosphor-icons/react';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center gap-4">
      <button 
        onClick={toggleTheme}
        className={`relative flex items-center justify-center h-[38px] w-[38px] rounded-full transition-all duration-300 border active:scale-95 ${
          theme === 'dark'
            ? "bg-[#04080F] border-[#1A2332] hover:bg-white/5 text-[#00A8E8]"
            : "bg-white border-slate-200 shadow-sm hover:bg-slate-50 text-[#00A8E8]"
        }`}
        aria-label="Toggle Theme"
      >
        {theme === 'dark' ? (
          <Moon size={20} weight="fill" className="text-[#00A8E8]" />
        ) : (
          <Sun size={20} weight="fill" className="text-[#00A8E8]" />
        )}
      </button>

      {/* Wallet Button */}
      <div>
        <CustomWalletButton theme={theme} />
      </div>
    </div>
  );
};
