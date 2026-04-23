"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Header } from '../components/Header';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { PriceChart } from '../components/PriceChart';

/**
 * @title Dashboard
 * @author Viqtorhvayx
 * @dev Main dashboard for CREODE Protocol. Aligned Price Chart baseline with Lending Module.
 */
export default function Dashboard() {
  const { balance } = useWeb3();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Simulated XP and Points
  const userXP = 45; 
  const userPoints = 1250;

  // Theme management: Defaulting to Dark for premium state-of-the-art experience
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

  return (
    <main className="min-h-screen bg-background pt-4 pb-12 px-6 md:pt-6 md:px-12 lg:pt-8 lg:px-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <Header theme={theme} toggleTheme={toggleTheme} />

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          <div className="industrial-panel">
            <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: secondaryLabelColor }}>
              Vault Liquidity
            </h4>
            <div className="text-2xl font-bold" style={{ color: primaryTextColor }}>
              {Number(balance).toFixed(2)} 
              <span className="text-sm font-medium ml-1" style={{ color: primaryTextColor }}>HBAR</span>
            </div>
          </div>
          
          <div className="industrial-panel flex flex-col items-start">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.05em] mb-1" style={{ color: secondaryLabelColor }}>
              Standard Yield
            </h4>
            <div className="text-[19px] font-black !text-[#10B981] leading-none tracking-[-0.015em] flex items-baseline">
              0.30%
              <span className="text-[9px] font-bold ml-1 tracking-tight" style={{ color: primaryTextColor }}>/21days</span>
            </div>
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: XP, System Notification & Price Chart */}
          <div className="lg:col-span-4 flex flex-col h-full">
            <div className="space-y-8 flex-grow">
              <XPGauge xp={userXP} theme={theme} />
              
              <div className="industrial-panel bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20">
                <h3 className="text-[11px] font-bold uppercase tracking-wider mb-4" style={{ color: theme === 'dark' ? matchedDarkIntensity : 'rgba(255, 255, 255, 0.6)' }}>
                  System Notification
                </h3>
                <p className="text-sm font-medium leading-relaxed">
                  Reputation scoring is calculated every 24 hours. Maintaining high XP unlocks prioritized credit lines and reduced collateral requirements.
                </p>
              </div>
            </div>

            {/* Integrated HBAR Market Chart: Precision-aligned to match Lending Pool height */}
            <div className="mt-8 h-[370px]">
              <PriceChart theme={theme} />
            </div>
          </div>

          {/* Right Column: Functional Modules */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <LockingModule theme={theme} />
            </div>
            <div className="h-[370px]">
              <LendingModule points={userPoints} theme={theme} />
            </div>
            <div className="h-[370px]">
              <BorrowingModule xp={userXP} theme={theme} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-[var(--border)] pt-12 pb-24 flex flex-col items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: primaryTextColor }}>Built by Team</p>
          <div className="flex gap-4">
            <a href="https://x.com/creode" target="_blank" rel="noopener noreferrer" className="hover:text-[#00A8E8] transition-colors duration-300" style={{ color: primaryTextColor }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
