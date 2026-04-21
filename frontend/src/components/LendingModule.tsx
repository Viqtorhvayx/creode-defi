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
 * @dev Module for providing liquidity with explicit theme-detected inline styling for labels.
 */
export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const { provideLiquidity } = useWeb3();
  const [amount, setAmount] = useState("");

  const handleAction = async () => {
    try {
      await provideLiquidity(amount);
      alert("Liquidity deployed successfully!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Matched intensity for labels (Matching 'SYSTEM NOTIFICATION' opacity-60 white in Dark Mode)
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="industrial-panel bg-surface">
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

      <div className="space-y-6">
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
            className="industrial-input text-black"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-[var(--border)]">
          <p 
            className="text-[10px] font-medium leading-relaxed"
            style={{ color: labelColor }}
          >
            By providing liquidity, users earn <span className="!text-[#00A8E8] font-bold">lending points</span> per HBAR every 24 hours. Points determine eligibility for future protocol incentives.
          </p>
        </div>

        {/* Button label renamed to 'Initialize' as requested */}
        <button 
          onClick={handleAction}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full"
        >
          Initialize
        </button>
      </div>
    </div>
  );
};
