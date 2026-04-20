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
 * @dev Main dashboard for CREODE Protocol. Enforces explicit color logic for stats via theme detection.
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

  // Explicit color detection for primary stats
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <main className="min-h-screen bg-background pt-4 pb-12 px-6 md:pt-6 md:px-12 lg:pt-8 lg:px-16 transition-colors duration-500">
      <div className="max-w-7xl mx-auto">
        <Header theme={theme} toggleTheme={toggleTheme} />

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {/* VAULT LIQUIDITY Section - Explicit theme-detected inline styles */}
          <div className="industrial-panel">
            <h4 
              className="text-[10px] font-bold uppercase mb-1"
              style={{ color: primaryTextColor }}
            >
              Vault Liquidity
            </h4>
            <div 
              className="text-2xl font-bold"
              style={{ color: primaryTextColor }}
            >
              {Number(balance).toFixed(2)} 
              <span className="text-sm font-medium ml-1" style={{ color: primaryTextColor }}>
                HBAR
              </span>
            </div>
          </div>
          
          {/* STANDARD YIELD Section - Explicit theme-detected inline styles for labels */}
          <div className="industrial-panel">
            <h4 
              className="text-[10px] font-bold uppercase mb-1"
              style={{ color: primaryTextColor }}
            >
              Standard Yield
            </h4>
            <div className="text-2xl font-bold !text-[#00A8E8]">
              0.30% 
              <span 
                className="text-sm font-medium ml-1" 
                style={{ color: primaryTextColor }}
              >
                /21d
              </span>
            </div>
          </div>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: XP & Control */}
          <div className="lg:col-span-4 space-y-8">
            <XPGauge xp={userXP} />
            
            <div className="industrial-panel bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20">
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
          <p className="text-[10px] font-bold uppercase tracking-[0.4em]" style={{ color: primaryTextColor }}>
            Built by Team
          </p>
          <div className="flex gap-4">
            <a 
              href="https://x.com/creode" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[#00A8E8] transition-colors duration-300"
              style={{ color: primaryTextColor }}
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
