"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { useWeb3 } from '../context/Web3Context';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { LendingModule } from '../components/LendingModule';
import { BorrowingModule } from '../components/BorrowingModule';

/**
 * @title Dashboard
 * @author Viqtorhvayx
 * @dev Main dashboard for CREODE Protocol.
 */
export default function Dashboard() {
  const { address, isConnected, connectMetaMask, connectHashpack, disconnect, balance, walletType } = useWeb3();

  // Simulated XP and Points (These would come from the contract in production)
  const userXP = 45; 
  const userPoints = 1250;

  return (
    <main className="min-h-screen bg-background p-6 md:p-12 lg:p-16">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
              CREODE
            </h1>
            <p className="text-[11px] font-bold text-black/40 uppercase tracking-[0.2em] mt-2">
              Protocol Infrastructure
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 bg-black/5 px-4 py-2 rounded-xl border border-black/5">
                  <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse" />
                  <span className="text-[11px] font-bold text-black/60 truncate max-w-[120px]">
                    {address}
                  </span>
                  <span className="text-[10px] font-black text-white bg-black px-2 py-0.5 rounded-md uppercase">
                    {walletType}
                  </span>
                </div>
                <button 
                  onClick={disconnect}
                  className="text-[10px] font-bold text-red-500 uppercase mt-2 hover:underline tracking-wider"
                >
                  Terminate Connection
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={connectMetaMask}
                  className="btn-outline border-black/10 hover:border-accent-blue hover:text-accent-blue"
                >
                  Connect MetaMask
                </button>
                <button 
                  onClick={connectHashpack}
                  className="btn-primary"
                >
                  Connect Hashpack
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="industrial-panel bg-white">
            <h4 className="text-[10px] font-bold text-black/40 uppercase mb-1">Available Liquidty</h4>
            <div className="text-2xl font-bold text-black">{balance} <span className="text-sm font-medium text-black/30">HBAR</span></div>
          </div>
          <div className="industrial-panel bg-white">
            <h4 className="text-[10px] font-bold text-black/40 uppercase mb-1">Protocol Yield</h4>
            <div className="text-2xl font-bold text-accent-blue">0.30% <span className="text-sm font-medium text-black/30">/21d</span></div>
          </div>
          <div className="industrial-panel bg-white lg:col-span-2">
            <h4 className="text-[10px] font-bold text-black/40 uppercase mb-1">Status Report</h4>
            <div className="text-[11px] font-semibold text-black/60 leading-relaxed uppercase">
              Network: Hedera Testnet
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
        <footer className="mt-24 border-t border-black/5 pt-12 pb-24 flex flex-col items-center gap-6">
          <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.3em]">
            Built by Team
          </p>
          <a 
            href="https://x.com/creode" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-black/40 hover:text-accent-blue transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </footer>
      </div>
    </main>
  );
}
