"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface LockingModuleProps {
  theme?: 'light' | 'dark';
}

/**
 * @title LockingModule
 * @author Viqtorhvayx
 * @dev Module for asset locking with explicit theme-detected inline styling for labels.
 */
export const LockingModule: React.FC<LockingModuleProps> = ({ theme }) => {
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
            Time-Lock Engine
          </h3>
          <p className="text-2xl font-black" style={{ color: primaryTextColor }}>Savings & Lock-up</p>
        </div>
        <div className="text-right">
          <p 
            className="text-[10px] font-bold uppercase"
            style={{ color: labelColor }}
          >
            Target Yield
          </p>
          <p className="text-xl font-black !text-[#00A8E8]">
            0.30% 
            <span 
              className="text-xs font-medium ml-1"
              style={{ color: labelColor }}
            >
              APY
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label 
              className="text-[10px] font-bold uppercase block mb-2"
              style={{ color: labelColor }}
            >
              Amount to Lock (HBAR)
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              className="industrial-input text-black" // Exception: text-black for white box readability
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label 
              className="text-[10px] font-bold uppercase block mb-2"
              style={{ color: labelColor }}
            >
              Duration: {weeks} Weeks
            </label>
            <input 
              type="range" 
              min="3" 
              max="52" 
              className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00A8E8]"
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border)] rounded-2xl">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span 
                className="text-[10px] font-bold uppercase"
                style={{ color: labelColor }}
              >
                Early Exit Fee
              </span>
              <span className="text-[11px] font-black !text-red-500">5.00%</span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-[10px] font-bold uppercase"
                style={{ color: labelColor }}
              >
                Maturity Date
              </span>
              <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>
                {new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </span>
            </div>
          </div>
          
          {/* Button Text simplified as requested */}
          <button 
            onClick={handleAction}
            disabled={!amount || Number(amount) <= 0}
            className="btn-action w-full mt-6"
          >
            Initialize
          </button>
        </div>
      </div>
    </div>
  );
};
