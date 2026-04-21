"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Module for reputation-based borrowing with explicit theme-detected inline styling.
 */
export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp, theme }) => {
  const { borrow } = useWeb3();
  const [amount, setAmount] = useState("");
  const [collateralType, setCollateralType] = useState<'USDT' | 'USDC'>('USDT');

  const hbarPrice = 0.085; 
  const collateralValue = Number(amount) || 0;
  const maxBorrow = (collateralValue / hbarPrice) * (xp / 100);

  const handleAction = async () => {
    try {
      await borrow(amount);
      alert("Borrowing request initialized!");
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
            Credit Facility
          </h3>
          {/* Sub-title updated to Borrow HBAR as requested */}
          <p className="text-xl font-black" style={{ color: primaryTextColor }}>Borrow HBAR</p>
        </div>
        {/* XP Multiplier Badge */}
        <div className="bg-[#00A8E8]/10 px-2 py-0.5 rounded-full border border-[#00A8E8]/20 flex items-center justify-center min-w-[fit-content]">
          <span className="text-[9px] font-bold !text-[#00A8E8] uppercase whitespace-nowrap leading-none">
            XP Multiplier: {(xp/100).toFixed(2)}x
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label 
            className="text-[10px] font-bold uppercase block mb-2"
            style={{ color: labelColor }}
          >
            Deposit Collateral
          </label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="0.00"
              className="industrial-input text-black"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button 
                onClick={() => setCollateralType('USDT')}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${collateralType === 'USDT' ? 'bg-[#00A8E8] text-white' : 'bg-black/5 dark:bg-black/10 text-black/40 dark:text-white'}`}
              >
                USDT
              </button>
              <button 
                onClick={() => setCollateralType('USDC')}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${collateralType === 'USDC' ? 'bg-[#00A8E8] text-white' : 'bg-black/5 dark:bg-black/10 text-black/40 dark:text-white'}`}
              >
                USDC
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex justify-between mb-2">
            <span 
              className="text-[10px] font-bold uppercase"
              style={{ color: labelColor }}
            >
              Max Borrowing Capacity
            </span>
            <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>{maxBorrow.toFixed(2)} HBAR</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8] w-2/3 opacity-50" />
          </div>
        </div>

        {/* Action Button label updated to Borrow HBAR as requested */}
        <button 
          onClick={handleAction}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full"
        >
          Borrow HBAR
        </button>
      </div>
    </div>
  );
};
