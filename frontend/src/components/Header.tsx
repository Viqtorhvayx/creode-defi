/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Clean Header
 */
"use client";

import React, { useState } from 'react';
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
      {/* Wallet Button */}
      <div>
        <CustomWalletButton theme={theme} />
      </div>
    </div>
  );
};
