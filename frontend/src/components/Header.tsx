"use client";

import React, { useState } from 'react';
import { Logo } from './Logo';
import CustomWalletButton from './CustomWalletButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * @title Header (v2.2 Force Update)
 * @author Viqtorhvayx
 * @dev Added v2.2 badge to verify that the browser is not serving a cached version.
 */
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  return (
    <header className="mb-12">
      <nav className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Logo theme={theme} />
          <span className="text-[9px] font-black bg-[#00A8E8]/10 text-[#00A8E8] px-1.5 py-0.5 rounded border border-[#00A8E8]/20 tracking-tighter">
            V2.2
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleThemeToggle}
            className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-90"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
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
            <CustomWalletButton />
          </div>
        </div>
      </nav>
    </header>
  );
};
