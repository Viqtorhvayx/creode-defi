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
    <div className="w-full max-w-[1200px] mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP HEADER */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: primaryTextColor }}>Vault</h1>
          <svg className="w-6 h-6 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <p className="text-sm font-medium" style={{ color: labelColor }}>
          Time-lock your HBAR and earn 0.30% APY every 21 days.
        </p>
      </div>

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-8">
        
        {/* LEFT COLUMN: Chart */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-[#00A8E8]/20 rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,168,232,0.1)] flex flex-col min-h-[500px]">
          <PriceChart theme={theme} />
        </div>

        {/* RIGHT COLUMN: Vault Lock Card */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-[#00A8E8]/20 rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_30px_rgba(0,168,232,0.1)] flex flex-col relative overflow-hidden">
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#00A8E8] flex items-center justify-center shadow-[0_0_15px_rgba(0,168,232,0.5)]">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold tracking-tight" style={{ color: primaryTextColor }}>Vault</h3>
                <span className="text-[11px] font-bold" style={{ color: labelColor }}>Time-locked savings</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Secured by</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/5 dark:bg-white/5 rounded-md border border-black/5 dark:border-white/10">
                <span className="w-3 h-3 rounded-full bg-black dark:bg-white flex items-center justify-center text-[8px] font-black text-white dark:text-black">H</span>
                <span className="text-[10px] font-bold" style={{ color: primaryTextColor }}>Hedera</span>
              </div>
            </div>
          </div>

          {/* Huge APY */}
          <div className="flex flex-col items-center justify-center mb-10 text-center">
            <div className="flex items-baseline gap-1">
              <span className="text-[56px] leading-none font-bold text-[#00A8E8] drop-shadow-[0_0_20px_rgba(0,168,232,0.3)]">0.30</span>
              <span className="text-[32px] font-bold text-[#00A8E8] drop-shadow-[0_0_20px_rgba(0,168,232,0.3)]">% APY</span>
            </div>
            <span className="text-xs font-bold text-[#00A8E8] mt-2">Earns every 21 days</span>
          </div>

          {/* Inputs Section */}
          <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
            {/* Deposit HBAR */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold" style={{ color: primaryTextColor }}>Deposit HBAR</label>
              <div className="flex items-center justify-between w-full h-14 px-4 bg-transparent border border-black/10 dark:border-white/10 rounded-xl">
                <div className="flex flex-col justify-center">
                  <input type="number" placeholder="0" className="bg-transparent outline-none border-none text-xl font-bold w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" style={{ color: primaryTextColor }} />
                  <span className="text-[10px] font-bold mt-0.5" style={{ color: labelColor }}>$0</span>
                </div>
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-[8px] border border-black/5 dark:border-white/10 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <span className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center text-[8px] font-black">H</span>
                  <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>HBAR</span>
                  <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {/* Lock for (days) */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold" style={{ color: primaryTextColor }}>Lock for (days)</label>
              <div className="flex items-center justify-between w-full h-14 pl-4 pr-1.5 bg-transparent border border-black/10 dark:border-white/10 rounded-xl">
                <input 
                  type="number" 
                  value={lockDays}
                  onChange={(e) => {
                    setLockDays(e.target.value);
                    const days = parseInt(e.target.value);
                    if (!isNaN(days) && days > 0) {
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      setMaturityDate(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
                    } else {
                      setMaturityDate("--");
                    }
                  }}
                  placeholder="30" 
                  className="bg-transparent outline-none border-none text-xl font-bold w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  style={{ color: primaryTextColor }} 
                />
                <button className="h-10 px-5 bg-transparent border border-[#00A8E8]/30 rounded-lg text-[11px] font-bold text-[#00A8E8] hover:bg-[#00A8E8]/10 transition-colors">
                  SET
                </button>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-center gap-2 mt-1">
              <svg className="w-3.5 h-3.5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="text-[11px] font-bold text-[#EF4444]">Early withdrawal incurs a 5% fee</span>
            </div>
          </div>

          <div className="w-full h-px bg-black/5 dark:bg-white/10 my-8"></div>

          {/* Summary Rows */}
          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: labelColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>Lock Period</span>
              </div>
              <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>{lockDays || "0"} Days</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: labelColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>Next Yield Date</span>
              </div>
              <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>{maturityDate}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: labelColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>Estimated Earnings</span>
              </div>
              <span className="text-[11px] font-bold text-[#00A8E8]">+4.50 HBAR</span>
            </div>
          </div>

          {/* Deposit Button */}
          <button className="w-full max-w-sm mx-auto h-14 bg-[#00A8E8] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,168,232,0.3)] hover:scale-105 active:scale-95 transition-all">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            Deposit to Vault
          </button>

          {/* Footer Subtext */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <svg className="w-3.5 h-3.5" style={{ color: labelColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[10px] font-bold" style={{ color: labelColor }}>Your funds are locked and secured on Hedera</span>
          </div>

        </div>
      </div>

      {/* 3. BOTTOM FEATURES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* Card 1 */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h4 className="text-sm font-bold" style={{ color: primaryTextColor }}>Secure</h4>
          <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: labelColor }}>Built on Hedera with enterprise-grade security.</p>
        </div>
        {/* Card 2 */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h4 className="text-sm font-bold" style={{ color: primaryTextColor }}>Time-Locked</h4>
          <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: labelColor }}>Funds are locked for the duration you set.</p>
        </div>
        {/* Card 3 */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
            <span className="text-xl font-bold text-[#00A8E8]">%</span>
          </div>
          <h4 className="text-sm font-bold" style={{ color: primaryTextColor }}>Stable Yield</h4>
          <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: labelColor }}>Earn 0.30% APY every 21 days, consistently.</p>
        </div>
        {/* Card 4 */}
        <div className="bg-white dark:bg-[#0A0F16] border border-black/10 dark:border-white/5 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
            <svg className="w-6 h-6 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h4 className="text-sm font-bold" style={{ color: primaryTextColor }}>Auto-Compounding</h4>
          <p className="text-[11px] leading-relaxed max-w-[180px]" style={{ color: labelColor }}>Earnings are added to your balance after each cycle.</p>
        </div>
      </div>

    </div>
  );
};
