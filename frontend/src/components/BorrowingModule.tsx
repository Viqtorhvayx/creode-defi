// Card UI merger and layout refinement strictly credited to Viqtorhvayx on GitHub
"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Info, Clock, Wallet, Bank, X, CaretDown, LockKey } from '@phosphor-icons/react';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

const MOCK_BORROW_ASSETS = [
  { symbol: 'HBAR', name: 'HBAR', threshold: '85%', threshLabel: 'High', ltv: '75%', apy: '3.25%', xp: 84, cgId: 'hedera-hashgraph' },
  { symbol: 'SAUCE', name: 'SAUCE', threshold: '80%', threshLabel: 'High', ltv: '70%', apy: '5.12%', xp: 76, cgId: 'saucerswap' },
  { symbol: 'WBTC', name: 'WBTC', threshold: '75%', threshLabel: 'High', ltv: '65%', apy: '2.85%', xp: 68, cgId: 'wrapped-bitcoin' },
  { symbol: 'WETH', name: 'WETH', threshold: '75%', threshLabel: 'High', ltv: '65%', apy: '2.60%', xp: 66, cgId: 'weth' },
  { symbol: 'PACK', name: 'PACK', threshold: '70%', threshLabel: 'Medium', ltv: '60%', apy: '7.15%', xp: 58, cgId: 'hashpack' },
  { symbol: 'BONZO', name: 'BONZO', threshold: '70%', threshLabel: 'Medium', ltv: '60%', apy: '6.35%', xp: 54, cgId: 'bonzo-finance' },
  { symbol: 'JAM', name: 'JAM', threshold: '65%', threshLabel: 'Medium', ltv: '55%', apy: '4.90%', xp: 48, cgId: 'tune-fm' },
  { symbol: 'DOVU', name: 'DOVU', threshold: '65%', threshLabel: 'Medium', ltv: '55%', apy: '6.80%', xp: 42, cgId: 'dovu' },
  { symbol: 'GRELF', name: 'GRELF', threshold: '60%', threshLabel: 'Medium', ltv: '50%', apy: '5.65%', xp: 36, cgId: 'grelf' },
  { symbol: 'HST', name: 'HST', threshold: '60%', threshLabel: 'Medium', ltv: '50%', apy: '3.90%', xp: 28, cgId: 'headstarter' },
  { symbol: 'STEAM', name: 'STEAM', threshold: '60%', threshLabel: 'Medium', ltv: '55%', apy: '6.10%', xp: 22, cgId: 'steamexchange' },
  { symbol: 'KBL', name: 'KBL', threshold: '55%', threshLabel: 'Medium', ltv: '45%', apy: '4.75%', xp: 18, cgId: 'karabiner' },
];

