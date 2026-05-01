"use client";

/* * Developer: [Viqtorhvayx]
 * Component: BorrowingModule
 * Description: Credit facility module integrated with the Advanced Identity Engine.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp: initialXP, theme }) => {
  const { balance, balanceSymbol } = useWallet();
  const [collateralAmount, setCollateralAmount] = useState("");
  
  const collateralValue = Number(stripCommas(collateralAmount)) || 0;
  const calculatedHbarLimit = (collateralValue * 0.75) / 0.10;
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow' | 'repay'>('borrow');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isRepaid, setIsRepaid] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasInput = collateralAmount.length > 0 && Number(stripCommas(collateralAmount)) > 0;
  const [collateralToken, setCollateralToken] = useState<'USDT' | 'USDC'>('USDT');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasInput) setIsClicked(false);
  }, [hasInput]);

  const [currentXP, setCurrentXP] = useState(initialXP);

  useEffect(() => {
    if (activeTab === 'borrow') {
      const timer = setInterval(() => {
        setCurrentXP(prev => Math.max(prev - 1, 15));
      }, 86400000); 
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  const getLabelText = () => {
    switch (activeTab) {
      case 'deposit': return "Deposit Collateral";
      case 'borrow': return `Borrow ${balanceSymbol}`;
      case 'repay': return `Repay ${balanceSymbol} / Withdraw Collateral`;
      default: return "Amount";
    }
  };

  const getXPColor = (val: number) => {
    if (val >= 70) return '#25A18E';
    if (val >= 40) return '#F4E285';
    if (val >= 16) return '#FF5400';
    return '#FF3837';
  };

  const handleAction = () => {
    if (!collateralAmount || Number(stripCommas(collateralAmount)) <= 0) return;
    setIsClicked(true);
    if (activeTab === 'repay') {
      setShowModal(true);
      setModalStep(1);
    } else {
      handleExecution();
    }
  };

  const handleExecution = async () => {
    alert("Transaction initialized!");
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

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
  const maxXPColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)';

  const getTabClasses = (tab: 'deposit' | 'borrow' | 'repay') => {
    const isActive = activeTab === tab;
    const isRepayButton = tab === 'repay';
    const fontSize = isRepayButton ? 'text-[9px]' : 'text-[10px]';
    const wrapControl = isRepayButton ? 'whitespace-nowrap' : '';
    const base = `flex-1 !py-1.5 !h-auto font-bold transition-all duration-300 rounded-[60px] ${fontSize} ${wrapControl} tracking-tight px-1`;
    return isActive 
      ? `${base} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${base} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

  const getActionButtonClasses = () => {
    const baseClasses = "w-full !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] text-sm hover:-translate-y-1 hover:shadow-md active:scale-95";
    return (hasInput && isClicked)
      ? `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

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
    setCollateralAmount(formatWithCommas(targetAmount));
    setIsClicked(false);
  };

  const handleMaxSelect = () => {
    setCollateralAmount(formatWithCommas(balance));
    setIsClicked(false);
  };

  const usdValue = (Number(stripCommas(collateralAmount)) * 0.0942).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="industrial-panel bg-surface flex flex-col h-full relative">
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

      <div className="flex gap-2 mb-2 bg-black/5 dark:bg-white/5 p-1 rounded-[60px]">
        <button onClick={() => setActiveTab('deposit')} className={getTabClasses('deposit')}>Deposit</button>
        <button onClick={() => setActiveTab('borrow')} className={getTabClasses('borrow')}>Borrow</button>
        <button onClick={() => setActiveTab('repay')} className={getTabClasses('repay')}>Repay & Withdraw</button>
      </div>

      <div className="space-y-6 flex flex-col flex-grow">
        <div className="mt-1">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-bold uppercase block" style={{ color: labelColor }}>{getLabelText()}</label>
            {activeTab === 'deposit' && (
              <div className="flex items-center text-[10px] font-bold pointer-events-auto">
                <button onClick={() => setCollateralToken('USDT')} className={`flex items-center transition-colors hover:opacity-80 ${collateralToken === 'USDT' ? 'text-[#00A8E8]' : 'text-gray-500'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <circle cx="12" cy="12" r="12" fill="#26A17B"/><path d="M13.43 10.45V18.5H10.57V10.45H7V8.5H17V10.45H13.43Z" fill="white"/>
                  </svg>
                  USDT
                </button>
                <span className="mx-2 text-gray-500">|</span>
                <button onClick={() => setCollateralToken('USDC')} className={`flex items-center transition-colors hover:opacity-80 ${collateralToken === 'USDC' ? 'text-[#00A8E8]' : 'text-gray-500'}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <circle cx="12" cy="12" r="12" fill="#2775CA"/><path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM11.5 14.5V15.5H12.5V14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5C14.5 12.9477 14.0523 12.5 13.5 12.5H10.5C9.94772 12.5 9.5 12.0523 9.5 11.5C9.5 10.9477 9.94772 10.5 10.5 10.5H11.5V9.5H12.5V10.5H13.5V11.5H14.5V10.5C14.5 9.39543 13.6046 8.5 12.5 8.5V7.5H11.5V8.5H10.5C9.39543 8.5 8.5 9.39543 8.5 10.5C8.5 11.6046 9.39543 12.5 10.5 12.5H13.5C14.0523 12.5 14.5 12.9477 14.5 13.5C14.5 14.0523 14.0523 14.5 13.5 14.5H12.5V15.5H11.5V14.5H10.5V13.5H9.5V14.5C9.5 15.6046 10.3954 16.5 11.5 16.5V15.5H12.5V14.5H11.5Z" fill="white" />
                  </svg>
                  USDC
                </button>
              </div>
            )}
          </div>
          <div className="relative">
            <FormattedNumberInput 
              placeholder="0.00"
              className={numericInputClasses}
              style={{ backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#000000', marginTop: '-1px' }}
              value={collateralAmount}
              onValueChange={(val) => { setCollateralAmount(val); setIsClicked(false); }}
            />
            <div className="flex justify-between items-baseline mt-2 px-2">
              <span className="text-[10px] font-bold" style={{ color: labelColor }}>${usdValue}</span>
              <div className="flex gap-1">
                <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
                <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
                <QuickButton label="Max" onClick={handleMaxSelect} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl py-2 px-4 border border-[var(--border)] mt-auto">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Maximum Borrowing Limit</span>
            <span className="text-[11px] font-black" style={{ color: primaryTextColor }}>{calculatedHbarLimit.toFixed(2)} {balanceSymbol}</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8]" style={{ width: `${Math.min((collateralValue / 1000) * 100, 100)}%` }} />
          </div>
          <p className="text-[10px] mt-2" style={{ color: labelColor }}>Starting XP is calculated based on Collateralization Ratio.</p>
        </div>

        <div className="flex gap-4 mt-auto">
          <button onClick={handleAction} disabled={!collateralAmount || Number(stripCommas(collateralAmount)) <= 0} className={getActionButtonClasses()}>
            {activeTab === 'repay' ? 'Repay & Withdraw' : activeTab === 'borrow' ? `Borrow ${balanceSymbol}` : 'Deposit Collateral'}
          </button>
        </div>
      </div>

      {showModal && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowModal(false); setIsClicked(false); }} />
          <div className="relative bg-black/60 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300 transform-gpu">
            <div className="flex justify-between items-start mb-6">
              <h4 className={`text-lg font-black tracking-tight`} style={{ color: '#FFFFFF' }}>
                Step {modalStep}: {modalStep === 1 ? `${balanceSymbol} Repayment` : 'Collateral Release'}
              </h4>
              <button onClick={() => { setShowModal(false); setIsClicked(false); }} className="text-white hover:opacity-80 transition-opacity mt-[-12px] mr-[-12px] p-2">✕</button>
            </div>
            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10">
              {modalStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm opacity-80 text-white/60">You are about to repay your active {balanceSymbol} loan. This will stop the daily XP decay.</p>
                  <div className="flex justify-between font-bold text-white"><span>Total Debt</span><span className="!text-[#00A8E8]">540.22 {balanceSymbol}</span></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm opacity-80 text-white/60">Repayment confirmed! You can now safely withdraw your collateral.</p>
                  <div className="flex justify-between font-bold text-white"><span>Collateral Release</span><span className="!text-emerald-500">1,200.00 USDT</span></div>
                </div>
              )}
            </div>
            <button onClick={modalStep === 1 ? handleRepayStep : handleWithdrawStep} className="w-full btn-action !normal-case !py-4 font-black tracking-[0.2em] text-sm" style={{ borderRadius: '60px', fontVariant: 'normal' }}>
              {modalStep === 1 ? 'Confirm Payment' : 'Confirm Withdrawal'}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
