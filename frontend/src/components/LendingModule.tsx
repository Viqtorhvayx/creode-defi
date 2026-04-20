"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title LendingModule
 * @author Viqtorhvayx
 * @dev Module for providing liquidity with white input boxes and pure white typography in Dark Mode.
 */
export const LendingModule: React.FC<{ points: number }> = ({ points }) => {
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

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-black/30 dark:text-white">Liquidity Pool</h3>
          <p className="text-xl font-black text-black dark:text-white">Deploy Liquidity</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-black/30 dark:text-white uppercase">Earned Points</p>
          <p className="text-lg font-black text-accent-blue">{points.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-bold text-black/40 dark:text-white uppercase block mb-2">Amount to Provide (HBAR)</label>
          <input 
            type="number" 
            placeholder="0.00"
            className="industrial-input" // Note: industrial-input utility is white bg with black text even in dark mode
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-[var(--border)]">
          <p className="text-[10px] font-medium text-black/60 dark:text-white leading-relaxed">
            By providing liquidity, you earn <span className="text-accent-blue font-bold">Lending Points</span> per HBAR per hour. Points determine your eligibility for future protocol incentives.
          </p>
        </div>

        <button 
          onClick={handleAction}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full"
        >
          Deploy Liquidity
        </button>
      </div>
    </div>
  );
};
