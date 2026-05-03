"use client";

/* * Developer: [Viqtorhvayx]
 * Component: BorrowingModule
 * Description: Credit facility module integrated with the Advanced Identity Engine.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp: initialXP, theme }) => {
  const { balance, balanceSymbol } = useWallet();
  const [hbarInput, setHbarInput] = useState("");
  
  const hbarInputNumeric = Number(stripCommas(hbarInput)) || 0;
  const calculatedHbarLimit = (hbarInputNumeric * 0.75) / 0.10;
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow' | 'repay'>('deposit');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [isRepaid, setIsRepaid] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasInput = hbarInput.length > 0 && Number(stripCommas(hbarInput)) > 0;
  const [collateralToken, setCollateralToken] = useState<'USDT' | 'USDC'>('USDT');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
    if (!hbarInput || Number(stripCommas(hbarInput)) <= 0) return;
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
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-semibold";
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
    setHbarInput(formatWithCommas(targetAmount));
    setIsClicked(false);
  };

  const handleMaxSelect = () => {
    setHbarInput(formatWithCommas(balance));
    setIsClicked(false);
  };

  const hbarPrice = usePythPrice();

  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(stripCommas(hbarInput)) || 0) * hbarPrice);

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
            </div>
            <div className="relative flex items-center">
              <FormattedNumberInput 
                placeholder="0.00"
                className={numericInputClasses + " pr-32"}
                style={{ backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF', color: theme === 'dark' ? '#FFFFFF' : '#000000', marginTop: '-1px' }}
                value={hbarInput}
                onValueChange={(val) => { setHbarInput(val); setIsClicked(false); }}
              />
              
              {/* Conditional Badges authored by Viqtorhvayx */}
              {activeTab === 'deposit' ? (
                /* Interactive Asset Dropdown authored by Viqtorhvayx */
                <div 
                  className="absolute right-3 flex items-center gap-1.5 cursor-pointer bg-[#00A8E8]/10 rounded-[60px] px-2.5 py-1 border border-[#00A8E8]/5 transition-hover hover:bg-[#00A8E8]/20 pointer-events-auto"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  {collateralToken === 'USDT' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-[18px] h-[18px] shrink-0">
                      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                      <path d="M17.922 13.793v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v5.882h3.904v-5.882c4.399-.203 7.707-1.074 7.707-2.118 0-1.044-3.308-1.916-7.707-2.118zm0 1.875v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.887.173 6.788.85 6.788 1.659 0 .808-2.901 1.485-6.788 1.656z" fill="#FFFFFF"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-[18px] h-[18px] shrink-0">
                      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
                      <path d="M18.775 14.887a3.421 3.421 0 0 0 .151-.998 3.036 3.036 0 0 0-.616-1.83 2.946 2.946 0 0 0-1.688-1.077 3.522 3.522 0 0 0-.825-.098c-.146 0-.29.006-.432.018V10.9h.432c.112.001.218-.01.32-.02.482-.047.881-.225 1.151-.51.27-.286.417-.678.417-1.114V8.026A1.171 1.171 0 0 0 17.3 6.9h-1.571V6.3a1.171 1.171 0 0 0-1.172-1.172H13.6A1.171 1.171 0 0 0 12.428 6.3v.6h-.6a1.171 1.171 0 0 0-1.172 1.172v1.229c0 .436.147.828.417 1.114s.669.463 1.151.51c.102.01.208.021.32.02v.004c.143 0 .285-.008.432-.018v.004h-.432a3.522 3.522 0 0 0 .825.098 2.946 2.946 0 0 0 1.688 1.077 3.036 3.036 0 0 0 .616 1.83 3.421 3.421 0 0 0-.151.998V16.7h.802v-1.813h1.365V16.7h.802v-1.813h1.365V16.7h.802v-1.813zm-2.029 3.013a3.421 3.421 0 0 0-.151.998 3.036 3.036 0 0 0 .616 1.83 2.946 2.946 0 0 0 1.688 1.077 3.522 3.522 0 0 0 .825.098c.146 0 .29-.006.432-.018V21.1h-.432a3.522 3.522 0 0 0-.825-.098 2.946 2.946 0 0 0-1.688-1.077 3.036 3.036 0 0 0-.616-1.83 3.421 3.421 0 0 0 .151-.998V15.3h-.802z" fill="#FFFFFF"/>
                    </svg>
                  )}
                  <span className="text-[10px] font-black tracking-widest text-[#00A8E8]">{collateralToken}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-[#00A8E8] transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>

                  {/* Synchronized Glassmorphic Dropdown Menu authored by Viqtorhvayx */}
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-36 p-2 rounded-2xl backdrop-blur-2xl bg-white/10 dark:bg-slate-950/40 border border-white/20 dark:border-slate-500/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                      {(['USDT', 'USDC'] as const).map((token) => (
                        <div 
                          key={token}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCollateralToken(token);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors cursor-pointer ${collateralToken === token ? 'bg-[#00A8E8]/10' : ''}`}
                        >
                          {token === 'USDT' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                              <circle cx="16" cy="16" r="16" fill="#26A17B"/>
                              <path d="M17.922 13.793v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v5.882h3.904v-5.882c4.399-.203 7.707-1.074 7.707-2.118 0-1.044-3.308-1.916-7.707-2.118zm0 1.875v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.887.173 6.788.85 6.788 1.659 0 .808-2.901 1.485-6.788 1.656z" fill="#FFFFFF"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 shrink-0">
                              <circle cx="16" cy="16" r="16" fill="#2775CA"/>
                              <path d="M18.775 14.887a3.421 3.421 0 0 0 .151-.998 3.036 3.036 0 0 0-.616-1.83 2.946 2.946 0 0 0-1.688-1.077 3.522 3.522 0 0 0-.825-.098c-.146 0-.29.006-.432.018V10.9h.432c.112.001.218-.01.32-.02.482-.047.881-.225 1.151-.51.27-.286.417-.678.417-1.114V8.026A1.171 1.171 0 0 0 17.3 6.9h-1.571V6.3a1.171 1.171 0 0 0-1.172-1.172H13.6A1.171 1.171 0 0 0 12.428 6.3v.6h-.6a1.171 1.171 0 0 0-1.172 1.172v1.229c0 .436.147.828.417 1.114s.669.463 1.151.51c.102.01.208.021.32.02v.004c.143 0 .285-.008.432-.018v.004h-.432a3.522 3.522 0 0 0 .825.098 2.946 2.946 0 0 0 1.688 1.077 3.036 3.036 0 0 0 .616 1.83 3.421 3.421 0 0 0-.151.998V16.7h.802v-1.813h1.365V16.7h.802v-1.813h1.365V16.7h.802v-1.813zm-2.029 3.013a3.421 3.421 0 0 0-.151.998 3.036 3.036 0 0 0 .616 1.83 2.946 2.946 0 0 0 1.688 1.077 3.522 3.522 0 0 0 .825.098c.146 0 .29-.006.432-.018V21.1h-.432a3.522 3.522 0 0 0-.825-.098 2.946 2.946 0 0 0-1.688-1.077 3.036 3.036 0 0 0-.616-1.83 3.421 3.421 0 0 0 .151-.998V15.3h-.802z" fill="#FFFFFF"/>
                            </svg>
                          )}
                          <span className="text-[10px] font-black tracking-widest text-[#00A8E8]">{token}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Static HBAR Badge authored by Viqtorhvayx */
                <div className="absolute right-3 flex items-center gap-2 pointer-events-none bg-[#00A8E8]/10 rounded-[60px] px-2 py-1 border border-[#00A8E8]/5">
                  <div 
                    className="flex items-center justify-center w-[18px] h-[18px] rounded-full"
                    style={{ backgroundColor: '#000000' }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 24 24" 
                      fill="currentColor" 
                      className="w-[11px] h-[11px]" 
                      style={{ color: '#FFFFFF' }}
                    >
                      <path fillRule="evenodd" clipRule="evenodd" d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-black tracking-widest text-[#00A8E8]">HBAR</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-baseline mt-2 px-2">
              <span className="text-[10px] font-bold" style={{ color: '#00A8E8' }}>{usdValue}</span>
              <div className="flex gap-1">
                <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
                <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
                <QuickButton label="Max" onClick={handleMaxSelect} />
              </div>
            </div>
          </div>

        <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl py-2 px-4 border border-[var(--border)] mt-auto">
          <div className="flex justify-between mb-2">
            <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Maximum Borrowing Limit</span>
            <span className="text-[11px] font-black" style={{ color: primaryTextColor }}>{calculatedHbarLimit.toFixed(2)} {balanceSymbol}</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8]" style={{ width: `${Math.min((hbarInputNumeric / 1000) * 100, 100)}%` }} />
          </div>
          <p className="text-[10px] mt-2" style={{ color: labelColor }}>Starting XP is calculated based on Collateralization Ratio.</p>
        </div>

        <div className="flex gap-4 mt-auto">
          <button onClick={handleAction} disabled={!hbarInput || Number(stripCommas(hbarInput)) <= 0} className={getActionButtonClasses()}>
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
