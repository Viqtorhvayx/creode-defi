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
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const [lockDays, setLockDays] = useState("");
  const [maturityDate, setMaturityDate] = useState("--");

  const handleSetDays = () => {
    const days = parseInt(lockDays);
    if (!isNaN(days) && days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + days);
      setMaturityDate(date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
    } else {
      setMaturityDate("--");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP OVERVIEW ROW: Slim minimalist metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
        <div className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 !rounded-[16px] p-8 flex justify-between items-center">
          <div>
            <h4 className="font-bold tracking-[0.2em] text-[11px] mb-2 uppercase" style={{ color: labelColor }}>Total Value Locked</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>0.00</span>
              <span className="font-bold text-sm" style={{ color: labelColor }}>HBAR</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#00A8E8]/10 flex items-center justify-center border border-[#00A8E8]/20 shadow-inner">
            <svg className="w-7 h-7 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
        </div>
        
        <div className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 !rounded-[16px] p-8 flex justify-between items-center">
          <div>
            <h4 className="font-bold tracking-[0.2em] text-[11px] mb-2 uppercase" style={{ color: labelColor }}>Active Positions</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>0</span>
              <span className="font-bold text-sm ml-1" style={{ color: labelColor }}>Locks</span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#10B981]/10 flex items-center justify-center border border-[#10B981]/20 shadow-inner">
            <svg className="w-7 h-7 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
        </div>
      </div>

      {/* 2. MAIN SPLIT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-5xl mx-auto w-full">
        
        {/* 3. LEFT COLUMN: Lock Engine (Span 7) */}
        <div className="lg:col-span-7 bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 !rounded-[24px] p-8 shadow-xl flex flex-col gap-10 h-full relative overflow-hidden">
          
          <div>
            <h3 className="text-[13px] font-bold tracking-[0.2em] opacity-40 mb-2" style={{ color: labelColor }}>Yield Generation</h3>
            <p className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Create Lock</p>
          </div>

          <div className="flex-1 flex flex-col gap-8">
            {/* Uniswap-style Amount Input */}
            <div className="uniswap-input-box">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>Deposit amount</label>
              </div>
              <div className="flex items-center justify-between gap-4 h-14">
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full bg-transparent text-2xl font-semibold outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ color: primaryTextColor }}
                />
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/10 shadow-md backdrop-blur-md hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer">
                  <span className="text-[10px] font-bold text-[#00A8E8] uppercase tracking-widest cursor-pointer hover:text-[#0090C7] transition-colors pl-1">Max</span>
                  <span className="text-lg font-bold" style={{ color: primaryTextColor }}>HBAR</span>
                </div>
              </div>
            </div>

            {/* Custom Timeline Picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/[0.03] dark:bg-white/[0.03] p-6 rounded-[16px] border border-black/5 dark:border-white/5 shadow-inner items-end">
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Lock Duration (Days)</label>
                <div className="flex gap-2 h-14">
                  <input 
                    type="number"
                    value={lockDays}
                    onChange={(e) => setLockDays(e.target.value)}
                    placeholder="0"
                    className="w-full h-full px-4 bg-black/5 dark:bg-white/5 rounded-[16px] border border-black/5 dark:border-white/10 text-xl font-bold focus:outline-none focus:border-[#00A8E8] transition-all shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    style={{ color: primaryTextColor }}
                  />
                  <button 
                    onClick={() => {
                      if (!lockDays) return;
                      const days = parseInt(lockDays);
                      const targetDate = new Date();
                      targetDate.setDate(targetDate.getDate() + days);
                      setMaturityDate(targetDate.toISOString().split('T')[0]);
                    }}
                    disabled={!lockDays}
                    className="h-full px-8 bg-[#00A8E8] text-white font-bold rounded-[16px] interactive-pop active:scale-95 disabled:hover:transform-none disabled:hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    SET
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Maturity Date</label>
                <div className="w-full h-14 px-4 bg-black/5 dark:bg-white/5 rounded-[16px] border border-black/5 dark:border-white/10 flex items-center shadow-sm">
                  <span className="text-sm font-bold" style={{ color: maturityDate === "--" ? labelColor : primaryTextColor }}>
                    {maturityDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Warning & Submit */}
            <div className="space-y-6 mt-auto">
              <div className="bg-red-500/10 p-6 rounded-[16px] border border-red-500/20 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-xs font-bold leading-relaxed text-red-500 dark:text-red-400">
                  Early withdrawal before your selected maturity date triggers a strict 5% penalty fee.
                </p>
              </div>

              <button className="nav-pill !py-6 w-full bg-[#00A8E8] text-white text-sm font-bold shadow-[0_20px_50px_rgba(0,168,232,0.3)] interactive-pop active:scale-95 !rounded-[30px] flex justify-center">
                CONFIRM LOCK
              </button>
            </div>
          </div>
          
        </div>

        {/* 4. RIGHT COLUMN: Chart (Span 5) */}
        <div className="lg:col-span-5 bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 !rounded-[24px] p-0 overflow-hidden flex flex-col shadow-xl min-h-[500px]">
          <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-black/[0.02] dark:bg-white/[0.02]">
            <div>
              <h3 className="text-[13px] font-bold tracking-[0.2em] opacity-40 mb-2" style={{ color: labelColor }}>Market Analytics</h3>
              <p className="text-2xl font-black tracking-tighter" style={{ color: primaryTextColor }}>HBAR / USD</p>
            </div>
            <span className="px-4 py-2 bg-[#00A8E8]/10 text-[#00A8E8] rounded-full text-[10px] font-black tracking-[0.2em] uppercase border border-[#00A8E8]/20">Live</span>
          </div>
          <div className="flex-1 p-6 h-full relative">
            <PriceChart theme={theme} />
          </div>
        </div>

      </div>
    </div>
  );
};
