"use client";

/* UI Design & Implementation by Viqtorhvayx (GitHub: Viqtorhvayx) 
 * CREODE DApp 
 */
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

  const tabs = ['Home', 'Vault', 'Lend', 'Borrow'];

  return (
    <header className="w-full pt-4 pb-4 mb-10 sticky top-0 z-50 backdrop-blur-xl bg-white/5 dark:bg-black/5 transition-all duration-500 border-none outline-none">
      {/* INVISIBLE SCROLL BLUR: This wraps the whole top of the screen to blur charts on scroll, but has virtually no background color so it doesn't look like a box */}
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center w-full">
        
        {/* LEFT COLUMN: Logo */}
        <div className="flex-1 flex justify-start">
          <Logo theme={theme} />
        </div>

        {/* CENTER COLUMN: Tabs (WITH isolated glassmorphism and increased text size) */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-8 px-8 py-3 bg-white/10 dark:bg-black/40 backdrop-blur-2xl shadow-2xl rounded-2xl border-none outline-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-bold tracking-wide transition-all duration-300 ${
                  activeTab === tab
                    ? 'text-[#00A8E8] drop-shadow-[0_0_12px_rgba(0,168,232,0.8)]' 
                    : 'text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white' 
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Controls (Free floating, NO glassmorphism) */}
        <div className="flex-1 flex items-center justify-end gap-4">
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
          <CustomWalletButton theme={theme} />
        </div>

      </nav>
    </header>
  );
};