export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ theme }) => {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isLogosLoading, setIsLogosLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [borrowAmount, setBorrowAmount] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [selectedCollateralPercent, setSelectedCollateralPercent] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reusing logo fetcher logic from Lend module for consistency
  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const ids = MOCK_BORROW_ASSETS.map(a => a.cgId).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`);
        
        if (res.ok) {
          const data = await res.json();
          const newLogos: Record<string, string> = {};
          data.forEach((coin: any) => {
            if (coin.image) {
              const symbol = MOCK_BORROW_ASSETS.find(a => a.cgId === coin.id)?.symbol;
              if (symbol) newLogos[symbol] = coin.image;
            }
          });
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
              const isSelected = selectedAsset?.symbol === asset.symbol;
              const status = getXPStatus(asset.xp);
              return (
                <div 
                  key={asset.symbol} 
                  onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); setBorrowAmount(''); setCollateralAmount(''); setSelectedCollateralPercent(null); }}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all cursor-pointer relative outline-none focus:outline-none focus:ring-0 ${
                      isSelected 
                        ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20 z-10 rounded-xl' 
                        : `hover:bg-slate-50 dark:hover:bg-[#1F2937]/30 ${index !== MOCK_BORROW_ASSETS.length - 1 ? 'border-b border-slate-100 dark:border-[#1F2937]' : ''}`
                    }`}
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
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setIsModalOpen(true); setBorrowAmount(''); setCollateralAmount(''); setSelectedCollateralPercent(null); }}
                    className={`px-5 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-[#00A8E8] text-white border-[#00A8E8]' 
                        : 'border-[#00A8E8] text-[#00A8E8] hover:bg-[#00A8E8] hover:text-white'
                    }`}
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

      {/* Modal Overlay */}
      {isModalOpen && selectedAsset && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-[16px] shadow-2xl w-full max-w-[460px] mx-auto flex flex-col relative overflow-hidden border border-slate-200 dark:border-[#1F2937] animate-in zoom-in-95 duration-200">
            
            {/* Top Section */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 dark:border-[#1F2937]/50">
              <div className="flex flex-col">
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white leading-none relative inline-block">
                  Borrow
                  <div className="absolute -bottom-2 left-0 w-full h-[3px] bg-[#00A8E8] rounded-full"></div>
                </h3>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedAsset(null); }}
                className="text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors p-1"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col overflow-y-auto max-h-[80vh] custom-scrollbar">

              {/* Collateral Deposit Section */}
              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Collateral Deposit</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                </div>
                
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-xl relative focus-within:border-[#00A8E8] dark:focus-within:border-[#00A8E8] transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1F2937]/50 transition-colors">
                      <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="w-5 h-5 rounded-full" />
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">USDC</span>
                      <CaretDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={collateralAmount}
                      onChange={(e) => { setCollateralAmount(e.target.value); setSelectedCollateralPercent(null); }}
                      className="bg-transparent border-none outline-none text-[28px] font-bold text-slate-900 dark:text-white w-full p-0 placeholder:text-slate-300 dark:placeholder:text-[#1F2937]"
                    />
                    <span className="text-[16px] font-bold text-slate-400 dark:text-white/40">USDC</span>
                  </div>
                  <div className="text-[12px] font-medium text-slate-400 dark:text-white/50 mt-1">
                    ${collateralAmount ? (parseFloat(collateralAmount) * 1).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'} USD
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">Available Balance: 2,450.75 USDC</span>
                  <div className="flex items-center gap-1.5">
                    {['25%', '50%', 'MAX'].map((pct) => (
                      <button 
                        key={pct}
                        onClick={() => setSelectedCollateralPercent(pct)}
                        className={`px-3 py-1 text-[11px] font-bold rounded-md transition-colors ${
                          selectedCollateralPercent === pct 
                            ? 'bg-[#00A8E8] text-white' 
                            : 'bg-slate-100 dark:bg-[#1F2937] text-slate-600 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-[#2D3748]'
                        }`}
                      >
                        {pct}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Borrow Asset Section */}
              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Borrow Asset</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                </div>
                
                <div className="flex flex-col p-4 bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-xl relative focus-within:border-[#00A8E8] dark:focus-within:border-[#00A8E8] transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1F2937]/50 transition-colors">
                      {logos[selectedAsset.symbol] ? (
                        <img src={logos[selectedAsset.symbol]} alt={selectedAsset.symbol} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#1F2937] text-white flex items-center justify-center text-[10px] font-black">
                          {selectedAsset.symbol.charAt(0)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-none">{selectedAsset.symbol}</span>
                      </div>
                      <CaretDown className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      className="bg-transparent border-none outline-none text-[28px] font-bold text-slate-900 dark:text-white w-full p-0 placeholder:text-slate-300 dark:placeholder:text-[#1F2937]"
                    />
                    <span className="text-[16px] font-bold text-slate-400 dark:text-white/40">{selectedAsset.symbol}</span>
                  </div>
                  <div className="text-[12px] font-medium text-slate-400 dark:text-white/50 mt-1">
                    ${borrowAmount ? (parseFloat(borrowAmount) * 0.08).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'} USD
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">Available: 13,450.25 {selectedAsset.symbol}</span>
                  <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">
                    Max Borrowable: <span className="font-bold text-[#00A8E8]">125.00 {selectedAsset.symbol}</span>
                  </span>
                </div>
              </div>

              {/* Position XP Section */}
              <div className="flex flex-col mb-2">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Position XP</span>
                  <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                </div>
                
                <div className="flex flex-col items-center bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-xl p-6 mb-4 relative shadow-sm">
                  
                  {/* Gauge Display */}
                  <div className="flex items-center justify-center gap-6 w-full">
                    {/* Circle */}
                    <div className="relative w-[110px] h-[110px] shrink-0">
                      {/* Background circle */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100 dark:text-[#1F2937]" />
                        {/* Progress circle */}
                        <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="transparent"
                          strokeDasharray="263.89"
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="text-emerald-500 dark:text-[#00E88A] transition-all duration-1000 ease-out" 
                        />
                      </svg>
                      {/* Inner Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[26px] font-black text-emerald-500 dark:text-[#00E88A]">100%</span>
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="flex flex-col flex-1">
                      <span className="text-[20px] font-bold text-emerald-500 dark:text-[#00E88A] mb-1">Healthy</span>
                      <span className="text-[13px] font-medium text-slate-500 dark:text-white/60 leading-snug">
                        Your position is in a safe zone.
                      </span>
                    </div>
                  </div>

                  {/* Gradient Segment line */}
                  <div className="w-full mt-6 relative px-2">
                    <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500 dark:from-red-400 dark:to-[#00E88A] opacity-90 flex items-center justify-between">
                      {/* Ticks */}
                      <div className="w-[2px] h-[6px] bg-white dark:bg-[#0B0F14] ml-[25%]"></div>
                      <div className="w-[2px] h-[6px] bg-white dark:bg-[#0B0F14] ml-[25%]"></div>
                      <div className="w-[2px] h-[6px] bg-white dark:bg-[#0B0F14] ml-[25%]"></div>
                      {/* Thumb */}
                      <div className="w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-500 dark:border-[#00E88A] absolute right-0 shadow-md transform translate-x-1/2"></div>
                    </div>
                    <div className="flex justify-between w-full mt-2 text-[10px] font-bold text-slate-400 dark:text-white/40">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                </div>

                {/* XP Breakdown Row */}
                <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60 mb-1 text-center">Health Impact</span>
                    <span className="text-[15px] font-bold text-emerald-500 dark:text-[#00E88A]">+12.45%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-l border-slate-200 dark:border-[#1F2937]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60 mb-1 text-center">LTV After Borrow</span>
                    <span className="text-[15px] font-bold text-slate-900 dark:text-white">62.35%</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-l border-slate-200 dark:border-[#1F2937]">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60 mb-1 text-center">Liquidation Price</span>
                    <span className="text-[15px] font-bold text-slate-900 dark:text-white">$0.0821</span>
                  </div>
                </div>

              </div>

            </div>

            {/* CTA Section */}
            <div className="p-6 pt-4 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-[#1F2937]/50">
              <button 
                className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold text-white transition-all shadow-md hover:shadow-lg ${
                  borrowAmount && collateralAmount ? 'bg-gradient-to-r from-[#00A8E8] to-[#0096D1] hover:from-[#0096D1] hover:to-[#0082B5]' : 'bg-slate-300 dark:bg-[#1F2937] text-slate-500 dark:text-white/40 cursor-not-allowed shadow-none'
                }`}
              >
                <LockKey weight="bold" className="w-5 h-5" />
                Execute Borrow
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
