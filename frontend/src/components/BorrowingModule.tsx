"use client";

/* * Developer: [Viqtorhvayx]
 * Component: BorrowingModule
 * Description: Credit facility module integrated with the Advanced Identity Engine.
 * Refactored for Elite Uniswap/Aave aesthetic.
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
  const MAX_LTV = 0.65;
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');
  const [isClicked, setIsClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasInput = hbarInput.length > 0 && Number(stripCommas(hbarInput)) > 0;
  const [collateralToken, setCollateralToken] = useState<'USDT' | 'USDC'>('USDT');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [pythHbarPrice, setPythHbarPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  useEffect(() => {
    const fetchPythPrices = async () => {
      setIsPriceLoading(true);
      const collateralFeed = collateralToken === 'USDT' 
        ? '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b' 
        : 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a';
      const hbarFeed = '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd';
      
      try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${collateralFeed}&ids[]=${hbarFeed}`);
        const data = await response.json();
        
        if (data.parsed) {
          const colData = data.parsed.find((p: any) => p.id.includes(collateralFeed));
          const hbData = data.parsed.find((p: any) => p.id.includes(hbarFeed));
          
          if (colData) setAssetPrice(Number(colData.price.price) * Math.pow(10, colData.price.expo));
          if (hbData) setPythHbarPrice(Number(hbData.price.price) * Math.pow(10, hbData.price.expo));
        }
      } catch (error) {
        console.error("Pyth Hermes Multi-Fetch Error:", error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchPythPrices();
  }, [collateralToken]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentXP, setCurrentXP] = useState(initialXP);

  const getXPColor = (val: number) => {
    if (val >= 70) return '#10B981';
    if (val >= 40) return '#F4E285';
    if (val >= 16) return '#FF5400';
    return '#FF3837';
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const getTabClasses = (tab: 'deposit' | 'borrow') => {
    const isActive = activeTab === tab;
    const base = `flex-1 !py-3 font-black transition-all duration-500 rounded-[60px] text-[11px] tracking-[0.2em] uppercase`;
    return isActive 
      ? `${base} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/30`
      : `${base} bg-white/5 text-white/40 hover:bg-white/10`;
  };

  const handleAction = () => {
    if (!hbarInput || Number(stripCommas(hbarInput)) <= 0) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
    alert("Transaction Sent!");
  };

  const hbarPrice = usePythPrice();
  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(stripCommas(hbarInput)) || 0) * hbarPrice);

  const maxBorrowHbar = pythHbarPrice ? ((hbarInputNumeric * (assetPrice || 0)) * MAX_LTV / pythHbarPrice) : 0;

  return (
    <div className="glass-panel !rounded-[40px] p-10 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
      {/* Header authored by Viqtorhvayx */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.3em]" style={{ color: labelColor }}>Credit Facility</h3>
          <p className="text-3xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Borrow</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1 block" style={{ color: primaryTextColor }}>Loan Health</span>
          <p className="text-2xl font-black flex items-baseline justify-end gap-1">
            <span style={{ color: getXPColor(currentXP) }}>{currentXP}</span>
            <span className="text-xs font-bold opacity-30">/ 100</span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-10 bg-black/20 p-1.5 rounded-[60px] border border-white/5">
        <button onClick={() => setActiveTab('deposit')} className={getTabClasses('deposit')}>Collateral</button>
        <button onClick={() => setActiveTab('borrow')} className={getTabClasses('borrow')}>Credit</button>
      </div>

      <div className="space-y-8">
        {/* Uniswap-style Input Box authored by Viqtorhvayx */}
        <div className="bg-black/20 p-8 rounded-[32px] border border-white/10 transition-all duration-300 focus-within:border-[#00A8E8]/40 shadow-inner">
          <div className="flex justify-between mb-4">
            <label className="text-[11px] font-black uppercase tracking-widest opacity-40" style={{ color: primaryTextColor }}>
              {activeTab === 'deposit' ? 'Collateral Amount' : 'Borrow Amount'}
            </label>
            <div className="flex gap-2">
              <button onClick={() => setHbarInput((Number(balance) * 0.5).toString())} className="text-[10px] font-black px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 text-white opacity-40 hover:opacity-100 transition-all uppercase tracking-widest">50%</button>
              <button onClick={() => setHbarInput(balance)} className="text-[10px] font-black px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 text-white opacity-40 hover:opacity-100 transition-all uppercase tracking-widest">Max</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FormattedNumberInput 
              placeholder="0.00"
              className="w-full bg-transparent text-4xl font-black outline-none border-none p-0 tracking-tighter"
              style={{ color: primaryTextColor }}
              value={hbarInput}
              onValueChange={setHbarInput}
            />
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl min-w-[140px] justify-center relative cursor-pointer group" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tighter text-white">HBAR</span>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in duration-200">
                  <div className="p-2 hover:bg-white/5 rounded-xl text-white text-xs font-bold uppercase tracking-widest">HBAR</div>
                </div>
              )}
            </div>
          </div>
          <p className="mt-4 text-[11px] font-bold text-[#00A8E8] tracking-widest opacity-80 uppercase">{usdValue} Valuation</p>
        </div>

        {/* Aave-style Data Rows authored by Viqtorhvayx */}
        <div className="space-y-4 bg-white/[0.02] p-8 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Borrow Limit</span>
            <div className="flex flex-col items-end">
              <span className="text-lg font-black text-white tracking-tight">0.00 HBAR</span>
              <div className="w-32 h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden border border-white/5">
                <div className="h-full bg-[#00A8E8] shadow-[0_0_10px_rgba(0,168,232,0.5)]" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Liquidation Price</span>
            <span className="text-lg font-black text-white tracking-tight">$0.0000</span>
          </div>
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Net APY</span>
            <span className="text-lg font-black text-red-500 tracking-tight">12.4% <span className="text-[10px] opacity-30">BORROW</span></span>
          </div>
        </div>

        <button 
          onClick={handleAction} 
          disabled={isClicked || !hasInput}
          className="nav-pill !py-6 w-full bg-[#00A8E8] text-white text-sm font-black uppercase tracking-[0.25em] shadow-[0_15px_40px_rgba(0,168,232,0.4)] bounce-hover mt-4 disabled:opacity-50 disabled:translate-y-0"
        >
          {isClicked ? 'Processing...' : (activeTab === 'deposit' ? 'Supply Collateral' : 'Execute Borrow')}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-20 mt-6" style={{ color: primaryTextColor }}>Powered by CREODE Reputation Engine</p>
      </div>
    </div>
  );
};
