/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Side-by-Side Split Vault Tab
 */
"use client";

import React, { useState } from 'react';
import { PriceChart } from './PriceChart';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  const [lockDuration, setLockDuration] = useState<string>('');
  const [maturityDate, setMaturityDate] = useState<string | null>(null);

  const handleSetDuration = () => {
    const days = parseInt(lockDuration);
    if (!isNaN(days) && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setMaturityDate(date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
    } else {
      setMaturityDate(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP OVERVIEW ROW: Slim minimalist metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-[#121212] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 flex justify-between items-center transition-all hover:shadow-md">
          <div>
            <h4 className="text-black/50 dark:text-white/50 font-extrabold uppercase tracking-widest text-xs mb-1">Total Value Locked</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-black dark:text-white tracking-tighter">0.00</span>
              <span className="text-black/80 dark:text-white/80 font-bold text-sm">HBAR</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#00A8E8]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-[#121212] rounded-3xl shadow-sm border border-black/5 dark:border-white/5 flex justify-between items-center transition-all hover:shadow-md">
          <div>
            <h4 className="text-black/50 dark:text-white/50 font-extrabold uppercase tracking-widest text-xs mb-1">Active Positions</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-black dark:text-white tracking-tighter">0</span>
              <span className="text-black/50 dark:text-white/50 font-bold text-sm ml-1">Locks</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-[#10B981]/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
      </div>

      {/* 2. MAIN SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 3. LEFT COLUMN: Chart (Span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden flex flex-col transition-all hover:shadow-md min-h-[500px]">
          <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-black dark:text-white tracking-tight">Market Analytics</h2>
              <p className="text-xs font-bold text-[#00A8E8] uppercase tracking-widest mt-1">HBAR / USD</p>
            </div>
            <span className="px-3 py-1 bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 rounded-lg text-xs font-black tracking-wide">Live Data</span>
          </div>
          <div className="flex-1 p-2 h-full">
            <PriceChart theme={theme} />
          </div>
        </div>

        {/* 4. RIGHT COLUMN: Lock Engine (Span 5) */}
        <div className="lg:col-span-5 p-8 bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col gap-8 transition-all hover:shadow-md h-full justify-between">
          
          <div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-2">Create Lock</h3>
            <p className="text-black/50 dark:text-white/50 text-sm font-medium">Select your timeline and secure HBAR to generate protocol yield.</p>
          </div>

          <div className="flex-1 flex flex-col gap-8">
            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest">Deposit Amount</label>
              <div className="relative w-full group">
                <input 
                  type="number"
                  placeholder="0.00"
                  className="w-full h-20 bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl px-6 text-3xl font-black text-black dark:text-white focus:outline-none focus:border-[#00A8E8]/30 focus:bg-transparent transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-white dark:bg-[#1A1A1A] p-2 pl-5 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
                  <button className="text-xs font-black text-[#00A8E8] uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">Max</button>
                  <div className="w-px h-5 bg-black/10 dark:bg-white/10"></div>
                  <span className="text-base font-black text-black/80 dark:text-white/80 pr-2">HBAR</span>
                </div>
              </div>
            </div>

            {/* Lock Duration (Days) */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest">Lock Duration (Days)</label>
              <div className="flex gap-4">
                <input 
                  type="number"
                  placeholder="e.g. 30"
                  value={lockDuration}
                  onChange={(e) => setLockDuration(e.target.value)}
                  className="flex-1 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-transparent focus:border-[#00A8E8]/30 text-xl font-black text-black dark:text-white focus:outline-none focus:bg-transparent transition-all"
                />
                <button 
                  onClick={handleSetDuration}
                  className="px-8 bg-black/5 dark:bg-white/5 hover:bg-[#00A8E8] text-black dark:text-white hover:text-white rounded-2xl font-black uppercase tracking-widest transition-colors duration-300"
                >
                  Set
                </button>
              </div>
              <div className="pt-2 px-1 flex items-center gap-2">
                <span className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Maturity Date:</span>
                <span className={`text-sm font-black ${maturityDate ? 'text-[#00A8E8]' : 'text-black/20 dark:text-white/20'}`}>
                  {maturityDate || 'Not Set'}
                </span>
              </div>
            </div>

            {/* Warning & Submit */}
            <div className="space-y-6 pt-2 mt-auto">
              <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 flex gap-3 items-start">
                <div className="p-1.5 bg-red-100 dark:bg-red-500/20 rounded-lg shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 font-bold leading-relaxed pt-0.5">
                  Early withdrawal before your selected maturity date triggers a strict 5% penalty fee on your locked principal.
                </p>
              </div>

              <button className="w-full py-5 bg-[#00A8E8] text-white rounded-2xl text-lg font-black uppercase tracking-[0.15em] hover:bg-[#0090C7] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                Confirm Lock
              </button>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
};

