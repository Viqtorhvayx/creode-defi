// Card UI merger and layout refinement strictly credited to Viqtorhvayx on GitHub
"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Info, Clock, Wallet, Bank } from '@phosphor-icons/react';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

const MOCK_BORROW_ASSETS = [
  { symbol: 'HBAR', name: 'HBAR', threshold: '85%', threshLabel: 'High', ltv: '75%', apy: '3.25%', xp: 84 },
  { symbol: 'SAUCE', name: 'SAUCE', threshold: '80%', threshLabel: 'High', ltv: '70%', apy: '5.12%', xp: 76 },
  { symbol: 'WBTC', name: 'WBTC', threshold: '75%', threshLabel: 'High', ltv: '65%', apy: '2.85%', xp: 68 },
  { symbol: 'WETH', name: 'WETH', threshold: '75%', threshLabel: 'High', ltv: '65%', apy: '2.60%', xp: 66 },
  { symbol: 'PACK', name: 'PACK', threshold: '70%', threshLabel: 'Medium', ltv: '60%', apy: '7.15%', xp: 58 },
  { symbol: 'BONZO', name: 'BONZO', threshold: '70%', threshLabel: 'Medium', ltv: '60%', apy: '6.35%', xp: 54 },
  { symbol: 'JAM', name: 'JAM', threshold: '65%', threshLabel: 'Medium', ltv: '55%', apy: '4.90%', xp: 48 },
  { symbol: 'DOVU', name: 'DOVU', threshold: '65%', threshLabel: 'Medium', ltv: '55%', apy: '6.80%', xp: 42 },
  { symbol: 'GRELF', name: 'GRELF', threshold: '60%', threshLabel: 'Medium', ltv: '50%', apy: '5.65%', xp: 36 },
  { symbol: 'HST', name: 'HST', threshold: '60%', threshLabel: 'Medium', ltv: '50%', apy: '3.90%', xp: 28 },
  { symbol: 'STEAM', name: 'STEAM', threshold: '60%', threshLabel: 'Medium', ltv: '55%', apy: '6.10%', xp: 22 },
  { symbol: 'KBL', name: 'KBL', threshold: '55%', threshLabel: 'Medium', ltv: '45%', apy: '4.75%', xp: 18 },
];

