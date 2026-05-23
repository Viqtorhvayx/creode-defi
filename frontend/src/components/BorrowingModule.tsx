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
import { HeartbeatMonitor } from './HeartbeatMonitor';

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
    if (val >= 80) return '#00E676'; // Vibrant Neon Green (Safe)
    if (val >= 40) return '#FFEA00'; // STRONG, VIBRANT warning yellow
    return '#FF3837';                // Danger Red
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

  // Calculate dynamic health factor for UI
  const borrowRatio = activeTab === 'borrow' && maxBorrowHbar > 0 ? (hbarInputNumeric / maxBorrowHbar) : 0;
  const healthFactor = activeTab === 'deposit' ? 100 : Math.max(10, 100 - (borrowRatio * 100));
  const isHealthy = healthFactor >= 50;

  return (
    <div className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 !rounded-[48px] p-12 w-full mx-auto shadow-[0_30px_100px_rgba(0,0,0,0.4)] relative overflow-hidden transition-bounce hover:-translate-y-2 hover:shadow-[0_40px_120px_rgba(0,168,232,0.15)]">
      {/* Header authored by Viqtorhvayx */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h3 className="text-[13px] font-bold opacity-40 mb-2" style={{ color: labelColor }}>Credit facility</h3>
          <p className="text-4xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Borrow</p>
        </div>
        <p className="text-[11px] font-bold opacity-20 tracking-widest uppercase mb-2" style={{ color: primaryTextColor }}>Powered by Creode Engine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT COLUMN: Input & Actions */}
        <div className="flex flex-col">
          <div className="flex gap-4 mb-10 bg-black/30 p-2 rounded-[60px] border border-white/5 shrink-0">
            <button onClick={() => setActiveTab('deposit')} className={getTabClasses('deposit')}>Collateral</button>
            <button onClick={() => setActiveTab('borrow')} className={getTabClasses('borrow')}>Credit</button>
          </div>

          <div className="space-y-10 flex-grow flex flex-col justify-between">
            {/* Uniswap-style Input Box authored by Viqtorhvayx */}
            <div className="uniswap-input-box">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[12px] font-bold opacity-40" style={{ color: primaryTextColor }}>
                  {activeTab === 'deposit' ? 'Collateral amount' : 'Borrow amount'}
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setHbarInput((Number(balance) * 0.5).toString())} className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 text-white opacity-40 transition-all uppercase">50%</button>
                  <button onClick={() => setHbarInput(balance)} className="text-[10px] font-bold px-3 py-1 bg-white/5 rounded-lg hover:bg-white/10 text-white opacity-40 transition-all uppercase">Max</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 h-20">
                <FormattedNumberInput 
                  placeholder="0"
                  className="w-full bg-transparent text-3xl font-semibold outline-none border-none p-0"
                  style={{ color: primaryTextColor }}
                  value={hbarInput}
                  onValueChange={setHbarInput}
                />
                <div className="relative group">
                  <div 
                    className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 shadow-md backdrop-blur-md cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                      {collateralToken === 'USDT' ? (
                        <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-4 h-4 object-contain" alt="USDT" />
                      ) : (
                        <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-4 h-4 object-contain" alt="USDC" />
                      )}
                    </div>
                    <span className="text-lg font-bold text-white whitespace-nowrap">{collateralToken}</span>
                    <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>

                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 right-0 w-36 bg-[#1a1b1f] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div 
                        className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
                        onClick={() => { setCollateralToken('USDT'); setIsDropdownOpen(false); }}
                      >
                        <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" className="w-5 h-5 object-contain" alt="USDT" />
                        <span className="text-sm font-bold text-white">USDT</span>
                      </div>
                      <div 
                        className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors border-t border-white/5"
                        onClick={() => { setCollateralToken('USDC'); setIsDropdownOpen(false); }}
                      >
                        <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" className="w-5 h-5 object-contain" alt="USDC" />
                        <span className="text-sm font-bold text-white">USDC</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[12px] font-bold text-[#00A8E8] opacity-60 mt-2">{usdValue}</p>
            </div>

            {/* Aave-style Data Rows authored by Viqtorhvayx */}
            <div className="space-y-5 bg-white/[0.03] p-8 rounded-[32px] border border-white/5 shadow-xl mt-auto">
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
              className="nav-pill !py-7 w-full bg-[#00A8E8] text-white text-sm font-bold shadow-[0_20px_60px_rgba(0,168,232,0.4)] mt-6 disabled:opacity-50 disabled:translate-y-0 !rounded-[30px] transition-bounce hover:-translate-y-2 hover:scale-[1.02] active:scale-95 hover:shadow-[0_25px_70px_rgba(0,168,232,0.5)] disabled:hover:transform-none"
            >
              {isClicked ? 'Processing...' : (activeTab === 'deposit' ? 'Supply collateral' : 'Execute borrow')}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Reputation Monitor & Status */}
        <div className="flex flex-col gap-6 h-full">
          {/* Heartbeat Monitor Screen */}
          <div className="h-48 w-full bg-[#0a0a0a] rounded-[32px] border border-white/5 relative overflow-hidden shadow-inner shrink-0">
            <HeartbeatMonitor 
              healthFactor={healthFactor} 
              xp={currentXP} 
              isActive={borrowRatio > 0} 
              color={borrowRatio > 0 ? getXPColor(currentXP) : '#4B5563'} 
            />
          </div>
          
          {/* Separated Status Panel */}
          <div className="flex flex-col justify-between gap-6 bg-black/20 p-8 rounded-[32px] border border-white/5 shadow-xl flex-grow">
             <div className="flex justify-between items-center w-full">
               <div className="flex flex-col">
                 <span className="text-[11px] font-bold opacity-40 uppercase tracking-widest mb-1" style={{ color: primaryTextColor }}>Reputation XP</span>
                 <p className="text-4xl font-black flex items-baseline gap-1">
                   <span style={{ color: getXPColor(currentXP), textShadow: `0 0 20px ${getXPColor(currentXP)}80` }}>{currentXP}</span>
                   <span className="text-lg font-bold opacity-30">/ 100</span>
                 </p>
               </div>
             </div>

             <div className="w-full h-[1px] bg-white/10" />

             <div className="flex justify-between items-center w-full">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-2" style={{ color: primaryTextColor }}>Stability</span>
                 <span className="text-sm font-black px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-center" style={{ color: getXPColor(currentXP) }}>
                   {currentXP >= 80 ? 'Safe' : currentXP >= 40 ? 'Warning' : 'Critical'}
                 </span>
               </div>
               
               <div className="flex flex-col items-end">
                 <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-2" style={{ color: primaryTextColor }}>Signal</span>
                 <span className={`text-sm font-black ${borrowRatio > 0 ? 'animate-pulse' : ''}`} style={{ color: borrowRatio > 0 ? getXPColor(currentXP) : '#4B5563' }}>
                   {borrowRatio > 0 ? 'Active' : 'Idle'}
                 </span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
