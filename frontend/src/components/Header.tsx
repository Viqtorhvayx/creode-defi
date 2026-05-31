/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React, { useState } from 'react';
import { Sun, Moon } from '@phosphor-icons/react';
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
      {/* Theme Toggle Pill */}
      <button 
        onClick={toggleTheme}
        className={`relative flex items-center h-[28px] w-[52px] rounded-full p-1 transition-all duration-300 border ${
          theme === 'dark'
            ? 'bg-[#04080F] border-[#1A2332]'
            : 'bg-white border-slate-200 shadow-sm'
        }`}
        aria-label="Toggle Theme"
      >
        {/* Icons inside the pill */}
        <div className="flex w-full justify-between px-1.5 z-0">
          <Sun size={12} weight="fill" className={theme === 'dark' ? 'text-white/20' : 'text-amber-400'} />
          <Moon size={12} weight="fill" className={theme === 'dark' ? 'text-white' : 'text-slate-300'} />
        </div>

        {/* Sliding Thumb */}
        <div 
          className={`absolute top-[3px] left-[3px] w-[20px] h-[20px] rounded-full transition-transform duration-300 shadow-sm z-10 ${
            theme === 'dark' 
              ? 'translate-x-[24px] bg-[#00A8E8]' 
              : 'translate-x-0 bg-[#00A8E8]'
          }`}
        ></div>
      </button>

      {/* Wallet Button */}
      <div>
        <CustomWalletButton theme={theme} />
      </div>
    </div>
  );
};
