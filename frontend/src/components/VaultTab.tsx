/* Credit this code to Viqtorhvayx on GitHub
 * CREODE DApp - Side-by-Side Split Vault Tab
 */
"use client";

import React from 'react';
import { PriceChart } from './PriceChart';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP HEADER */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-4xl font-bold tracking-tight text-white">Vault</h1>
          <svg className="w-7 h-7 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <p className="text-[13px] font-medium text-white/60">
          Time-lock your HBAR and earn 0.30% APY every 21 days.
        </p>
      </div>

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-8">
        
        {/* LEFT COLUMN: Chart + Features (Spans 7 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Chart Card */}
          <div className="bg-[#0A0F16] border border-[#1A2332] rounded-[20px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] flex flex-col min-h-[500px]">
            <PriceChart theme={theme} />
          </div>

          {/* Features Row (Inside Left Column) */}
          <div className="bg-[#0A0F16] border border-[#1A2332] rounded-[20px] p-6 grid grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h4 className="text-[13px] font-bold text-white tracking-wide">Secure</h4>
              <p className="text-[10px] leading-relaxed text-white/50">Built on Hedera with enterprise-grade security.</p>
            </div>
            {/* Card 2 */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
                <svg className="w-4 h-4 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h4 className="text-[13px] font-bold text-white tracking-wide">Time-Locked</h4>
              <p className="text-[10px] leading-relaxed text-white/50">Funds are locked for 21 days to maximize your earnings.</p>
            </div>
            {/* Card 3 */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
                <span className="text-lg font-bold text-[#00A8E8]">%</span>
              </div>
              <h4 className="text-[13px] font-bold text-white tracking-wide">Stable Yield</h4>
              <p className="text-[10px] leading-relaxed text-white/50">Earn 0.30% APY every 21 days, consistently.</p>
            </div>
            {/* Card 4 */}
            <div className="flex flex-col items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-[#00A8E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h4 className="text-[13px] font-bold text-white tracking-wide">Auto-Compounding</h4>
              <p className="text-[10px] leading-relaxed text-white/50">Earnings are added to your balance after each cycle.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Vault Lock Card (Spans 5 columns) */}
        <div className="lg:col-span-5 bg-[#090D14] border border-[#00A8E8] rounded-[24px] p-8 shadow-[0_0_20px_rgba(0,168,232,0.1),inset_0_0_20px_rgba(0,168,232,0.05)] flex flex-col relative overflow-hidden h-fit">
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-10">
            <div className="flex items-center gap-4">
              <div className="w-[52px] h-[52px] rounded-full bg-[#00A8E8] flex items-center justify-center shadow-[0_0_20px_rgba(0,168,232,0.4)] border border-[#00A8E8]/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-2xl font-bold tracking-tight text-white mb-0.5">Vault</h3>
                <span className="text-[13px] font-medium text-white/60">Time-locked savings</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1.5 mt-1">
              <span className="text-[9px] font-bold text-white/40 tracking-wider">Secured by</span>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A2332] rounded-[8px] border border-white/5">
                <span className="w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center text-[8px] font-black text-black">H</span>
                <span className="text-[11px] font-bold text-white">Hedera</span>
              </div>
            </div>
          </div>

          {/* Huge APY */}
          <div className="flex flex-col items-center justify-center mb-10 text-center">
            <span className="text-[11px] font-bold text-white/40 mb-2">Your APY</span>
            <div className="flex items-baseline gap-2">
              <span className="text-[64px] leading-none font-bold text-[#00A8E8] drop-shadow-[0_0_30px_rgba(0,168,232,0.4)]">0.30%</span>
              <span className="text-[28px] font-bold text-[#00A8E8] drop-shadow-[0_0_20px_rgba(0,168,232,0.3)] tracking-wide">APY</span>
            </div>
            <span className="text-[13px] font-bold text-[#00A8E8] mt-3">Earn every 21 days</span>
          </div>

          {/* Deposit Input Area */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[12px] font-bold text-white mb-3">Deposit HBAR</label>
            <div className="flex items-center justify-between w-full h-16 pl-5 pr-2 bg-[#04080F] border border-[#1A2332] rounded-[16px]">
              <input type="number" placeholder="0.00" className="bg-transparent outline-none border-none text-[22px] font-bold w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-white/50" />
              <div className="flex items-center gap-2 bg-[#1A2332] px-4 py-2.5 rounded-[12px]">
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-black">H</span>
                <span className="text-[12px] font-bold text-white tracking-wide">HBAR</span>
              </div>
            </div>
            <div className="flex items-center justify-between w-full mt-3 px-1">
              <span className="text-[11px] font-bold text-white/40">Available Balance: 2,450.75 HBAR</span>
              <button className="text-[11px] font-bold text-[#00A8E8] hover:text-[#0090C7] transition-colors tracking-wide">MAX</button>
            </div>
          </div>

          {/* Static Lock Info Box */}
          <div className="flex flex-col w-full bg-[#04080F] border border-[#1A2332] rounded-[16px] p-5 gap-4 mb-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg className="w-[16px] h-[16px] text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <span className="text-[12px] font-bold text-white/60 tracking-wide">Lock Period</span>
              </div>
              <span className="text-[11px] font-bold bg-[#00A8E8]/20 text-[#00A8E8] px-3 py-1.5 rounded-full tracking-wide">21 Days</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg className="w-[16px] h-[16px] text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[12px] font-bold text-white/60 tracking-wide">Next Yield Date</span>
              </div>
              <span className="text-[12px] font-bold text-white tracking-wide">May 30, 2025</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg className="w-[16px] h-[16px] text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span className="text-[12px] font-bold text-white/60 tracking-wide">Estimated Earnings</span>
              </div>
              <span className="text-[12px] font-bold text-[#00A8E8] tracking-wide">+1.50 HBAR</span>
            </div>
          </div>

          {/* Deposit Button */}
          <button className="w-full h-14 bg-[#00A8E8] hover:bg-[#0090C7] text-white rounded-[12px] text-[14px] font-bold flex items-center justify-center gap-2 shadow-[0_5px_15px_rgba(0,168,232,0.3)] transition-all tracking-wide">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Deposit to Vault
          </button>

          {/* Footer Subtext */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span className="text-[11px] font-bold text-white/40">Your funds are locked and secured on Hedera</span>
          </div>

        </div>
      </div>
    </div>
  );
};
