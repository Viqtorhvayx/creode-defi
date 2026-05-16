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
import { PriceChart } from '../components/PriceChart';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { Footer } from '@/components/Footer';

export default function Dashboard() {
  const { balance, balanceSymbol } = useWallet();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMainTab, setActiveMainTab] = useState("Home");
  
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
      case 'Home':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-12">
            <div className="max-w-5xl mx-auto">
              <PriceChart theme={theme} />
            </div>
            <ActivityTable theme={theme} />
          </div>
        );
      case 'Vault':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 py-8">
            <LockingModule theme={theme} />
          </div>
        );
      case 'Lend':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 py-8">
            <LendingModule points={userPoints} theme={theme} />
          </div>
        );
      case 'Borrow':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 py-8">
            <BorrowingModule xp={userXP} theme={theme} />
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
