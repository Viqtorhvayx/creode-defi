"use client";

/* * Developer: [Viqtorhvayx]
 * Component: Dashboard
 * Description: Main protocol dashboard refactored into a 4-tabbed architectural interface.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Header } from '../components/Header';
import { Navigation } from '../components/Navigation';
import { ActivityTable } from '../components/ActivityTable';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { Footer } from '@/components/Footer';

export default function Dashboard() {
  const { balance, balanceSymbol } = useWallet();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMainTab, setActiveMainTab] = useState("Dashboard");
  
  const userXP = 45; 
  const userPoints = 1250;

  useEffect(() => {
    const savedTheme = localStorage.getItem('creode-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('creode-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const matchedDarkIntensity = 'rgba(255, 255, 255, 0.6)';
  const secondaryLabelColor = theme === 'dark' ? matchedDarkIntensity : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const renderTabContent = () => {
    switch (activeMainTab) {
      case 'Dashboard':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="industrial-panel bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20">
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-4 opacity-70">
                  Protocol Status
                </h3>
                <p className="text-lg font-medium leading-relaxed">
                  CREODE is operating at peak efficiency. All smart contracts are verified and synchronized with the Hedera Testnet.
                </p>
              </div>
              <div className="industrial-panel">
                <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: secondaryLabelColor }}>
                  Wallet Balance
                </h4>
                <div className="text-3xl font-black" style={{ color: primaryTextColor }}>
                  {balance} 
                  <span className="text-sm font-medium ml-2 opacity-50">{balanceSymbol}</span>
                </div>
              </div>
            </div>
            <ActivityTable theme={theme} />
          </div>
        );
      case 'Vault':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LockingModule theme={theme} />
          </div>
        );
      case 'Lend':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
            <LendingModule points={userPoints} theme={theme} />
          </div>
        );
      case 'Borrow':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4">
              <XPGauge xp={userXP} theme={theme} />
            </div>
            <div className="lg:col-span-8">
              <BorrowingModule xp={userXP} theme={theme} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <main className="flex-grow min-h-screen bg-background pt-4 pb-12 px-6 md:pt-6 md:px-12 lg:pt-8 lg:px-16 transition-colors duration-500">
        <div className="max-w-7xl mx-auto">
          <Header theme={theme} toggleTheme={toggleTheme} />
          
          <Navigation 
            activeTab={activeMainTab} 
            setActiveTab={setActiveMainTab} 
            theme={theme} 
          />

          <div className="min-h-[600px]">
            {renderTabContent()}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
