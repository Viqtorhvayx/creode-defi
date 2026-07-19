import React from 'react';
import { ArrowLeft, CheckCircle, Database, ShieldCheck, Info, CaretDown, Plus } from '@phosphor-icons/react';

interface EarnStrategyDetailProps {
  theme: 'light' | 'dark';
  onBack: () => void;
}

export const EarnStrategyDetail: React.FC<EarnStrategyDetailProps> = ({ theme, onBack }) => {
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-[#111827]';
  const textMuted = isDark ? 'text-white/60' : 'text-slate-500';
  const cardBg = isDark ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const BLUE = '#2563EB';

  return (
    <div className={`w-full max-w-[1100px] mx-auto animate-in fade-in duration-500 pb-20 ${textMain}`}>
      {/* Top Navigation & Title */}
      <div className="flex flex-col gap-5 mb-8">
        <button 
          onClick={onBack}
          className={`flex items-center gap-2 w-fit text-[14px] font-medium transition-colors ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Discover
        </button>

        <div className="flex items-center gap-4">
          <h1 className="text-[32px] font-bold tracking-tight">HBAR / SAUCE Yield Optimizer</h1>
          <div className="px-3 py-1 bg-[#e6faee] dark:bg-emerald-500/10 text-[#00c076] text-[12px] font-bold rounded-md border border-[#00c076]/20">
            Balanced Profile
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">
        
        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Metrics Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            {/* APY */}
            <div className={`flex-1 border-r ${borderColor} pr-8 flex flex-col justify-center`}>
              <div className="flex items-baseline mb-2">
                <span className="text-[48px] font-bold leading-none" style={{ color: BLUE }}>45.2</span>
                <span className="text-[24px] font-bold" style={{ color: BLUE }}>%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Current Net APY</span>
                <Info size={14} className={textMuted} />
              </div>
            </div>

            {/* TVL */}
            <div className="flex-1 pl-8 flex flex-col justify-center">
              <div className="flex items-baseline mb-2">
                <span className="text-[48px] font-bold leading-none tracking-tight">$3.4M</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Total Value Locked (TVL)</span>
                <Info size={14} className={textMuted} />
              </div>
            </div>
          </div>

          {/* How it Works Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} style={{ color: BLUE }} weight="fill" />
              <h2 className="text-[16px] font-bold tracking-tight">How it Works</h2>
            </div>
            <p className={`text-[14px] leading-[1.6] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              This strategy automatically provisions concentrated liquidity into high-volume bands on SaucerSwap V2. Creode's smart contracts actively manage and dynamically re-range the price boundaries to prevent out-of-range yield pauses, maximizing your trading fee collection automatically.
            </p>
          </div>

          {/* Protocol & Rewards Ledger Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            <div className="flex items-center gap-2 mb-6">
              <Database size={20} style={{ color: BLUE }} weight="fill" />
              <h2 className="text-[16px] font-bold tracking-tight">Protocol & Rewards Ledger</h2>
            </div>

            <div className="flex flex-col w-full">
              {/* Row 1 */}
              <div className={`flex justify-between items-center py-5 border-b ${borderColor}`}>
                <span className={`text-[13px] font-semibold ${textMuted}`}>Underlying Venue</span>
                <span className="text-[13px] font-bold">SaucerSwap V2 (100% Allocation)</span>
              </div>
              {/* Row 2 */}
              <div className={`flex justify-between items-center py-5 border-b ${borderColor}`}>
                <span className={`text-[13px] font-semibold ${textMuted}`}>Compounding Type</span>
                <span className="text-[13px] font-bold text-right max-w-[250px] leading-snug">
                  Automated via Hedera Scheduled<br/>Transactions (HIP-1215)
                </span>
              </div>
              {/* Row 3 */}
              <div className="flex justify-between items-center pt-5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Incentives Earned</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-[#2563EB]/10 text-[#2563EB]">HBAR Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">SAUCE Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">+CODE Points ✦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 px-2">
            <CheckCircle size={16} style={{ color: BLUE }} weight="fill" />
            <span className={`text-[12px] font-medium ${textMuted}`}>
              Creode automatically manages your position to optimize returns. Impermanent loss may occur. <a href="#" className="hover:underline" style={{ color: BLUE }}>Learn more <span className="inline-block relative -top-[2px] ml-0.5 text-[10px]">&#8599;</span></a>
            </span>
          </div>

        </div>

        {/* === RIGHT COLUMN: Supply Liquidity Panel === */}
        <div className="flex flex-col w-full h-full">
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-6 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            
            <h2 className="text-[16px] font-bold tracking-tight mb-6">Supply Liquidity</h2>

            <div className="relative flex flex-col mb-6">
              
              {/* Input 1 (HBAR) */}
              <div className="flex flex-col relative z-0">
                <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</span>
                <div className={`w-full ${isDark ? 'bg-[#0b0e14]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-[#EAECEF]'} rounded-[12px] p-4 flex flex-col focus-within:border-[#2563EB] transition-colors`}>
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value="5,000.00" 
                      readOnly
                      className={`bg-transparent border-none outline-none text-[32px] font-normal tracking-tight w-full p-0 m-0 ${textMain}`}
                    />
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 cursor-pointer transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div className="w-[18px] h-[18px] rounded-full bg-black flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">H</span>
                      </div>
                      <span className="text-[13px] font-bold">HBAR</span>
                      <CaretDown size={12} weight="bold" className={textMuted} />
                    </div>
                  </div>
                  <span className={`text-[12px] mt-1 font-medium ${textMuted}`}>$425.00</span>
                </div>
              </div>

              {/* + Icon Separator */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pt-[22px]">
                <div className={`w-[32px] h-[32px] rounded-full flex items-center justify-center shadow-sm ${
                  isDark ? 'bg-[#1a212e] border border-white/10 text-white/50' : 'bg-white border border-[#EAECEF] text-slate-400'
                }`}>
                  <Plus size={16} weight="bold" />
                </div>
              </div>

              {/* Input 2 (SAUCE) */}
              <div className="flex flex-col mt-4 relative z-0">
                <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</span>
                <div className={`w-full ${isDark ? 'bg-[#0b0e14]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-[#EAECEF]'} rounded-[12px] p-4 flex flex-col focus-within:border-[#2563EB] transition-colors`}>
                  <div className="flex items-center justify-between">
                    <input 
                      type="text" 
                      value="12,450.00" 
                      readOnly
                      className={`bg-transparent border-none outline-none text-[32px] font-normal tracking-tight w-full p-0 m-0 ${textMain}`}
                    />
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 cursor-pointer transition-colors ${
                      isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}>
                      <div className="w-[18px] h-[18px] rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold">S</span>
                      </div>
                      <span className="text-[13px] font-bold">SAUCE</span>
                      <CaretDown size={12} weight="bold" className={textMuted} />
                    </div>
                  </div>
                  <span className={`text-[12px] mt-1 font-medium ${textMuted}`}>$425.00</span>
                </div>
              </div>

            </div>

            {/* Settings Row */}
            <div className={`flex flex-col border-y ${borderColor} py-4 mb-6 gap-3`}>
              <div className="flex justify-between items-center">
                <span className={`text-[13px] font-medium ${textMuted}`}>Slippage Tolerance</span>
                <span className="text-[13px] font-bold">0.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-[13px] font-medium ${textMuted}`}>Estimated Daily Earnings</span>
                <span className="text-[13px] font-bold text-[#00c076]">+14.2 HBAR / +35.4 SAUCE</span>
              </div>
            </div>

            {/* Submit Button */}
            <button className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white py-4 rounded-[12px] text-[15px] font-bold transition-all shadow-sm">
              Confirm & Supply Liquidity
            </button>
            
          </div>
        </div>

      </div>
    </div>
  );
};
