/* Credit this code to Viqtorhvayx on GitHub */
"use client";

/* * Developer: [Viqtorhvayx]
 * Component: LendingModule
 * Description: Liquidity provision module integrated with the Advanced Identity Engine.
 */

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';

interface LendingModuleProps {
  points: number;
  theme?: 'light' | 'dark';
}

export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const { balance, balanceSymbol } = useWallet();
  const [amount, setAmount] = useState("");
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw'>('deposit');

  const handleDeposit = async () => {
    setActiveAction('deposit');
    alert("Liquidity deployed successfully!");
  };

  const handleWithdraw = async () => {
    setActiveAction('withdraw');
    alert("Liquidity withdrawal requested!");
  };

  const handleQuickSelect = (percent: number) => {
    const numericBalance = Number(balance) || 0;
    const targetAmount = (numericBalance * (percent / 100)).toString();
    setAmount(formatWithCommas(targetAmount));
  };

  const handleMaxSelect = () => {
    setAmount(formatWithCommas(balance));
  };

  const QuickButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="text-[8px] font-black transition-all duration-300 rounded-[60px] !py-1 !h-auto px-2 tracking-tighter bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20 active:scale-95 uppercase"
    >
      {label}
    </button>
  );

  const hbarPrice = usePythPrice();

  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(stripCommas(amount)) || 0) * hbarPrice);
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold";

  const getButtonClasses = (action: 'deposit' | 'withdraw') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-500 rounded-[60px] text-sm bounce-hover";
    return isActive 
      ? `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

  return (
    <div className="glass-panel !rounded-[48px] p-12 max-w-2xl mx-auto shadow-[0_30px_100px_rgba(0,0,0,0.4)] flex flex-col h-full relative overflow-hidden transform transition-all duration-700 hover:shadow-[0_40px_120px_rgba(0,168,232,0.15)]">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-[13px] font-bold tracking-[0.2em] opacity-40 mb-2" style={{ color: labelColor }}>Liquidity provision</h3>
          <p className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Lend</p>
        </div>
        <div className="bg-[#00A8E8]/10 px-6 py-3 rounded-[24px] border border-[#00A8E8]/20 shadow-inner">
          <p className="text-[11px] font-bold opacity-40 mb-1" style={{ color: primaryTextColor }}>Protocol points</p>
          <p className="text-2xl font-black text-[#00A8E8]">{points.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-10 flex flex-col flex-grow">
        {/* Standardized Input Box */}
        <div className="space-y-3">
          <label className="text-xs font-extrabold text-black/40 dark:text-white/40 uppercase tracking-widest">
            Amount to provide
          </label>
          <div className="relative w-full group">
            <FormattedNumberInput 
              placeholder="0.00"
              className="w-full h-20 bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl px-6 text-3xl font-black text-black dark:text-white focus:outline-none focus:border-[#00A8E8]/30 focus:bg-transparent transition-all duration-300"
              value={amount}
              onValueChange={setAmount}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-white dark:bg-[#1A1A1A] p-2 pl-5 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
              <button 
                onClick={handleMaxSelect}
                className="text-xs font-black text-[#00A8E8] uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors"
              >
                Max
              </button>
              <div className="w-px h-5 bg-black/10 dark:bg-white/10"></div>
              <span className="text-base font-black text-black/80 dark:text-white/80 pr-2">HBAR</span>
            </div>
          </div>
          <p className="text-[12px] font-bold text-[#00A8E8] tracking-[0.1em] opacity-60 uppercase">{usdValue} Valuation</p>
        </div>

        {/* Aave-style Data Rows authored by Viqtorhvayx */}
        <div className="space-y-5 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-xl mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold tracking-[0.1em] opacity-40" style={{ color: primaryTextColor }}>Your supply</span>
            <span className="text-xl font-black text-white ml-auto tracking-tight">0.00 HBAR</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold tracking-[0.1em] opacity-40" style={{ color: primaryTextColor }}>Current APR</span>
            <span className="text-xl font-black text-[#10B981] ml-auto tracking-tight">8.42%</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-[28px] py-6 px-8 border border-white/5 shadow-inner">
          <p className="text-[12px] font-bold leading-relaxed opacity-40 tracking-widest" style={{ color: primaryTextColor }}>
            Liquidity providers earn dynamic yield and <span className="text-[#00A8E8] opacity-100">Protocol points</span> per epoch. Deploy capital to start accruing.
          </p>
        </div>

        <div className="flex gap-6 mt-auto">
          <button onClick={handleDeposit} disabled={!amount || Number(stripCommas(amount)) <= 0} className="nav-pill !py-6 flex-1 bg-[#00A8E8] text-white text-sm font-bold shadow-[0_20px_50px_rgba(0,168,232,0.3)] bounce-hover !rounded-[30px]">Supply</button>
          <button onClick={handleWithdraw} className="nav-pill !py-6 flex-1 bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all bounce-hover !rounded-[30px]">Withdraw</button>
        </div>
      </div>
    </div>
  );
};
