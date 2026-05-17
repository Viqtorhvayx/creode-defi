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

// Notice we added activeTab and setActiveTab to the props here!
export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleThemeToggle = () => {
    setIsToggling(true);
    toggleTheme();
    setTimeout(() => setIsToggling(false), 300);
  };

  const tabs = ['Home', 'Vault', 'Lend', 'Borrow'];

  return (
    <header className="w-full py-4 mb-10 border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 flex justify-between items-center w-full">
        
        {/* LEFT COLUMN: Logo */}
        <div className="flex-1 flex justify-start">
          <Logo theme={theme} />
        </div>

        {/* CENTER COLUMN: Text-Only Navigation */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[#00A8E8] text-white shadow-[0_0_20px_rgba(0,168,232,0.4)]'
                    : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Controls */}
        <div className="flex-1 flex items-center justify-end gap-4">
          <button 
            onClick={handleThemeToggle}
            className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-all duration-300 active:scale-90"
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
          <CustomWalletButton theme={theme} />
        </div>

      </nav>
    </header>
  );
};
