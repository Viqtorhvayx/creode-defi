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
    <div className="glass-panel !rounded-[48px] p-12 max-w-2xl mx-auto shadow-[0_30px_100px_rgba(0,0,0,0.4)] relative overflow-hidden transform transition-all duration-700 hover:shadow-[0_40px_120px_rgba(0,168,232,0.15)]">
      {/* Header authored by Viqtorhvayx */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h3 className="text-[13px] font-bold opacity-40 mb-2" style={{ color: labelColor }}>Credit facility</h3>
          <p className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Borrow</p>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold opacity-40 mb-1 block" style={{ color: primaryTextColor }}>Loan health</span>
          <p className="text-3xl font-black flex items-baseline justify-end gap-1">
            <span style={{ color: getXPColor(currentXP) }}>{currentXP}</span>
            <span className="text-sm font-bold opacity-30">/ 100</span>
          </p>
        </div>
      </div>

      {/* Cardiac Monitor authored by Viqtorhvayx */}
      <div className="mb-12 h-20 bg-black/40 rounded-[32px] border border-white/5 relative overflow-hidden flex items-center justify-center group">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path 
              d="M0,50 L200,50 L220,30 L240,70 L260,10 L280,90 L300,50 L1000,50" 
              fill="none" 
              stroke="#00A8E8" 
              strokeWidth="2" 
              className="animate-[pulse_3s_infinite]"
            />
          </svg>
        </div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Stability</span>
             <span className="text-sm font-black text-[#10B981]">Nominal</span>
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Pulse</span>
             <span className="text-sm font-black text-[#00A8E8] animate-pulse">Active</span>
           </div>
           <div className="w-[1px] h-8 bg-white/10" />
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest">Risk</span>
             <span className="text-sm font-black text-emerald-500">Minimal</span>
           </div>
        </div>
      </div>

      <div className="flex gap-4 mb-12 bg-black/30 p-2 rounded-[60px] border border-white/5">
        <button onClick={() => setActiveTab('deposit')} className={getTabClasses('deposit')}>Collateral</button>
        <button onClick={() => setActiveTab('borrow')} className={getTabClasses('borrow')}>Credit</button>
      </div>

      <div className="space-y-10">
        {/* Uniswap-style Input Box authored by Viqtorhvayx */}
        <div className="uniswap-input-box">
          <div className="flex justify-between items-center">
            <label className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>
              {activeTab === 'deposit' ? 'Collateral amount' : 'Borrow amount'}
            </label>
            <div className="flex gap-3">
              <button onClick={() => setHbarInput((Number(balance) * 0.5).toString())} className="text-[10px] font-bold px-4 py-1.5 bg-white/5 rounded-[12px] hover:bg-white/10 text-white opacity-40 transition-all uppercase tracking-widest">50%</button>
              <button onClick={() => setHbarInput(balance)} className="text-[10px] font-bold px-4 py-1.5 bg-white/5 rounded-[12px] hover:bg-white/10 text-white opacity-40 transition-all uppercase tracking-widest">Max</button>
            </div>
          </div>
          <div className="flex items-center gap-6 h-20">
            <FormattedNumberInput 
              placeholder="0.00"
              className="w-full bg-transparent text-5xl font-black outline-none border-none p-0 tracking-tighter"
              style={{ color: primaryTextColor }}
              value={hbarInput}
              onValueChange={setHbarInput}
            />
            <div className="relative group">
              <div 
                className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-[28px] border border-white/10 shadow-2xl backdrop-blur-md min-w-[180px] justify-center cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden">
                  {collateralToken === 'USDT' ? (
                    <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-6 h-6 object-contain" alt="USDT" />
                  ) : (
                    <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-6 h-6 object-contain" alt="USDC" />
                  )}
                </div>
                <span className="text-xl font-black tracking-tighter text-white">{collateralToken}</span>
              </div>

              {isDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-full bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div 
                    className="p-4 hover:bg-white/10 cursor-pointer flex items-center gap-4 transition-colors"
                    onClick={() => { setCollateralToken('USDT'); setIsDropdownOpen(false); }}
                  >
                    <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-6 h-6 object-contain" alt="USDT" />
                    <span className="text-sm font-black text-white">USDT</span>
                  </div>
                  <div 
                    className="p-4 hover:bg-white/10 cursor-pointer flex items-center gap-4 transition-colors border-t border-white/5"
                    onClick={() => { setCollateralToken('USDC'); setIsDropdownOpen(false); }}
                  >
                    <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-6 h-6 object-contain" alt="USDC" />
                    <span className="text-sm font-black text-white">USDC</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-[12px] font-bold text-[#00A8E8] tracking-[0.1em] opacity-60 uppercase">{usdValue} Valuation</p>
        </div>

        {/* Aave-style Data Rows authored by Viqtorhvayx */}
        <div className="space-y-5 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>Borrow limit</span>
            <div className="flex flex-col items-end">
              <span className="text-xl font-black text-white tracking-tight">0.00 HBAR</span>
              <div className="w-40 h-2 bg-white/5 rounded-full mt-3 overflow-hidden border border-white/5">
                <div className="h-full bg-[#00A8E8] shadow-[0_0_20px_rgba(0,168,232,0.5)] transition-all duration-1000" style={{ width: '0%' }} />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>Liquidation price</span>
            <span className="text-xl font-black text-white tracking-tight">$0.0000</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>Net APR</span>
            <span className="text-xl font-black text-red-500 tracking-tight">12.4% <span className="text-[11px] opacity-30">Borrow</span></span>
          </div>
        </div>

        <button 
          onClick={handleAction} 
          disabled={isClicked || !hasInput}
          className="nav-pill !py-7 w-full bg-[#00A8E8] text-white text-sm font-bold shadow-[0_20px_60px_rgba(0,168,232,0.4)] bounce-hover mt-6 disabled:opacity-50 disabled:translate-y-0 !rounded-[30px]"
        >
          {isClicked ? 'Processing...' : (activeTab === 'deposit' ? 'Supply collateral' : 'Execute borrow')}
        </button>

        <p className="text-center text-[11px] font-bold opacity-10 mt-8" style={{ color: primaryTextColor }}>Powered by Creode Reputation Engine</p>
      </div>
    </div>
  );
};
