"use client";

/* * Developer: [Viqtorhvayx]
 * Component: LendingModule
 * Description: Liquidity provision module integrated with the Advanced Identity Engine.
 */

import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';

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

  const usdValue = (Number(stripCommas(amount)) * 0.0942).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  const getButtonClasses = (action: 'deposit' | 'withdraw') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] text-sm hover:-translate-y-1 hover:shadow-md active:scale-95";
    return isActive 
      ? `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Lending Pool</h3>
          <p className="text-xl font-black" style={{ color: primaryTextColor }}>Lend</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Earned Points</p>
          <p className="text-lg font-black !text-[#00A8E8]">{points.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
        <div className="mt-8">
          <label className="text-[10px] font-bold uppercase block mb-1" style={{ color: labelColor }}>Amount to Provide ({balanceSymbol})</label>
          <FormattedNumberInput 
            placeholder="0.00"
            className={numericInputClasses}
            style={{ 
              backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
              color: theme === 'dark' ? '#FFFFFF' : '#000000'
            }}
            value={amount}
            onValueChange={setAmount}
          />
          <div className="flex justify-between items-baseline mt-2 px-2">
            <span className="text-[10px] font-bold" style={{ color: labelColor }}>${usdValue}</span>
            <div className="flex gap-1">
              <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
              <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
              <QuickButton label="Max" onClick={handleMaxSelect} />
            </div>
          </div>
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl py-2 px-4 border border-[var(--border)] mt-auto">
          <p className="text-[10px] font-medium leading-relaxed" style={{ color: labelColor }}>
            By providing liquidity, users earn <span className="!text-[#00A8E8] font-bold">lending points</span> per {balanceSymbol} every 24 hours. Points determine eligibility for future protocol incentives.
          </p>
        </div>

        <div className="flex flex-row gap-4 w-full">
          <button onClick={handleDeposit} disabled={!amount || Number(stripCommas(amount)) <= 0} className={getButtonClasses('deposit')}>Deposit</button>
          <button onClick={handleWithdraw} className={getButtonClasses('withdraw')}>Withdraw</button>
        </div>
      </div>
    </div>
  );
};
