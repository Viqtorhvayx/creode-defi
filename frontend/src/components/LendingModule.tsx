// Implementation by Viqtorhvayx
"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';
import { ShieldCheck, Star, LockKey, CaretDown, Shield } from '@phosphor-icons/react';

interface LendingModuleProps {
  points: number;
  theme?: 'light' | 'dark';
}

export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const { balance } = useWallet();
  const [amount, setAmount] = useState("");
  const hbarPrice = usePythPrice();

  // Load HBAR logo explicitly for the input pill
  const [hbarLogoUrl, setHbarLogoUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchHbarLogo = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/hedera-hashgraph");
        if (res.ok) {
          const data = await res.json();
          if (data?.image?.small) {
            setHbarLogoUrl(data.image.small);
          }
        }
      } catch (err) {
        console.error("HBAR Logo Error:", err);
      }
    };
    fetchHbarLogo();
  }, []);

  const handleMaxSelect = () => {
    setAmount(formatWithCommas(balance || "0"));
  };

  const numericAmount = Number(stripCommas(amount)) || 0;
  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount * hbarPrice);

  return (
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-[32px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">Lend</h1>
          <ShieldCheck className="w-6 h-6 text-[#00A8E8]" weight="regular" />
        </div>
        <p className="text-[13px] text-slate-500 dark:text-white/60">Lend HBAR. Backed by stables, powered by the community.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Total Lent */}
        <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] p-5 flex flex-col shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mb-3 uppercase tracking-wider">Total Lent (HBAR)</span>
          <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">42,390.75 HBAR</span>
          <span className="text-[13px] text-slate-500 dark:text-white/60">$3,756.45 USD</span>
        </div>

        {/* Current Utilization */}
        <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] p-5 flex flex-col shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mb-3 uppercase tracking-wider">Current Utilization</span>
          <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-3">68.45%</span>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '68.45%' }}></div>
          </div>
        </div>

        {/* Lenders */}
        <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] p-5 flex flex-col shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mb-3 uppercase tracking-wider">Lenders</span>
          <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">1,248</span>
          <span className="text-[13px] text-slate-500 dark:text-white/60">Total</span>
        </div>

        {/* Your CODE Points */}
        <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] p-5 flex flex-col shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 mb-3 uppercase tracking-wider">Your CODE Points</span>
          <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">1,245.50</span>
          <span className="text-[13px] text-slate-500 dark:text-white/60">Earned</span>
        </div>

      </div>

      {/* Earn CODE Points Card */}
      <div className="bg-[#F8FAFC] dark:bg-[#00A8E8]/5 border border-slate-200 dark:border-[#00A8E8]/20 rounded-[16px] p-5 flex items-center justify-between mb-8 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-transparent">
            <Star className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[15px] font-bold text-[#00A8E8] mb-0.5">Earn CODE Points</span>
            <span className="text-[13px] text-slate-600 dark:text-white/70 max-w-[400px] leading-relaxed">
              You earn CODE points daily for lending HBAR and supporting liquidity in the Creode ecosystem.
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[15px] font-bold text-[#00A8E8] mb-0.5">+ 2.50 CODE</span>
          <span className="text-[12px] text-slate-500 dark:text-white/50">Estimated daily</span>
        </div>
      </div>

      {/* Main Lend HBAR Card */}
      <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] p-8 flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]">
        
        <div className="flex flex-col mb-6">
          <h2 className="text-[20px] font-bold text-slate-900 dark:text-white mb-1">Lend HBAR</h2>
          <span className="text-[13px] text-slate-500 dark:text-white/60">You supply HBAR. Borrowers lock stables as collateral.</span>
        </div>

        {/* Input Section */}
        <div className="flex flex-col w-full mb-8">
          <label className="text-[13px] font-bold text-slate-900 dark:text-white/80 mb-3">Amount to Lend</label>
          <div className="flex items-center justify-between w-full h-[104px] px-5 bg-[#F8FAFC] dark:bg-[#0B0F14] border border-slate-200 dark:border-white/5 rounded-[16px] transition-all mb-3">
            
            <div className="flex flex-col justify-center h-full flex-1">
              <input 
                type="number" 
                placeholder="0" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[32px] font-bold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 leading-none m-0 p-0 mb-3" 
              />
              <span className="text-[13px] font-medium ml-0.5 text-slate-400 dark:text-white/40">{usdValue}</span>
            </div>

            <div className="flex flex-col items-end justify-center h-full shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm">
                {hbarLogoUrl ? (
                  <img src={hbarLogoUrl} alt="HBAR Logo" className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm bg-slate-900 dark:bg-white" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">H</div>
                )}
                <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-none pr-1">HBAR</span>
                <CaretDown className="w-3.5 h-3.5 text-slate-500 dark:text-white/60" weight="bold" />
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[13px] font-medium text-slate-500 dark:text-white/60">Available Balance: {balance || "0.00"} HBAR</span>
            <button 
              onClick={handleMaxSelect}
              className="text-[13px] font-bold text-[#00A8E8] hover:text-[#007EA7] transition-colors uppercase tracking-wider"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Lending Details Card */}
        <div className="bg-white dark:bg-[#0F141A] border border-slate-200 dark:border-white/10 rounded-[16px] p-6 grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/50 mb-2">Supply APY</span>
            <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">3.25%</span>
            <span className="text-[12px] font-semibold text-[#00A8E8]">Variable</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-l border-r border-slate-100 dark:border-white/5">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/50 mb-2">Total Supplied</span>
            <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">42,390.75 HBAR</span>
            <span className="text-[12px] text-slate-500 dark:text-white/50">$3,756.45 USD</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/50 mb-2">Utilization</span>
            <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-1">68.45%</span>
            <span className="text-[12px] font-semibold text-[#00A8E8]">Good</span>
          </div>
        </div>

        {/* Confirm Button */}
        <button className="w-full bg-[#00A8E8] hover:bg-[#0096D6] active:scale-[0.99] transition-all duration-200 text-white font-bold text-[16px] py-4 rounded-[14px] flex items-center justify-center gap-2 mb-6 shadow-md shadow-[#00A8E8]/20">
          <LockKey className="w-5 h-5" weight="bold" />
          Confirm Lend
        </button>

        {/* Footnote */}
        <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/50">
          <Shield className="w-4 h-4" weight="regular" />
          <span className="text-[12px] font-medium">You can withdraw your HBAR anytime. Rewards update daily.</span>
        </div>

      </div>
    </div>
  );
};
