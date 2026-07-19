import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Database, ShieldCheck, Info, Plus, ArrowUpRight } from '@phosphor-icons/react';

export interface StrategyToken {
  sym: string;
  logo: string | null;
  fallback: string;
  bg: string;
}

export interface Strategy {
  pair: string;
  token1: StrategyToken;
  token2: StrategyToken;
  riskLevel: string;
  riskBgClass: string;
  riskTextClass: string;
  apy: string;
  tvl: string;
  token1Amount: string;
  token1Usd: string;
  token2Amount: string;
  token2Usd: string;
  dailyEarnings: string;
}

interface EarnStrategyDetailProps {
  theme: 'light' | 'dark';
  strategy: Strategy;
  onBack: () => void;
}

// Brand accent — keep in sync with the rest of the dapp.
const BLUE = '#00A8E8';

const TokenBadge: React.FC<{ token: StrategyToken; size: number; border: string }> = ({ token, size, border }) => (
  token.logo ? (
    <img src={token.logo} alt={token.sym} className={`rounded-full border-2 ${border}`} style={{ width: size, height: size }} />
  ) : (
    <div
      className={`rounded-full flex items-center justify-center text-white font-bold border-2 ${border} ${token.bg}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {token.fallback}
    </div>
  )
);

export const EarnStrategyDetail: React.FC<EarnStrategyDetailProps> = ({ theme, strategy, onBack }) => {
  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-[#111827]';
  const textMuted = isDark ? 'text-white/60' : 'text-slate-500';
  const cardBg = isDark ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = isDark ? 'border-white/5' : 'border-[#EAECEF]';
  const logoBorder = isDark ? 'border-[#0F141A]' : 'border-white';
  const pillBg = isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200';

  const { token1, token2 } = strategy;
  const apyNum = strategy.apy.replace('%', '');

  // Editable liquidity amounts. Reset when the selected pair changes.
  const [amt1, setAmt1] = useState(strategy.token1Amount);
  const [amt2, setAmt2] = useState(strategy.token2Amount);
  useEffect(() => {
    setAmt1(strategy.token1Amount);
    setAmt2(strategy.token2Amount);
  }, [strategy.pair, strategy.token1Amount, strategy.token2Amount]);

  const TokenPill: React.FC<{ token: StrategyToken }> = ({ token }) => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 ${pillBg}`}>
      {token.logo ? (
        <img src={token.logo} alt={token.sym} className="w-[18px] h-[18px] rounded-full" />
      ) : (
        <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${token.bg}`}>
          <span className="text-white text-[10px] font-bold">{token.fallback}</span>
        </div>
      )}
      <span className="text-[13px] font-bold">{token.sym}</span>
    </div>
  );

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
          {/* Overlapping pair logo comes first */}
          <div className="flex -space-x-3">
            <div className="relative z-10"><TokenBadge token={token1} size={44} border={logoBorder} /></div>
            <TokenBadge token={token2} size={44} border={logoBorder} />
          </div>
          <h1 className="text-[32px] font-bold tracking-tight">{strategy.pair}</h1>
          <div className={`px-3 py-1 rounded-md text-[12px] font-bold ${strategy.riskBgClass} ${strategy.riskTextClass}`}>
            {strategy.riskLevel} Profile
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-6">

        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-6 w-full">

          {/* Metrics Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
            {/* APY */}
            <div className={`flex-1 border-r ${borderColor} pr-8 flex flex-col justify-center`}>
              <div className="flex items-baseline mb-2">
                <span className="text-[48px] font-bold leading-none" style={{ color: BLUE }}>{apyNum}</span>
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
                <span className="text-[48px] font-bold leading-none tracking-tight">{strategy.tvl}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-semibold ${textMuted}`}>Total Value Locked (TVL)</span>
                <Info size={14} className={textMuted} />
              </div>
            </div>
          </div>

          {/* How it Works Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={20} style={{ color: BLUE }} weight="fill" />
              <h2 className="text-[16px] font-bold tracking-tight">How it Works</h2>
            </div>
            <p className={`text-[14px] leading-[1.6] font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              This strategy automatically provisions concentrated liquidity for the {token1.sym} / {token2.sym} pair into high-volume bands on SaucerSwap V2. Creode's smart contracts actively manage and dynamically re-range the price boundaries to prevent out-of-range yield pauses, maximizing your trading fee collection automatically.
            </p>
          </div>

          {/* Protocol & Rewards Ledger Card */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>
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
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold" style={{ backgroundColor: 'rgba(0,168,232,0.1)', color: BLUE }}>{token1.sym} Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400">{token2.sym} Fees</span>
                  <span className="px-3 py-1 rounded-[6px] text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">+CODE Points ✦</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 px-2">
            <CheckCircle size={16} style={{ color: BLUE }} weight="fill" />
            <span className={`text-[12px] font-medium ${textMuted}`}>
              Creode automatically manages your position to optimize returns. Impermanent loss may occur. <a href="#" className="inline-flex items-center gap-0.5 hover:underline align-baseline" style={{ color: BLUE }}>Learn more <ArrowUpRight size={12} weight="bold" /></a>
            </span>
          </div>

        </div>

        {/* === RIGHT COLUMN: Supply Liquidity Panel === */}
        <div className="flex flex-col w-full h-full">
          <div className={`${cardBg} border ${borderColor} rounded-[16px] p-6 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(0,168,232,0.05)]`}>

            <h2 className="text-[16px] font-bold tracking-tight mb-6">Supply Liquidity</h2>

            <div className="relative flex flex-col mb-6">

              {/* Input 1 (token1) */}
              <div className="flex flex-col relative z-0">
                <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</span>
                <div className={`w-full ${isDark ? 'bg-[#0b0e14]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-[#EAECEF]'} rounded-[12px] p-4 flex flex-col focus-within:border-[#00A8E8] transition-colors`}>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amt1}
                      onChange={(e) => setAmt1(e.target.value)}
                      placeholder="0.00"
                      className={`bg-transparent border-none outline-none text-[32px] font-normal tracking-tight w-full p-0 m-0 ${textMain}`}
                    />
                    <TokenPill token={token1} />
                  </div>
                  <span className={`text-[12px] mt-1 font-medium ${textMuted}`}>{strategy.token1Usd}</span>
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

              {/* Input 2 (token2) */}
              <div className="flex flex-col mt-4 relative z-0">
                <span className={`text-[12px] font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Amount</span>
                <div className={`w-full ${isDark ? 'bg-[#0b0e14]' : 'bg-white'} border ${isDark ? 'border-white/10' : 'border-[#EAECEF]'} rounded-[12px] p-4 flex flex-col focus-within:border-[#00A8E8] transition-colors`}>
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amt2}
                      onChange={(e) => setAmt2(e.target.value)}
                      placeholder="0.00"
                      className={`bg-transparent border-none outline-none text-[32px] font-normal tracking-tight w-full p-0 m-0 ${textMain}`}
                    />
                    <TokenPill token={token2} />
                  </div>
                  <span className={`text-[12px] mt-1 font-medium ${textMuted}`}>{strategy.token2Usd}</span>
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
                <span className="text-[13px] font-bold text-[#00c076]">{strategy.dailyEarnings}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button className="w-full bg-gradient-to-r from-[#00A8E8] to-[#0090C7] hover:from-[#0090C7] hover:to-[#007ba8] text-white py-4 rounded-[12px] text-[15px] font-bold transition-all shadow-sm">
              Confirm &amp; Supply Liquidity
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
