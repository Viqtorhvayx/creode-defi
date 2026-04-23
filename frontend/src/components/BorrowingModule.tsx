"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Overhauled borrowing module with static header replacement for tab buttons.
 * Updated: Removed the dark mode background capsule for the header to achieve a seamless transparent look.
 */
export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp: initialXP, theme }) => {
  const { borrow } = useWeb3();
  const [amount, setAmount] = useState("");
  
  // Toggle State Management (Maintained for logic)
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow' | 'repay'>('borrow');
  
  // Modal Flow State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isRepaid, setIsRepaid] = useState(false);

  // Simulated live XP
  const [currentXP, setCurrentXP] = useState(initialXP);

  useEffect(() => {
    if (activeTab === 'borrow') {
      const timer = setInterval(() => {
        setCurrentXP(prev => Math.max(prev - 1, 15));
      }, 86400000); // 24 hours
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  const hbarPrice = 0.085; 
  const collateralValue = Number(amount) || 0;
  const maxBorrow = (collateralValue / hbarPrice) * (currentXP / 100);

  // Dynamic Label Logic
  const getLabelText = () => {
    switch (activeTab) {
      case 'deposit': return "Deposit Collateral";
      case 'borrow': return "Borrow HBAR";
      case 'repay': return "Repay HBAR / Withdraw Collateral";
      default: return "Amount";
    }
  };

  /**
   * Synchronized XP Color Coding matching XPGauge.tsx.
   */
  const getXPColor = (val: number) => {
    if (val >= 70) return '#25A18E';
    if (val >= 40) return '#F4E285';
    if (val >= 16) return '#FF5400';
    return '#FF3837';
  };

  const handleActionInitiation = () => {
    if (activeTab === 'repay') {
      setShowModal(true);
      setModalStep(1);
    } else {
      handleExecution();
    }
  };

  const handleExecution = async () => {
    try {
      if (activeTab === 'deposit') {
        alert("Collateral deposited!");
      } else if (activeTab === 'borrow') {
        await borrow(amount);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRepayStep = async () => {
    setTimeout(() => {
      setIsRepaid(true);
      setModalStep(2);
    }, 1500);
  };

  const handleWithdrawStep = async () => {
    setShowModal(false);
    setIsRepaid(false);
    alert("Collateral Withdrawn!");
  };

  // Theme-aware colors
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15_rgba(0,168,232,0.15)] [appearance:textfield]";

  // Exact color for /100 from XPGauge.tsx
  const maxXPColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)';

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full relative">
      {/* 
          Header Transparency Update:
          Removed bg-black/5 and dark:bg-white/5 to strip away the visible rectangle effect.
          The container is now completely transparent while maintaining internal alignment.
      */}
      <div className="flex justify-between items-center mb-8 px-2 py-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Credit Facility</span>
          <span className="text-[14px] font-black" style={{ color: primaryTextColor }}>Borrow</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase block mb-0.5" style={{ color: labelColor }}>Loan Health XP</span>
          <p className="text-[14px] font-black flex items-baseline justify-end">
            <span style={{ color: getXPColor(currentXP) }}>{currentXP}</span>
            <span className="text-[10px] font-bold ml-1" style={{ color: maxXPColor }}>/100</span>
          </p>
        </div>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
        <div>
          <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: labelColor }}>
            {getLabelText()}
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
          </div>
        </div>

        {/* Max Borrowing Limit Box */}
        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl py-2 px-4 border border-[var(--border)] mt-auto">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Max Borrowing Limit</span>
            <span className="text-[11px] font-black" style={{ color: primaryTextColor }}>{maxBorrow.toFixed(2)} HBAR</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8]" style={{ width: `${Math.min((collateralValue / 1000) * 100, 100)}%` }} />
          </div>
          <p className="text-[9px] mt-2 opacity-60" style={{ color: labelColor }}>
            *Starting XP is calculated based on Collateralization Ratio.
          </p>
        </div>

        <button 
          onClick={handleActionInitiation}
          disabled={!amount || Number(amount) <= 0}
          className="btn-action w-full !py-2.5 !h-auto font-bold text-sm tracking-wider"
          style={{ borderRadius: '60px' }}
        >
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} {activeTab === 'repay' ? '& Withdraw' : ''}
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-[var(--border)] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-black uppercase tracking-tight" style={{ color: primaryTextColor }}>
                Step {modalStep}: {modalStep === 1 ? 'HBAR Repayment' : 'Collateral Release'}
              </h4>
              <button onClick={() => setShowModal(false)} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
            </div>

            <div className="mb-8 p-4 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm opacity-80" style={{ color: labelColor }}>You are about to repay your active HBAR loan. This will stop the daily XP decay.</p>
                  <div className="flex justify-between font-bold">
                    <span>Total Debt</span>
                    <span className="!text-[#00A8E8]">540.22 HBAR</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm opacity-80" style={{ color: labelColor }}>Repayment confirmed! You can now safely withdraw your collateral.</p>
                  <div className="flex justify-between font-bold">
                    <span>Collateral Release</span>
                    <span className="!text-emerald-500">1,200.00 USDT</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={modalStep === 1 ? handleRepayStep : handleWithdrawStep}
              className="w-full btn-action !py-4 font-black uppercase tracking-[0.2em] text-[10px]"
              style={{ borderRadius: '60px' }}
            >
              {modalStep === 1 ? 'Confirm Repayment' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
