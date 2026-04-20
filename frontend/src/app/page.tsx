"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { Logo } from '../components/Logo';

/**
 * @title Dashboard
 * @author Viqtorhvayx
 * @dev Main dashboard for CREODE Protocol with Reown AppKit integration.
 */
export default function Dashboard() {
  const { address, isConnected, connect, disconnect, balance, walletType } = useWeb3();
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
        {/* Navigation Bar */}
        <nav className="flex justify-between items-center mb-16">
          <Logo />
          <button 
            onClick={toggleTheme}
            className="p-3 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-300 active:scale-90"
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        </nav>

        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-black dark:text-white">
              CREODE
            </h1>
            <p className="text-[11px] font-bold text-black/40 dark:text-white/40 uppercase tracking-[0.3em] mt-2">
              Structured Credit Infrastructure
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex flex-col items-end animate-in fade-in slide-in-from-right duration-500">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-black/60 dark:text-white/60 truncate max-w-[120px]">
                    {address}
                  </span>
                  <span className="text-[10px] font-black text-white bg-accent-blue px-2 py-0.5 rounded-md uppercase">
                    {walletType}
                  </span>
                </div>
                <button 
                  onClick={disconnect}
                  className="text-[10px] font-bold text-red-500 uppercase mt-2 hover:underline tracking-wider"
                >
                  Terminate Session
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={connect}
                  className="btn-primary"
                >
                  Connect Wallet
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="industrial-panel bg-white dark:bg-[#003459]">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase mb-1">Vault Liquidity</h4>
            <div className="text-2xl font-bold text-black dark:text-white">{Number(balance).toFixed(2)} <span className="text-sm font-medium text-black/30 dark:text-white/30">HBAR</span></div>
          </div>
          <div className="industrial-panel bg-white dark:bg-[#003459]">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase mb-1">Standard Yield</h4>
            <div className="text-2xl font-bold text-accent-blue">0.30% <span className="text-sm font-medium text-black/30 dark:text-white/30">/21d</span></div>
          </div>
          <div className="industrial-panel bg-white dark:bg-[#003459] lg:col-span-2">
            <h4 className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase mb-1">Network Report</h4>
            <div className="text-[11px] font-bold text-black/60 dark:text-white/60 leading-relaxed uppercase tracking-wider">
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
        <footer className="mt-24 border-t border-black/5 dark:border-white/5 pt-12 pb-24 flex flex-col items-center gap-6">
          <p className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-[0.4em]">
            Built by Team
          </p>
          <div className="flex gap-4">
            <a 
              href="https://x.com/creode" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-black/40 dark:text-white/40 hover:text-accent-blue transition-colors duration-300"
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
