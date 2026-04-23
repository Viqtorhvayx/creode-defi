"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface LendingModuleProps {
  points: number;
  theme?: 'light' | 'dark';
}

/**
 * @title LendingModule
 * @author Viqtorhvayx
 * @dev Module for providing liquidity with synchronized button state management.
 * Updated: Swapped vertical positions of the Lending Points note and the Amount input section.
 */
export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const { provideLiquidity } = useWeb3();
  const [amount, setAmount] = useState("");
  
  // Interactive State Management matching Vault behavior
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw'>('deposit');

  const handleDeposit = async () => {
    setActiveAction('deposit');
    try {
      await provideLiquidity(amount);
      alert("Liquidity deployed successfully!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleWithdraw = async () => {
    setActiveAction('withdraw');
    try {
      alert("Liquidity withdrawal requested!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Matched intensity for labels
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  /**
   * Helper to determine button styles based on active state.
   */
  const getButtonClasses = (action: 'deposit' | 'withdraw') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] text-sm hover:-translate-y-1 hover:shadow-md active:scale-95";
    
    if (isActive) {
      return `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`;
    } else {
      return `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
    }
  };

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: labelColor }}
          >
            Lending Pool
          </h3>
          <p className="text-xl font-black" style={{ color: primaryTextColor }}>Lend</p>
        </div>
        <div className="text-right">
          <p 
            className="text-[10px] font-bold uppercase"
            style={{ color: labelColor }}
          >
            Earned Points
          </p>
          <p className="text-lg font-black !text-[#00A8E8]">{points.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
        {/* Lending Points Note: Position swapped to top */}
        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-[var(--border)]">
          <p 
            className="text-[10px] font-medium leading-relaxed"
            style={{ color: labelColor }}
          >
            By providing liquidity, users earn <span className="!text-[#00A8E8] font-bold">lending points</span> per HBAR every 24 hours. Points determine eligibility for future protocol incentives.
          </p>
        </div>

        {/* Amount Input Section: Position swapped to below note */}
        <div>
          <label 
            className="text-[10px] font-bold uppercase block mb-2"
            style={{ color: labelColor }}
          >
            Amount to Provide (HBAR)
          </label>
          <input 
            type="number" 
            placeholder="0.00"
            className={numericInputClasses}
            style={{ 
              backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
              color: theme === 'dark' ? '#FFFFFF' : '#000000'
            }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="flex flex-row gap-4 w-full mt-auto">
          <button 
            onClick={handleDeposit}
            disabled={!amount || Number(amount) <= 0}
            className={getButtonClasses('deposit')}
          >
            Deposit
          </button>
          <button 
            onClick={handleWithdraw}
            className={getButtonClasses('withdraw')}
          >
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
};
