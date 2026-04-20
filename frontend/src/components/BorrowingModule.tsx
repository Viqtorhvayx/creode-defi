"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Module for reputation-based borrowing with strict targeted Dark Mode text overrides.
 */
export const BorrowingModule: React.FC<{ xp: number }> = ({ xp }) => {
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

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-black/30 dark:text-white">Credit Facility</h3>
          <p className="text-xl font-black text-black dark:text-white">Initialize Credit Request</p>
        </div>
        <div className="bg-[#00A8E8]/10 px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold !text-[#00A8E8] uppercase">XP Multiplier: {(xp/100).toFixed(2)}x</span>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-bold text-black/40 dark:text-white uppercase block mb-2">Deposit Collateral</label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="0.00"
              className="industrial-input text-black" // Exception: text-black for white box readability
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
            <span className="text-[10px] font-bold text-black/40 dark:text-white uppercase">Max Borrowing Capacity</span>
            <span className="text-[11px] font-bold text-black dark:text-white">{maxBorrow.toFixed(2)} HBAR</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8] w-2/3 opacity-50" />
          </div>
        </div>

        <button 
          onClick={handleAction}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full"
        >
          Initialize Credit Request
        </button>
      </div>
    </div>
  );
};
