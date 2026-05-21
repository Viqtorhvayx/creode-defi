/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Premium Flat Vault Tab
 */
"use client";

import React from 'react';
import { PriceChart } from './PriceChart';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. HERO CHART SECTION */}
      <div className="w-full bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 overflow-hidden transition-all hover:shadow-md">
        <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">HBAR Market</h2>
            <p className="text-sm font-bold text-[#00A8E8] uppercase tracking-widest mt-2">Live Price Action</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-black/40 dark:text-white/40 uppercase tracking-widest block mb-1">Network</span>
            <span className="px-3 py-1 bg-[#00A8E8]/10 text-[#00A8E8] rounded-lg text-xs font-black tracking-wide">Hedera Mainnet</span>
          </div>
        </div>
        <div className="p-4">
          <PriceChart theme={theme} />
        </div>
      </div>

      {/* 2. VAULT OPERATIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* LEFT/MAIN COLUMN: The Lock Engine (Spans 3 cols) */}
        <div className="lg:col-span-3 p-10 bg-white dark:bg-[#121212] rounded-[2rem] shadow-sm border border-black/5 dark:border-white/5 flex flex-col gap-8 transition-all hover:shadow-md">
          
          <div>
            <h3 className="text-2xl font-black text-black dark:text-white mb-2">Create Lock</h3>
            <p className="text-black/50 dark:text-white/50 font-medium">Select your timeline and secure HBAR to generate protocol yield.</p>
          </div>

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

          {/* Custom Timeline Picker */}
          <div className="grid grid-cols-2 gap-6 p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-2xl">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest">Start Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-white dark:bg-[#1A1A1A] rounded-xl border border-black/5 dark:border-white/5 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-[#00A8E8] transition-all cursor-pointer" 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest">Maturity Date</label>
              <input 
                type="date" 
                className="w-full p-4 bg-white dark:bg-[#1A1A1A] rounded-xl border border-black/5 dark:border-white/5 text-sm font-bold text-black dark:text-white focus:outline-none focus:border-[#00A8E8] transition-all cursor-pointer" 
              />
            </div>
          </div>

          {/* Warning & Submit */}
          <div className="space-y-6 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="p-5 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-100 dark:border-red-500/20 flex gap-4 items-start">
              <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-lg shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 font-bold leading-relaxed pt-1">
                Early withdrawal before your selected maturity date triggers a strict 5% penalty fee on your locked principal.
              </p>
            </div>

            <button className="w-full py-6 bg-[#00A8E8] text-white rounded-2xl text-lg font-black uppercase tracking-[0.15em] hover:bg-[#0090C7] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              Confirm & Lock HBAR
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Position Stats (Spans 2 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-10 bg-[#00A8E8] rounded-[2rem] shadow-lg flex flex-col justify-between relative overflow-hidden h-full min-h-[300px]">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h4 className="text-white/80 font-bold uppercase tracking-widest text-sm mb-2">Total Value Locked</h4>
              <div className="text-5xl font-black text-white tracking-tighter mb-1">0.00</div>
              <div className="text-white/90 font-extrabold text-lg">HBAR</div>
            </div>

            <div className="relative z-10 space-y-4 pt-8">
              <div className="flex justify-between items-center pb-4 border-b border-white/20">
                <span className="text-white/80 font-medium">Active Positions</span>
                <span className="text-white font-bold">0</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/20">
                <span className="text-white/80 font-medium">Est. Yield Rate</span>
                <span className="text-white font-bold">--% APY</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
