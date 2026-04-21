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

  /**
   * Shared classes for professional numerical inputs:
   * - No outline/ring even on focus
   * - Elevated blue undershadow for depth
   * - Smooth 60px corner radius
   * - Suppressed default spinners
   */
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: labelColor }}
          >
            Credit Facility
          </h3>
          <p className="text-xl font-black" style={{ color: primaryTextColor }}>Borrow HBAR</p>
        </div>
        {/* XP Multiplier Badge */}
        <div className="bg-[#00A8E8]/10 px-2 py-0.5 rounded-full border border-[#00A8E8]/20 flex items-center justify-center min-w-[fit-content]">
          <span className="text-[9px] font-bold !text-[#00A8E8] uppercase whitespace-nowrap leading-none">
            XP Multiplier: {(xp/100).toFixed(2)}x
          </span>
        </div>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
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
              className={numericInputClasses}
              style={{ 
                backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                color: theme === 'dark' ? '#FFFFFF' : '#000000'
              }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
              <button 
                onClick={() => setCollateralType('USDT')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border ${collateralType === 'USDT' ? 'bg-[#00A8E8]/15 border-[#00A8E8] shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=040" alt="USDT" className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase" style={{ color: primaryTextColor }}>USDT</span>
              </button>
              <button 
                onClick={() => setCollateralType('USDC')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-300 border ${collateralType === 'USDC' ? 'bg-[#00A8E8]/15 border-[#00A8E8] shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.svg?v=040" alt="USDC" className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase" style={{ color: primaryTextColor }}>USDC</span>
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
            <span className="text-[11px] font-black" style={{ color: primaryTextColor }}>{maxBorrow.toFixed(2)} HBAR</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8] w-2/3 opacity-50" />
          </div>
        </div>

        {/* Action Button label updated to 'Initialize', with explicit 60px border radius */}
        <button 
          onClick={handleAction}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full mt-auto"
          style={{ borderRadius: '60px' }}
        >
          Initialize
        </button>
      </div>
    </div>
  );
};
