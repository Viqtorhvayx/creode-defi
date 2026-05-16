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
          <h3 className="text-[13px] font-black uppercase tracking-[0.4em] mb-2" style={{ color: labelColor }}>Liquidity Provision</h3>
          <p className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Lend</p>
        </div>
        <div className="bg-[#00A8E8]/10 px-6 py-3 rounded-[24px] border border-[#00A8E8]/20 shadow-inner">
          <p className="text-[11px] font-black uppercase tracking-widest opacity-40 mb-1" style={{ color: primaryTextColor }}>Protocol Points</p>
          <p className="text-2xl font-black text-[#00A8E8]">{points.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-10 flex flex-col flex-grow">
        {/* Uniswap-style Input Box authored by Viqtorhvayx */}
        <div className="uniswap-input-box">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40" style={{ color: primaryTextColor }}>Amount to Provide</label>
            <div className="flex gap-3">
              <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
              <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
              <QuickButton label="Max" onClick={handleMaxSelect} />
            </div>
          </div>
          <div className="flex items-center gap-6 h-20">
            <FormattedNumberInput 
              placeholder="0.00"
              className="w-full bg-transparent text-5xl font-black outline-none border-none p-0 tracking-tighter"
              style={{ color: primaryTextColor }}
              value={amount}
              onValueChange={setAmount}
            />
            <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-md min-w-[160px] justify-center">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-2xl border border-white/10">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tighter text-white">HBAR</span>
            </div>
          </div>
          <p className="text-[12px] font-black text-[#00A8E8] tracking-[0.2em] opacity-60 uppercase">{usdValue} Valuation</p>
        </div>

        {/* Aave-style Data Rows authored by Viqtorhvayx */}
        <div className="space-y-5 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-xl mt-auto">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-black tracking-[0.2em] uppercase opacity-40" style={{ color: primaryTextColor }}>Your Supply</span>
            <span className="text-xl font-black text-white ml-auto tracking-tight">0.00 HBAR</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-black tracking-[0.2em] uppercase opacity-40" style={{ color: primaryTextColor }}>Current APR</span>
            <span className="text-xl font-black text-[#10B981] ml-auto tracking-tight">8.42%</span>
          </div>
        </div>

        <div className="bg-black/30 rounded-[28px] py-6 px-8 border border-white/5 shadow-inner">
          <p className="text-[12px] font-black leading-relaxed opacity-40 uppercase tracking-widest" style={{ color: primaryTextColor }}>
            Liquidity providers earn dynamic yield and <span className="text-[#00A8E8] opacity-100">Protocol Points</span> per epoch. Deploy capital to start accruing.
          </p>
        </div>

        <div className="flex gap-6 mt-auto">
          <button onClick={handleDeposit} disabled={!amount || Number(stripCommas(amount)) <= 0} className="nav-pill !py-6 flex-1 bg-[#00A8E8] text-white text-sm font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(0,168,232,0.3)] bounce-hover !rounded-[30px]">Supply</button>
          <button onClick={handleWithdraw} className="nav-pill !py-6 flex-1 bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all bounce-hover !rounded-[30px]">Withdraw</button>
        </div>
      </div>
    </div>
  );
};
