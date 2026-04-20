"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Header } from '../components/Header';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';

/**
 * @title Dashboard
 * @author Viqtorhvayx
 * @dev Main dashboard for CREODE Protocol with persistent accent blue highlights.
 */
export default function Dashboard() {
  const { balance } = useWeb3();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Simulated XP and Points
  const userXP = 45; 
  const userPoints = 1250;

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('creode-theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('creode-theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 lg:p-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <Header theme={theme} toggleTheme={toggleTheme} />

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="industrial-panel">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white uppercase mb-1">Vault Liquidity</h4>
            <div className="text-2xl font-bold text-black dark:text-white">
              {Number(balance).toFixed(2)} <span className="text-sm font-medium text-black/30 dark:text-white/40">HBAR</span>
            </div>
          </div>
          <div className="industrial-panel">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white uppercase mb-1">Standard Yield</h4>
            <div className="text-2xl font-bold !text-[#00A8E8]">
              0.30% <span className="text-sm font-medium text-black/30 dark:text-white/40">/21d</span>
            </div>
          </div>
          <div className="industrial-panel lg:col-span-2">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white uppercase mb-1">Network Report</h4>
            <div className="text-[11px] font-bold text-black/60 dark:text-white leading-relaxed uppercase tracking-wider">
              Environment: Hedera Testnet // Oracle Service: Active // Gateway: Reown AppKit
            </div>
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: XP & Control */}
          <div className="lg:col-span-4 space-y-8">
            <XPGauge xp={userXP} />
            
            <div className="industrial-panel bg-accent-blue text-white shadow-lg shadow-accent-blue/20">
              <h3 className="text-[11px] font-bold uppercase tracking-wider mb-4 opacity-60">System Notification</h3>
              <p className="text-sm font-medium leading-relaxed">
                Reputation scoring is calculated every 24 hours. Maintaining high XP unlocks prioritized credit lines and reduced collateral requirements.
              </p>
            </div>
          </div>

          {/* Right Column: Functional Modules */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <LockingModule />
            </div>
            <LendingModule points={userPoints} />
            <BorrowingModule xp={userXP} />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 border-t border-[var(--border)] pt-12 pb-24 flex flex-col items-center gap-6">
          <p className="text-[10px] font-bold text-black/30 dark:text-white uppercase tracking-[0.4em]">
            Built by Team
          </p>
          <div className="flex gap-4">
            <a 
              href="https://x.com/creode" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black/40 dark:text-white hover:text-accent-blue transition-colors duration-300"
            >
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