export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ theme }) => {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isLogosLoading, setIsLogosLoading] = useState(true);

  // Reusing logo fetcher logic from Lend module for consistency
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch('https://api.saucerswap.finance/tokens');
        if (res.ok) {
          const data = await res.json();
          const newLogos: Record<string, string> = {};
          data.forEach((token: any) => {
            newLogos[token.symbol] = token.icon ? `https://www.saucerswap.finance/${token.icon}` : '';
          });
          
          // Fallbacks for known tokens
          newLogos['HBAR'] = 'https://cryptologos.cc/logos/hedera-hbar-logo.png';
          newLogos['WBTC'] = 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png';
          newLogos['WETH'] = 'https://cryptologos.cc/logos/ethereum-eth-logo.png';
          newLogos['PACK'] = 'https://hashpack.app/assets/images/hashpack-logo.png';
          
          setLogos(newLogos);
        }
      } catch (err) {
        console.error("Logos Error:", err);
      } finally {
        setIsLogosLoading(false);
      }
    };
    fetchLogos();
  }, []);

  const getXPStatus = (xp: number) => {
    if (xp >= 70) return { label: 'Good', colorClass: 'text-emerald-500 dark:text-[#00E88A]', dotClass: 'bg-emerald-500 dark:bg-[#00E88A]' };
    if (xp >= 40) return { label: 'Stable', colorClass: 'text-amber-500 dark:text-amber-400', dotClass: 'bg-amber-500 dark:bg-amber-400' };
    if (xp >= 15) return { label: 'Risky', colorClass: 'text-orange-500 dark:text-orange-400', dotClass: 'bg-orange-500 dark:bg-orange-400' };
    return { label: 'Critical', colorClass: 'text-red-500 dark:text-red-400', dotClass: 'bg-red-500 dark:bg-red-400' };
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Top Metrics Section (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Total Borrowed */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60 mb-1">Total Borrowed</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">12,450.75 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-white/50">$1,105.45 USD</span>
          </div>
        </div>

        {/* Current TVL */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <Bank className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60 mb-1">Current TVL</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">85,430.25 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-white/50">$7,584.32 USD</span>
          </div>
        </div>

        {/* Total Available */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60 mb-1">Total Available</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">13,450.25 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-white/50">$1,194.45 USD</span>
          </div>
        </div>

      </div>

      {/* Borrow Assets Section */}
      <div className="flex flex-col">

        {/* Main Card Container */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] overflow-hidden shadow-sm">
          
          {/* Inner Header Block */}
          <div className="flex items-center gap-2 p-6 bg-transparent">
            <div className="flex flex-col justify-center">
              <h2 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5 leading-none">Borrow Assets</h2>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">Borrow assets against your supplied collateral.</span>
            </div>
          </div>
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-[#1F2937] bg-transparent text-[12px] font-medium text-slate-500 dark:text-white/60">
            <div className="col-span-3 pl-2">Asset</div>
            <div className="col-span-2 flex items-center gap-1">Liquidity Threshold <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2 flex items-center gap-1">LTV <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2 flex items-center gap-1">Borrow APY <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2 flex items-center gap-1">XP <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {MOCK_BORROW_ASSETS.map((asset, index) => {
              const status = getXPStatus(asset.xp);
              return (
                <div 
                  key={asset.symbol} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all cursor-pointer relative outline-none focus:outline-none focus:ring-0 hover:bg-slate-50 dark:hover:bg-[#1F2937]/30 ${index !== MOCK_BORROW_ASSETS.length - 1 ? 'border-b border-slate-100 dark:border-[#1F2937]' : ''}`}
                >
                
                {/* Asset Column */}
                <div className="col-span-3 flex items-center gap-3 pl-2">
                  {!isLogosLoading && logos[asset.symbol] ? (
                    <img src={logos[asset.symbol]} alt={`${asset.name} Logo`} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] text-slate-900 dark:text-white flex items-center justify-center text-[12px] font-black">
                      {asset.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">{asset.name}</span>
                    <span className="text-[12px] text-slate-500 dark:text-white/50">{asset.symbol}</span>
                  </div>
                </div>

                {/* Liquidity Threshold Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-white">{asset.threshold}</span>
                  <span className="text-[12px] text-slate-500 dark:text-white/50 font-medium">{asset.threshLabel}</span>
                </div>

                {/* LTV Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-slate-900 dark:text-white">{asset.ltv}</span>
                  <span className="text-[12px] text-slate-500 dark:text-white/50 font-medium">Max LTV</span>
                </div>

                {/* Borrow APY Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-[#00A8E8]">{asset.apy}</span>
                  <span className="text-[12px] text-[#00A8E8] font-medium">Variable</span>
                </div>

                {/* XP Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className={`text-[14px] font-bold ${status.colorClass}`}>{asset.xp}%</span>
                  <span className={`text-[12px] font-medium ${status.colorClass}`}>{status.label}</span>
                </div>

                {/* Action Column */}
                <div className="col-span-1 flex justify-end pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); }}
                    className="px-5 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors duration-200 border-[#00A8E8] text-[#00A8E8] hover:bg-[#00A8E8] hover:text-white"
                  >
                    Borrow
                  </button>
                </div>

              </div>
            )})}
          </div>

        </div>
        
        {/* Bottom Section: Health XP Guide */}
        <div className="mt-6 w-full flex items-center justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-5 shadow-sm">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#00A8E8]" weight="fill" />
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">Health XP Guide</span>
              <span className="text-[12px] text-slate-500 dark:text-white/60">Stay in the green to avoid liquidation. Higher XP means a safer position.</span>
            </div>
          </div>

          <div className="flex items-center gap-6 px-4">
            {/* Good */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#00E88A]"></div>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">100% - 70%</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-500 dark:text-[#00E88A] pl-3.5">Good</span>
            </div>
            {/* Stable */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">70% - 40%</span>
              </div>
              <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 pl-3.5">Stable</span>
            </div>
            {/* Risky */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">40% - 15%</span>
              </div>
              <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 pl-3.5">Risky</span>
            </div>
            {/* Critical */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400"></div>
                <span className="text-[12px] font-semibold text-slate-900 dark:text-white">15% - 0%</span>
              </div>
              <span className="text-[11px] font-bold text-red-500 dark:text-red-400 pl-3.5">Critical</span>
            </div>
          </div>

        </div>

        {/* Manage Position Button Row */}
        <div className="mt-4 flex items-center justify-between w-full px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#00A8E8]" weight="regular" />
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">Maintain a healthy XP to protect your position from liquidation.</span>
          </div>
          <button className="px-5 py-2 rounded-lg border border-[#00A8E8] text-[#00A8E8] hover:bg-[#00A8E8] hover:text-white text-[13px] font-bold transition-colors">
            Manage Position
          </button>
        </div>

      </div>

    </div>
  );
};
