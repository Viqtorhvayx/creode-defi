/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React, { useState } from 'react';
import { Logo } from './Logo';
import CustomWalletButton from './CustomWalletButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  const tabs = ['Vault', 'Lend', 'Borrow'];

  return (
    <header className="w-full pt-2 pb-4 mb-10 sticky top-0 z-50 bg-transparent transition-all duration-500 border-none outline-none">
      <nav className="w-full max-w-[1440px] mx-auto px-4 md:px-8 flex justify-between items-center">
        
        {/* LEFT COLUMN: Clickable Logo */}
        <div 
          className="flex-1 flex justify-start cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setActiveTab('Home')}
        >
          <Logo theme={theme} />
        </div>

        {/* CENTER COLUMN: Navigation tabs (hidden on Home) */}
        <div className="flex-1 flex justify-center">
          {activeTab !== 'Home' && (
            <div className="flex items-center gap-2 p-1.5 rounded-2xl border-none outline-none">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-bold tracking-wide transition-all duration-300 rounded-xl ${
                    activeTab === tab
                      ? 'bg-[#00A8E8] text-white shadow-md' 
                      : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10' 
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Controls and Wallet */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {activeTab !== 'Home' && (
            <button 
              onClick={handleThemeToggle}
              className="p-2 bg-transparent rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-90 border-none outline-none"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill={isToggling ? "#00A8E8" : "none"} stroke="#00A8E8" strokeWidth="2">
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
          )}
          {activeTab !== 'Home' && (
            <CustomWalletButton theme={theme} />
          )}
        </div>

      </nav>
    </header>
  );
};
