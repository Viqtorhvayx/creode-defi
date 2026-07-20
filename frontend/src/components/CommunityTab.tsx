import React from 'react';
import { CTA_BLUE } from '../lib/ui';

interface CommunityTabProps {
  theme: 'light' | 'dark';
}

export function CommunityTab({ theme }: CommunityTabProps) {
  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. TOP HERO SECTION */}
      <div className={`w-full flex flex-col md:flex-row rounded-[16px] border mb-6 overflow-hidden ${
        theme === 'dark'
          ? 'bg-[#0F141A] border-white/5'
          : 'bg-white border-[#EAECEF]'
      }`}>
        {/* Left Side */}
        <div className={`flex-1 p-8 relative flex flex-col justify-center ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-[#00A8E8]/10 to-transparent'
            : 'bg-gradient-to-r from-[#00A8E8]/[0.05] to-transparent'
        }`}>
          {/* Sweeping lines background simulation */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 0% 0%, #00A8E8 0%, transparent 40%), radial-gradient(circle at 100% 100%, #00A8E8 0%, transparent 40%)'
          }}></div>
          
          <div className="relative z-10 flex flex-col items-start">
            <h2 className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
              Community Governance
            </h2>
            <p className="text-[14px] text-slate-600 dark:text-white/70 max-w-[420px] leading-relaxed">
              Shape the future of the protocol. Use your voting power to decide on yield emissions, new vault assets, and platform upgrades.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className={`w-px hidden md:block ${theme === 'dark' ? 'bg-white/5' : 'bg-[#EAECEF]'}`}></div>

        {/* Right Side */}
        <div className={`w-full md:w-[340px] p-8 flex flex-col justify-center items-start relative ${
          theme === 'dark'
            ? 'bg-gradient-to-l from-[#00A8E8]/5 to-transparent'
            : 'bg-gradient-to-l from-[#00A8E8]/[0.02] to-transparent'
        }`}>
          <div className="text-[14px] font-semibold text-slate-600 dark:text-white/60 mb-1">
            Your Voting Power
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-[40px] font-bold text-[#00A8E8] leading-none tracking-tight">14,500</span>
            <span className="text-[20px] font-bold text-[#00A8E8]">CODE</span>
          </div>
          <button className={`${CTA_BLUE} px-6 py-2.5 text-[14px] shadow-sm`}>
            Submit New Proposal
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* LEFT COLUMN: Active Governance Polls */}
        <div className="flex flex-col gap-6">
          <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mt-2">Active Governance Polls</h3>
          
          {/* Poll Card 1 */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${
            theme === 'dark' ? 'bg-[#0F141A] border-white/5 shadow-sm' : 'bg-white border-[#EAECEF] shadow-sm'
          }`}>
            <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              Increase SAUCE/USDC Farm Rewards by 5%
            </h4>
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-white/50 mb-6">
              <span>Voting ends in 2 days</span>
              <span>•</span>
              <span>Quorum: 45%</span>
            </div>
            
            {/* Voting Results */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 font-bold text-[14px]">
                <span className="text-emerald-500">68% Yes</span>
                <span className="text-slate-300 dark:text-white/20">/</span>
                <span className="text-rose-500">32% No</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-1 h-2 w-full mb-2">
              <div className="bg-emerald-500 rounded-full" style={{ width: '68%' }}></div>
              <div className="bg-rose-500 rounded-full" style={{ width: '32%' }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-white/50 mb-6">
              <span className="text-emerald-500">68%</span>
              <span className="text-rose-500">32%</span>
            </div>
            
            {/* Action */}
            <div className="flex justify-end pt-2">
              <button className={`${CTA_BLUE} px-6 py-2.5 text-[13px] shadow-sm`}>
                Cast Vote
              </button>
            </div>
          </div>
          
          {/* Poll Card 2 */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${
            theme === 'dark' ? 'bg-[#0F141A] border-white/5 shadow-sm' : 'bg-white border-[#EAECEF] shadow-sm'
          }`}>
            <h4 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">
              Add DOVU to Time-Locked Vaults
            </h4>
            <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500 dark:text-white/50 mb-6">
              <span>Voting ends in 5 days</span>
              <span>•</span>
              <span>Quorum: 12%</span>
            </div>
            
            {/* Voting Results */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1.5 font-bold text-[14px]">
                <span className="text-emerald-500">85% Yes</span>
                <span className="text-slate-300 dark:text-white/20">/</span>
                <span className="text-rose-500">15% No</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex gap-1 h-2 w-full mb-2">
              <div className="bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
              <div className="bg-rose-500 rounded-full" style={{ width: '15%' }}></div>
            </div>
            
            <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 dark:text-white/50 mb-6">
              <span className="text-emerald-500">85%</span>
              <span className="text-rose-500">15%</span>
            </div>
            
            {/* Action */}
            <div className="flex justify-end pt-2">
              <button className={`${CTA_BLUE} px-6 py-2.5 text-[13px] shadow-sm`}>
                Cast Vote
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Submit & Recent */}
        <div className="flex flex-col gap-6 mt-2">
          
          {/* Submit a Proposal */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${
            theme === 'dark' ? 'bg-[#0F141A] border-white/5 shadow-sm' : 'bg-white border-[#EAECEF] shadow-sm'
          }`}>
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-5">Submit a Proposal</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600 dark:text-white/70">Proposal Title</label>
                <input 
                  type="text" 
                  placeholder="Enter a short, clear title"
                  className={`w-full px-4 py-2.5 rounded-[8px] border text-[13px] outline-none transition-colors ${
                    theme === 'dark' 
                      ? 'bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-[#00A8E8]' 
                      : 'bg-transparent border-[#EAECEF] text-slate-900 placeholder:text-slate-400 focus:border-[#00A8E8]'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-medium text-slate-600 dark:text-white/70">Describe your Proposal</label>
                <textarea 
                  rows={4}
                  placeholder="Provide details, rationale, and the expected impact of your proposal..."
                  className={`w-full px-4 py-3 rounded-[8px] border text-[13px] outline-none transition-colors resize-none ${
                    theme === 'dark' 
                      ? 'bg-transparent border-white/10 text-white placeholder:text-white/30 focus:border-[#00A8E8]' 
                      : 'bg-transparent border-[#EAECEF] text-slate-900 placeholder:text-slate-400 focus:border-[#00A8E8]'
                  }`}
                />
              </div>

              <button className={`${CTA_BLUE} w-full py-3 mt-2 text-[14px] shadow-sm`}>
                Submit Proposal
              </button>
            </div>
          </div>

          {/* Recent Decisions */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${
            theme === 'dark' ? 'bg-[#0F141A] border-white/5 shadow-sm' : 'bg-white border-[#EAECEF] shadow-sm'
          }`}>
            <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-5">Recent Decisions</h3>
            
            <div className="flex flex-col gap-0 mb-6">
              {/* Item 1 */}
              <div className={`flex justify-between items-center py-4 border-b ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80 pr-4 leading-tight">
                  Reduce HBAR early unstake penalty
                </span>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md shrink-0">
                  Passed
                </span>
              </div>
              
              {/* Item 2 */}
              <div className={`flex justify-between items-center py-4 border-b last:border-0 ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
                <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80 pr-4 leading-tight">
                  Integrate Hedera Liquid Staking
                </span>
                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md shrink-0">
                  Passed
                </span>
              </div>
            </div>

            <button className={`w-full py-2.5 rounded-[8px] border text-[13px] font-bold transition-colors ${
              theme === 'dark' 
                ? 'border-white/10 text-slate-300 hover:bg-white/5' 
                : 'border-[#EAECEF] text-[#00A8E8] hover:bg-slate-50 hover:border-[#00A8E8]/50'
            }`}>
              View all past decisions
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
