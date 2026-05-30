"use client";

// Developer: Viqtorhvayx (GitHub: Viqtorhvayx)
/* Component: Dashboard
 * Description: Main protocol dashboard refactored into a 4-tabbed architectural interface.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';

import { VaultTab } from '../components/VaultTab';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { Logo } from '../components/Logo';

import { Footer } from '@/components/Footer';

export default function Dashboard() {
  const { balance } = useWallet();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeMainTab, setActiveMainTab] = useState("Home");
  
  const userXP = 45; 
  const userPoints = 1250;

  useEffect(() => {
    const savedTheme = localStorage.getItem('creode-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (activeMainTab === 'Home') {
      // Force dark mode on landing page
      document.documentElement.classList.add('dark');
    } else {
      // Restore user theme preference when navigating away
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [activeMainTab, theme]);

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
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col items-center justify-center text-center min-h-[70vh] gap-10 py-16">
            
            {/* Ambient glow orb — authored by Viqtorhvayx */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00A8E8]/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Eyebrow tag */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#00A8E8] animate-pulse shadow-[0_0_8px_rgba(0,168,232,0.8)]" />
              <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#00A8E8]">Hedera DeFi Protocol</span>
            </div>

            {/* Hero Headline */}
            <div className="flex flex-col gap-4 max-w-4xl">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none text-black dark:text-white">
                The Future of<br />
                <span style={{ color: '#00A8E8' }} className="drop-shadow-[0_0_30px_rgba(0,168,232,0.4)]">
                  On-Chain Credit
                </span>
              </h1>
              <p className="text-lg md:text-xl font-medium text-black/40 dark:text-white/40 max-w-2xl mx-auto leading-relaxed">
                Lock assets, supply liquidity, and borrow with reputation-based credit limits — powered by the Creode identity engine on Hedera.
              </p>
            </div>

            {/* Protocol Stats row */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-16">
              {[
                { label: 'Total Value Locked', value: '$12.4M' },
                { label: 'Protocol Fees Generated', value: '$42.8K' },
                { label: 'Active Vault Positions', value: '1,284' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className="text-3xl md:text-4xl font-black text-black dark:text-white tracking-tight">{value}</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 dark:text-white/30">{label}</span>
                </div>
              ))}
            </div>

            {/* Launch App CTA — authored by Viqtorhvayx */}
            <button
              onClick={() => setActiveMainTab('Vault')}
              className="relative group mt-4 px-16 py-6 rounded-[20px] bg-[#00A8E8] text-white text-xl font-black uppercase tracking-[0.15em] shadow-[0_0_50px_rgba(0,168,232,0.5)] hover:shadow-[0_0_80px_rgba(0,168,232,0.8)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              {/* Inner shine */}
              <span className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <span className="relative z-10 flex items-center gap-4">
                Launch App
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            {/* Subtle disclaimer */}
            <p className="text-[11px] font-bold text-black/20 dark:text-white/20 tracking-widest uppercase">
              Powered by Creode Reputation Engine · Hedera Hashgraph
            </p>
          </div>
        );
      case 'Vault':
        return (
          <div className="py-8">
            <VaultTab theme={theme} />
          </div>
        );
      case 'Lend':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 py-8 flex justify-center">
            <div className="w-full max-w-2xl">
              <LendingModule points={userPoints} theme={theme} />
            </div>
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
    <div className="flex flex-col h-screen overflow-hidden bg-background transition-colors duration-500">
      
      {/* Top Header (Full Width) */}
      <header className="w-full flex items-center border-b border-black/5 dark:border-white/5 z-50 bg-background/80 backdrop-blur-md relative">
        {/* Left: Logo (aligned with Sidebar) */}
        <div className="w-[140px] flex items-center shrink-0 px-2 pt-6 pb-6 border-r border-black/5 dark:border-white/5">
          <div 
            className="cursor-pointer scale-[0.85] origin-left"
            onClick={() => setActiveMainTab('Home')}
          >
            <Logo theme={theme} />
          </div>
        </div>

        {/* Right: Controls (aligned with main content) */}
        <div className="flex-1 flex justify-end px-6 md:px-12 lg:px-16 pt-6 pb-6">
          <Header 
            theme={theme} 
            toggleTheme={toggleTheme} 
            activeTab={activeMainTab}
            setActiveTab={setActiveMainTab}
          />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar */}
        <Sidebar 
          theme={theme}
          activeTab={activeMainTab}
          setActiveTab={setActiveMainTab}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
          <div className="px-6 md:px-12 lg:px-16 w-full flex-1">
            <div className="max-w-[1200px] mx-auto min-h-[600px] mt-8 w-full">
              {renderTabContent()}
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}
