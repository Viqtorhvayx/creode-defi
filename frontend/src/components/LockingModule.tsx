"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title LockingModule
 * @author Viqtorhvayx
 * @dev Module for asset locking with time-based yield and Premium Dark Mode support.
 */
export const LockingModule: React.FC = () => {
  const { lockAssets } = useWeb3();
  const [amount, setAmount] = useState("");
  const [weeks, setWeeks] = useState(3);

  const handleAction = async () => {
    try {
      const unlockDate = Math.floor(Date.now() / 1000) + (weeks * 7 * 24 * 60 * 60);
      await lockAssets(amount, unlockDate);
      alert("Lock-up initialized!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-black/30 dark:text-[#94A3B8]">Time-Lock Engine</h3>
          <p className="text-2xl font-black text-black dark:text-[#F8FAFC]">Initialize Lock-up</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-black/30 dark:text-[#94A3B8] uppercase">Target Yield</p>
          <p className="text-xl font-black text-accent-blue">0.30% <span className="text-xs font-medium text-black/20 dark:text-[#94A3B8]">APY</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-black/40 dark:text-[#94A3B8] uppercase block mb-2">Amount to Lock (HBAR)</label>
            <input 
              type="number" 
              placeholder="0.00"
              className="industrial-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-black/40 dark:text-[#94A3B8] uppercase block mb-2">Duration: {weeks} Weeks</label>
            <input 
              type="range" 
              min="3" 
              max="52" 
              className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-blue"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border)] rounded-2xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-black/40 dark:text-[#94A3B8] uppercase">Early Exit Fee</span>
              <span className="text-[11px] font-black text-red-500">5.00%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-black/40 dark:text-[#94A3B8] uppercase">Maturity Date</span>
              <span className="text-[11px] font-bold text-black dark:text-[#F8FAFC]">
                {new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          <button 
            onClick={handleAction}
            disabled={!amount || Number(amount) <= 0}
            className="btn-action w-full mt-6"
          >
            Initialize Lock-up
          </button>
        </div>
      </div>
    </div>
  );
};
