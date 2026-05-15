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
          <div className="relative flex items-center">
            <FormattedNumberInput 
              placeholder="0.00"
              className={numericInputClasses + " pr-28"}
              style={{ 
                backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                color: theme === 'dark' ? '#FFFFFF' : '#000000'
              }}
              value={amount}
              onValueChange={setAmount}
            />
            <div className="absolute right-3 flex items-center gap-2 pointer-events-none bg-[#00A8E8]/10 rounded-[60px] px-2 py-1 border border-[#00A8E8]/5">
              <div 
                className="flex items-center justify-center w-[18px] h-[18px] rounded-full"
                style={{ backgroundColor: '#000000' }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-[11px] h-[11px]" 
                  style={{ color: '#FFFFFF' }}
                >
                  <path fillRule="evenodd" clipRule="evenodd" d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z" />
                </svg>
              </div>
              <span className="text-[10px] font-black tracking-widest text-[#00A8E8]">HBAR</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-2 px-2">
            <span className="text-[10px] font-bold" style={{ color: '#00A8E8' }}>{usdValue}</span>
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
