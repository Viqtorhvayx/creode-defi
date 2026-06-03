/* Credit this code to Viqtorhvayx on GitHub */
"use client";

import React from 'react';
import { PriceChart } from './PriceChart';
import { ShieldCheck, LockKey, Warning, CalendarBlank, ChartLineUp } from '@phosphor-icons/react';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Removed Top Header as requested */}

      {/* 2. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-8 items-start">
        
        {/* LEFT COLUMN: Chart + Stats (Spans 7 columns) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {/* Chart Card */}
          <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] flex flex-col w-full h-full p-6">
            <PriceChart theme={theme} />
          </div>
        </div>

        {/* RIGHT COLUMN: Vault Lock Card (Spans 5 columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F141A] border border-[#00A8E8]/50 rounded-[16px] p-8 flex flex-col relative overflow-hidden h-fit">
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-[44px] h-[44px] rounded-full bg-[#00A8E8]/10 dark:bg-[#00A8E8]/10 flex items-center justify-center dark:shadow-[0_0_20px_rgba(0,168,232,0.3)]">
                {/* Placeholder for custom Vault icon image */}
                <LockKey size={24} weight="fill" className="text-[#00A8E8] dark:text-[#00A8E8]" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5 leading-none">Vault</h3>
                <span className="text-[13px] font-medium text-slate-500 dark:text-white/60">Time-locked savings</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#1A2332] rounded-lg border border-slate-100 dark:border-white/5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-white/60">Secured by</span>
              <div className="flex items-center gap-1">
                <span className="w-3.5 h-3.5 rounded-full bg-black dark:bg-white flex items-center justify-center text-[8px] font-black text-white dark:text-black">H</span>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white">Hedera</span>
              </div>
            </div>
          </div>

          {/* Huge APY */}
          <div className="flex flex-col mb-8">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[48px] leading-none font-bold text-[#00A8E8] dark:text-[#00A8E8] dark:drop-shadow-[0_0_25px_rgba(0,168,232,0.4)]">0.30%</span>
              <span className="text-[20px] font-bold text-[#00A8E8] dark:text-[#00A8E8] dark:drop-shadow-[0_0_15px_rgba(0,168,232,0.3)]">APY</span>
            </div>
            <span className="text-[13px] font-medium text-[#00A8E8] dark:text-[#00A8E8]">Earns every 21 days</span>
          </div>

          {/* Deposit Input Area */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-bold text-slate-900 dark:text-white/80 mb-2">Deposit HBAR</label>
            <div className="flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/5 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-[16px] transition-all">
              <div className="flex flex-col justify-center h-full">
                <input type="number" placeholder="0" className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[32px] font-bold w-32 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 leading-none mb-1" />
                <span className="text-[12px] font-medium text-slate-400 dark:text-white/40">$0</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-2 rounded-full border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none cursor-pointer">
                <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black">H</span>
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">HBAR</span>
                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-white/60 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Lock For Input Area */}
          <div className="flex flex-col w-full mb-4">
            <label className="text-[13px] font-bold text-slate-900 dark:text-white/80 mb-2">Lock for (days)</label>
            <div className="flex items-center justify-between w-full">
              <div className="w-[100px] py-2 px-4 bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/5 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-full">
                <input type="number" defaultValue="30" className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[16px] font-bold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white" />
              </div>
              <button className="text-[12px] font-bold text-[#00A8E8] dark:text-[#00A8E8] border border-[#00A8E8]/30 dark:border-[#00A8E8]/30 px-4 py-2 rounded-full hover:bg-[#00A8E8]/10 dark:hover:bg-[#00A8E8]/10 transition-colors">SET</button>
            </div>
          </div>

          {/* Warning Text */}
          <div className="flex items-start gap-2 mb-8">
            <Warning size={16} className="text-red-500 dark:text-red-400/80 mt-[1px] shrink-0" />
            <span className="text-[12px] font-medium text-red-500 dark:text-red-400/80 leading-snug">Withdrawing before maturity incurs a 5% fee and forfeits pending yield.</span>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between w-full mb-8 pt-6 border-t border-slate-100 dark:border-white/5">
            <div className="flex flex-col items-start gap-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                <LockKey size={14} />
                <span className="text-[11px] font-semibold">Lock Period</span>
              </div>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">30 Days</span>
            </div>
            
            <div className="w-px h-8 bg-slate-200 dark:bg-[#1A2332]"></div>
            
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                <CalendarBlank size={14} />
                <span className="text-[11px] font-semibold">Maturity Date</span>
              </div>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">Jun 12, 2025</span>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-[#1A2332]"></div>

            <div className="flex flex-col items-start gap-1.5 flex-1 pl-4 lg:pl-8">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40 whitespace-nowrap">
                <ChartLineUp size={14} className="shrink-0" />
                <span className="text-[11px] font-semibold">Estimated Yield</span>
              </div>
              <span className="text-[13px] font-bold text-[#00A8E8] dark:text-[#00A8E8]">+4.50 HBAR</span>
            </div>
          </div>

          {/* Deposit Button */}
          <button className="w-full h-14 bg-[#00A8E8] dark:bg-[#00A8E8] hover:bg-[#0090C7] dark:hover:bg-[#0090C7] text-white rounded-[12px] text-[15px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:shadow-[0_0_20px_rgba(0,168,232,0.3)] transition-all tracking-wide">
            <LockKey size={18} weight="bold" />
            Deposit to Vault
          </button>

          {/* Footer Subtext */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck size={14} className="text-slate-400 dark:text-white/40" />
            <span className="text-[11px] font-medium text-slate-400 dark:text-white/40">Your funds are locked and secured on Hedera</span>
          </div>

        </div>
      </div>
    </div>
  );
};
