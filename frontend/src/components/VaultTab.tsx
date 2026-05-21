/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Flat Vault Tab with Integrated Chart
 */
"use client";

import React from 'react';
import { PriceChart } from './PriceChart';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SOLID MARKET CHART: Flat, premium integration */}
      <div className="w-full p-2 bg-white dark:bg-[#121212] rounded-[2.5rem] shadow-sm border border-black/5 dark:border-white/5">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-xl font-black text-black dark:text-white tracking-tight">HBAR Market Overview</h2>
          <p className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mt-1">Live On-Chain Data</p>
        </div>
        <PriceChart theme={theme} />
      </div>

      {/* The Lock Interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Flat Input Card */}
        <div className="p-8 bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-black/80 dark:text-white/80 mb-2">Lock HBAR</h3>
            <p className="text-sm text-black/40 dark:text-white/40">Secure your assets to earn protocol yield.</p>
          </div>

          <div className="relative w-full group">
            <input 
              type="number"
              placeholder="0.00"
              className="w-full h-24 bg-black/5 dark:bg-white/5 border-none rounded-2xl px-8 text-4xl font-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00A8E8]/50 transition-all duration-300"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3 bg-white dark:bg-[#1A1A1A] p-2 pl-4 rounded-xl shadow-sm">
              <button className="text-xs font-extrabold text-[#00A8E8] uppercase tracking-widest hover:opacity-80 transition-opacity">Max</button>
              <div className="w-px h-6 bg-black/10 dark:bg-white/10"></div>
              <span className="text-lg font-bold text-black/50 dark:text-white/50 pr-2">HBAR</span>
            </div>
          </div>

          {/* Custom Date Pickers */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Start Date</label>
              <input type="date" className="w-full p-4 bg-black/5 dark:bg-white/5 rounded-xl border-none text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00A8E8] transition-all" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Maturity Date</label>
              <input type="date" className="w-full p-4 bg-black/5 dark:bg-white/5 rounded-xl border-none text-sm font-bold text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00A8E8] transition-all" />
            </div>
          </div>

          {/* 5% Penalty Note */}
          <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-500/20 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
              Early withdrawal prior to your selected maturity date will incur a strict 5% penalty fee on your locked HBAR.
            </p>
          </div>

          <button className="w-full py-5 bg-[#00A8E8] text-white rounded-2xl text-lg font-black uppercase tracking-[0.1em] hover:bg-[#0090C7] hover:-translate-y-0.5 transition-all duration-300">
            Confirm Lock
          </button>
        </div>

        {/* Right Column: Flat Stats Card */}
        <div className="p-8 bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col justify-center items-center text-center">
          <div className="w-48 h-48 rounded-full border-[8px] border-black/5 dark:border-white/5 border-t-[#00A8E8] flex flex-col items-center justify-center mb-6 relative">
            <span className="text-sm font-bold text-black/40 dark:text-white/40 uppercase tracking-widest mb-1">Total Locked</span>
            <span className="text-3xl font-black text-black dark:text-white">0.00</span>
            <span className="text-sm font-bold text-[#00A8E8] mt-1">HBAR</span>
          </div>
          <p className="text-sm text-black/40 dark:text-white/40">Your current active locks and accumulated yield.</p>
        </div>

      </div>
    </div>
  );
};
