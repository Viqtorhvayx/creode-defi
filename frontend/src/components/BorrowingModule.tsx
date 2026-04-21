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

  // Simple SVG Icons
  const USDTLogo = ({ active }: { active: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "white" : "#26A17B"} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7z"/>
    </svg>
  );

  const USDCLogo = ({ active }: { active: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={active ? "white" : "#2775CA"} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
    </svg>
  );

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
            {/* Updated Selection Box with soft blue fill and no border */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-2xl">
              <button 
                onClick={() => setCollateralType('USDT')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all duration-300 border-none ${collateralType === 'USDT' ? 'bg-[#00A8E8]/20 shadow-none' : 'opacity-60 hover:opacity-100'}`}
              >
                <USDTLogo active={false} />
                <span className="text-[10px] font-black uppercase" style={{ color: primaryTextColor }}>USDT</span>
              </button>
              <button 
                onClick={() => setCollateralType('USDC')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all duration-300 border-none ${collateralType === 'USDC' ? 'bg-[#00A8E8]/20 shadow-none' : 'opacity-60 hover:opacity-100'}`}
              >
                <USDCLogo active={false} />
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
