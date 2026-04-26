"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWeb3 } from '../context/Web3Context';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Overhauled borrowing module with exact aesthetic mirroring of the Lending section.
 * Updated: Replicated the 'Withdraw' button's styling and interaction logic 1:1, 
 * ensuring it is visually and functionally indistinguishable from the reference source of truth.
 */
export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp: initialXP, theme }) => {
  const { borrow, balance } = useWeb3();
  const [amount, setAmount] = useState("");
  
  // Toggle State Management
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow' | 'repay'>('borrow');
  
  // Modal Flow State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isRepaid, setIsRepaid] = useState(false);

  // Interaction State Logic
  const [isClicked, setIsClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasInput = amount.length > 0 && Number(amount) > 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset isClicked if input becomes empty
  useEffect(() => {
    if (!hasInput) setIsClicked(false);
  }, [hasInput]);

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

  const handleAction = () => {
    if (!amount || Number(stripCommas(amount)) <= 0) return;
    setIsClicked(true);
    if (activeTab === 'repay') {
      setShowModal(true);
      setModalStep(1);
    } else {
      handleExecution();
    }
  };

  const handleExecution = async () => {
    try {
      const rawAmount = stripCommas(amount);
      if (activeTab === 'deposit') {
        alert("Collateral deposited!");
      } else if (activeTab === 'borrow') {
        await borrow(rawAmount);
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
    setIsClicked(false);
    alert("Collateral Withdrawn!");
  };

  // Quick Select Logic
  const handleQuickSelect = (percent: number) => {
    const numericBalance = Number(balance) || 0;
    const targetAmount = (numericBalance * (percent / 100)).toFixed(2);
    setAmount(targetAmount);
  };

  const handleMaxSelect = () => {
    setAmount(Number(balance).toFixed(2));
  };

  // Theme-aware colors
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  
  /**
   * Restored input classes to match LendingModule.tsx 1:1.
   */
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  // Exact color for /100 from XPGauge.tsx
  const maxXPColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)';

  /**
   * Tab Styling matching original industrial logic.
   */
  const getTabClasses = (tab: 'deposit' | 'borrow' | 'repay') => {
    const isActive = activeTab === tab;
    const isRepayButton = tab === 'repay';
    const fontSize = isRepayButton ? 'text-[9px]' : 'text-[10px]';
    const wrapControl = isRepayButton ? 'whitespace-nowrap' : '';
    
    const base = `flex-1 !py-1.5 !h-auto font-bold transition-all duration-300 rounded-[60px] ${fontSize} ${wrapControl} tracking-tight px-1`;
    
    if (isActive) {
      return `${base} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`;
    } else {
      return `${base} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
    }
  };

  /**
   * Action Button Classes: EXACT replication of LendingModule's 'Withdraw' button.
   * Matches fill color, text color, font weight, border radius, and interactive behaviors 1:1.
   */
  const getActionButtonClasses = () => {
    const baseClasses = "w-full !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] text-sm hover:-translate-y-1 hover:shadow-md active:scale-95";
    const isActive = hasInput && isClicked;
    
    if (isActive) {
      // Replicated 'Active' state (Solid Primary Blue + White Text)
      return `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`;
    } else {
      // Replicated 'Idle' state (10% Blue Background + Blue Text)
      return `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
    }
  };

  /**
   * QuickSelect Button Styling
   */
  const QuickButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="text-[8px] font-black transition-all duration-300 rounded-[60px] !py-1 !h-auto px-2 tracking-tighter bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20 active:scale-95 uppercase"
    >
      {label}
    </button>
  );



  const handleQuickSelect = (percent: number) => {
    const numericBalance = Number(balance) || 0;
    const targetAmount = (numericBalance * (percent / 100)).toString();
    setAmount(formatWithCommas(targetAmount));
    setIsClicked(false);
  };

  const handleMaxSelect = () => {
    setAmount(formatWithCommas(balance.toString()));
    setIsClicked(false);
  };

  // Dynamic USD Value Calculation (Simulated HBAR/USD price = 0.0942)
  const usdValue = (Number(stripCommas(amount)) * 0.0942).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full relative">
      {/* 
          Section Header: Baseline Synchronized
      */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Credit Facility</span>
          <span className="text-xl font-black" style={{ color: primaryTextColor }}>Borrow</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold uppercase block" style={{ color: labelColor }}>Loan Health XP</span>
          <p className="text-lg font-black flex items-baseline justify-end">
            <span style={{ color: getXPColor(currentXP) }}>{currentXP}</span>
            <span className="text-[10px] font-bold ml-1" style={{ color: maxXPColor }}>/100</span>
          </p>
        </div>
      </div>

      {/* 
          Toggle Buttons
      */}
      <div className="flex gap-2 mb-2 bg-black/5 dark:bg-white/5 p-1 rounded-[60px]">
        <button onClick={() => setActiveTab('deposit')} className={getTabClasses('deposit')}>Deposit</button>
        <button onClick={() => setActiveTab('borrow')} className={getTabClasses('borrow')}>Borrow</button>
        <button onClick={() => setActiveTab('repay')} className={getTabClasses('repay')}>Repay & Withdraw</button>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
        <div className="mt-1">
          <label 
            className="text-[10px] font-bold uppercase block" 
            style={{ 
              color: labelColor,
              marginBottom: '3px'
            }}
          >
            {getLabelText()}
          </label>
          <div className="relative">
            <FormattedNumberInput 
              placeholder="0.00"
              className={numericInputClasses}
              style={{ 
                backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                color: theme === 'dark' ? '#FFFFFF' : '#000000',
                marginTop: '-1px'
              }}
              value={amount}
              onValueChange={(val) => {
                setAmount(val);
                setIsClicked(false);
              }}
            />

            {/* USD Value Display and Quick Select Controls: Replicated from Vault section */}
            <div className="flex justify-between items-baseline mt-2 px-2">
              <span className="text-[10px] font-bold" style={{ color: labelColor }}>
                ${usdValue}
              </span>
              <div className="flex gap-1">
                <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
                <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
                <QuickButton label="Max" onClick={handleMaxSelect} />
              </div>
            </div>
          </div>
        </div>

        {/* Max Borrowing Limit Box: Baseline-synchronized with Lend section */}
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

        {/* 
            Primary Action Button: Indistinguishable from the 'Withdraw' button in LendingSection.
            Uses matched classes and Sentence case labeling ('Borrow').
        */}
        <div className="flex gap-4 mt-auto">
          <button 
            onClick={handleAction}
            disabled={!amount || Number(stripCommas(amount)) <= 0}
            className={getActionButtonClasses()}
          >
            {activeTab === 'repay' ? 'Repay & Withdraw' : activeTab === 'borrow' ? 'Borrow HBAR' : 'Deposit Collateral'}
          </button>
        </div>
      </div>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Decoupled Backdrop: Prevents composite flickering on content hover */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => { setShowModal(false); setIsClicked(false); }}
          />
          
          <div className="relative bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 transform-gpu">
            <div className="flex justify-between items-start mb-6">
              {/* Hardened Header with Explicit Theme Detection authored by Viqtorhvayx */}
              <h4 
                className="text-lg font-black tracking-tight" 
                style={{ color: theme === 'light' ? '#FFFFFF' : '#FFFFFF' }} // Forced White in Light Mode as strictly requested
              >
                Step {modalStep}: {modalStep === 1 ? 'HBAR Repayment' : 'Collateral Release'}
              </h4>
              <button 
                onClick={() => { setShowModal(false); setIsClicked(false); }} 
                className="opacity-40 hover:opacity-100 transition-opacity mt-[-12px] mr-[-12px] p-2"
                style={{ color: theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)' }} // Explicitly reused REPUTATION METRIC theme tokens
              >
                ✕
              </button>
            </div>

            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm opacity-80 text-white/60">You are about to repay your active HBAR loan. This will stop the daily XP decay.</p>
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Debt</span>
                    <span className="!text-[#00A8E8]">540.22 HBAR</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm opacity-80 text-white/60">Repayment confirmed! You can now safely withdraw your collateral.</p>
                  <div className="flex justify-between font-bold text-white">
                    <span>Collateral Release</span>
                    <span className="!text-emerald-500">1,200.00 USDT</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={modalStep === 1 ? handleRepayStep : handleWithdrawStep}
              className="w-full btn-action !py-4 font-black tracking-[0.2em] text-[10px]"
              style={{ 
                borderRadius: '60px',
                textTransform: 'none', // Strict Title Case preservation: Only "C" and "P" uppercase
                fontVariant: 'normal'
              }}
            >
              {modalStep === 1 ? 'Confirm Payment' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
