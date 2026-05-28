/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React from 'react';
import { Bell } from '@phosphor-icons/react';
import { Logo } from './Logo';
import CustomWalletButton from './CustomWalletButton';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, activeTab, setActiveTab }) => {
  return (
    <header className="w-full pt-0 pb-4 mb-10 sticky top-0 z-50 bg-transparent transition-all duration-500 border-b border-black/5 dark:border-white/5 outline-none">
      <nav className="w-full max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        
        {/* LEFT COLUMN: Empty space for right-alignment */}
        <div className="flex-1"></div>

        {/* RIGHT COLUMN: Controls and Wallet */}
        <div className="flex-1 flex items-center justify-end gap-4">
          {activeTab !== 'Home' && (
            <button 
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/5 bg-transparent hover:bg-white/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} color="white" />
            </button>
          )}
          {activeTab !== 'Home' && (
            <div>
              <CustomWalletButton theme={theme} />
            </div>
          )}
        </div>

      </nav>
    </header>
  );
};
