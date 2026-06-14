// Sequential 2-step Collateral-to-Borrow console architecture strictly credited to Viqtorhvayx on GitHub
"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Info, Clock, Wallet, Bank, X, CaretDown, LockKey, ArrowLeft } from '@phosphor-icons/react';

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
  const [borrowStep, setBorrowStep] = useState<1 | 2>(1);
  const [collateralType, setCollateralType] = useState<'USDC' | 'USDT' | 'NFT'>('USDC');
  const [isCollateralDropdownOpen, setIsCollateralDropdownOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<number | null>(null);
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
                  onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); setBorrowStep(1); setCollateralType('USDC'); setSelectedNft(null); setIsCollateralDropdownOpen(false); setBorrowAmount(''); setCollateralAmount(''); setSelectedCollateralPercent(null); }}
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
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setIsModalOpen(true); setBorrowStep(1); setCollateralType('USDC'); setSelectedNft(null); setIsCollateralDropdownOpen(false); setBorrowAmount(''); setCollateralAmount(''); setSelectedCollateralPercent(null); }}
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
              <div className="flex items-center gap-3">
                {borrowStep === 2 && (
                  <button 
                    onClick={() => setBorrowStep(1)}
                    className="text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors p-1 -ml-1"
                  >
                    <ArrowLeft size={20} weight="bold" />
                  </button>
                )}
                <div className="flex flex-col">
                  <h3 className="text-[20px] font-bold text-slate-900 dark:text-white leading-none relative inline-block">
                    Borrow
                    <div className="absolute -bottom-2 left-0 w-full h-[3px] bg-[#00A8E8] rounded-full"></div>
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedAsset(null); }}
                className="text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors p-1"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            <div className="px-6 py-5 flex flex-col overflow-y-auto max-h-[80vh] custom-scrollbar overflow-x-hidden">

              {borrowStep === 1 ? (
                <div className="flex flex-col animate-in slide-in-from-right-4 duration-300">
                  {/* Collateral Deposit Section */}
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Collateral Deposit</span>
                      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                    </div>
                    
                    <div className="flex flex-col bg-[#F9FAFB] dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-[16px] relative focus-within:border-[#00A8E8]/50 focus-within:ring-2 focus-within:ring-[#00A8E8]/10 transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                      
                      {collateralType === 'NFT' ? (
                        <div className="p-4 flex flex-col relative w-full h-auto min-h-[120px]">
                          <div className="flex items-center justify-between mb-3 relative">
                            <span className="text-[14px] font-bold text-slate-900 dark:text-white">Select NFT</span>
                            <div 
                              onClick={() => setIsCollateralDropdownOpen(!isCollateralDropdownOpen)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-lg shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1F2937]/50 transition-colors z-10"
                            >
                              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">N</div>
                              <span className="text-[14px] font-bold text-slate-900 dark:text-white">{collateralType}</span>
                              <CaretDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCollateralDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            
                            <div className={`absolute top-full right-0 mt-2 w-[120px] bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] z-50 transition-all duration-200 ease-in-out origin-top-right ${isCollateralDropdownOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}>
                              <div className="flex flex-col p-1.5">
                                {['USDC', 'USDT', 'NFT'].map(type => (
                                  <div 
                                    key={type}
                                    onClick={() => { setCollateralType(type as any); setIsCollateralDropdownOpen(false); setSelectedNft(null); setCollateralAmount(''); }}
                                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 group outline-none focus:outline-none focus:ring-0 ${collateralType === type ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20' : 'hover:bg-[#00A8E8]/5 dark:hover:bg-[#00A8E8]/10'}`}
                                  >
                                    <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-none">{type}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mt-2 pb-1">
                            {[1, 2, 3, 4, 5, 6].map((id) => (
                              <div 
                                key={id} 
                                onClick={() => setSelectedNft(id)}
                                className={`aspect-square rounded-xl cursor-pointer border-2 transition-all overflow-hidden relative group ${
                                  selectedNft === id ? 'border-[#00A8E8]' : 'border-slate-200 dark:border-[#1F2937] hover:border-[#00A8E8]/50'
                                }`}
                              >
                                <div className="w-full h-full bg-slate-200/50 dark:bg-[#1F2937]/50 flex flex-col items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-[#1F2937] transition-colors">
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-white/40">NFT #{id}</span>
                                </div>
                                {selectedNft === id && (
                                  <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#00A8E8] rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-[10px] font-bold leading-none">✓</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full h-[120px] px-6 relative group">
                          
                          {/* Left Side: Input & USD Value */}
                          <div className="flex flex-col justify-center h-full flex-1">
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={collateralAmount}
                              onChange={(e) => { setCollateralAmount(e.target.value); setSelectedCollateralPercent(null); }}
                              className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[42px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-2" 
                            />
                            <span className="text-[12px] font-bold text-slate-400 dark:text-white/40 ml-1">
                              ${collateralAmount ? (parseFloat(collateralAmount) * 1).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'} USD
                            </span>
                          </div>

                          {/* Right Side: Token Pill Dropdown & Percentages */}
                          <div className="flex flex-col items-center justify-center h-full shrink-0">
                            <div className="mb-[14px] relative">
                              {/* Token Indicator Dropdown */}
                              <div 
                                onClick={() => setIsCollateralDropdownOpen(!isCollateralDropdownOpen)}
                                className="flex items-center justify-center gap-2 px-4 py-2 min-w-[104px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10"
                              >
                                {collateralType === 'USDC' && <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                                {collateralType === 'USDT' && <img src="https://cryptologos.cc/logos/tether-usdt-logo.png" alt="USDT" className="w-5 h-5 rounded-full object-cover shrink-0" />}
                                <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{collateralType}</span>
                                <CaretDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${isCollateralDropdownOpen ? 'rotate-180' : ''}`} />
                              </div>
                              
                              <div className={`absolute top-full right-0 mt-2 w-[120px] bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] z-50 transition-all duration-200 ease-in-out origin-top-right ${isCollateralDropdownOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}>
                                <div className="flex flex-col p-1.5">
                                  {['USDC', 'USDT', 'NFT'].map(type => (
                                    <div 
                                      key={type}
                                      onClick={() => { setCollateralType(type as any); setIsCollateralDropdownOpen(false); setSelectedNft(null); setCollateralAmount(''); }}
                                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 group outline-none focus:outline-none focus:ring-0 ${collateralType === type ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20' : 'hover:bg-[#00A8E8]/5 dark:hover:bg-[#00A8E8]/10'}`}
                                    >
                                      <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-none">{type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Shortcut Buttons */}
                            <div className="flex items-center justify-between w-full px-1">
                              <button 
                                onClick={() => setSelectedCollateralPercent('25%')}
                                className={`text-[12px] font-bold transition-colors ${selectedCollateralPercent === '25%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>25%</button>
                              <button 
                                onClick={() => setSelectedCollateralPercent('50%')}
                                className={`text-[12px] font-bold transition-colors ${selectedCollateralPercent === '50%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>50%</button>
                              <button 
                                onClick={() => setSelectedCollateralPercent('MAX')}
                                className={`text-[12px] font-bold transition-colors ${selectedCollateralPercent === 'MAX' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>MAX</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {collateralType !== 'NFT' && (
                      <div className="flex items-center justify-between mt-3 px-1 mb-2">
                        <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">Available Balance</span>
                        <span className="text-[12px] font-medium text-slate-700 dark:text-white/80">2,450.75 {collateralType}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col animate-in slide-in-from-right-4 duration-300">
                  {/* Borrow Asset Section */}
                  <div className="flex flex-col mb-6">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Borrow Asset</span>
                      <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                    </div>
                    
                    <div className="flex items-center justify-between w-full h-[120px] px-6 bg-[#F9FAFB] dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-[16px] transition-all focus-within:border-[#00A8E8]/50 focus-within:ring-2 focus-within:ring-[#00A8E8]/10 group">
                      
                      {/* Left Side: Input & USD Value */}
                      <div className="flex flex-col justify-center h-full flex-1">
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[42px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-2" 
                        />
                        <span className="text-[12px] font-bold text-slate-400 dark:text-white/40 ml-1">
                          ${borrowAmount ? (parseFloat(borrowAmount) * 0.08).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'} USD
                        </span>
                      </div>

                      {/* Right Side: Token Indicator Pill & Percentages */}
                      <div className="flex flex-col items-center justify-center h-full shrink-0">
                        <div className="mb-[14px]">
                          {/* Fixed Token Indicator */}
                          <div className="flex items-center justify-center gap-2 px-4 py-2 min-w-[104px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)]">
                            {logos[selectedAsset.symbol] ? (
                              <img src={logos[selectedAsset.symbol]} alt={selectedAsset.symbol} className="w-5 h-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#1F2937] text-slate-900 dark:text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                {selectedAsset.symbol.charAt(0)}
                              </div>
                            )}
                            <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{selectedAsset.symbol}</span>
                          </div>
                        </div>

                        {/* Shortcut Buttons */}
                        <div className="flex items-center justify-between w-full px-1">
                          <button 
                            onClick={() => setBorrowAmount((parseFloat(collateralAmount || '0') * 0.75 * 0.25).toString())}
                            className="text-[12px] font-bold transition-colors text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]"
                          >25%</button>
                          <button 
                            onClick={() => setBorrowAmount((parseFloat(collateralAmount || '0') * 0.75 * 0.5).toString())}
                            className="text-[12px] font-bold transition-colors text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]"
                          >50%</button>
                          <button 
                            onClick={() => setBorrowAmount((parseFloat(collateralAmount || '0') * 0.75).toString())}
                            className="text-[12px] font-bold transition-colors text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]"
                          >MAX</button>
                        </div>
                      </div>

                    </div>

                    <div className="flex items-center justify-between mt-3 px-1 mb-2">
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">Available: 13,450.25 {selectedAsset.symbol}</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/60">
                        Max Borrowable: <span className="font-bold text-[#00A8E8]">
                          {collateralType === 'NFT' 
                            ? '500.00' 
                            : collateralAmount ? (parseFloat(collateralAmount) * 0.75).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0.00'
                          } {selectedAsset.symbol}
                        </span>
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
              )}

            </div>

            {/* CTA Section */}
            <div className="p-6 pt-4 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-[#1F2937]/50">
              {borrowStep === 1 ? (
                <button 
                  onClick={() => setBorrowStep(2)}
                  disabled={collateralType === 'NFT' ? selectedNft === null : !collateralAmount || parseFloat(collateralAmount) <= 0}
                  className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold text-white transition-all shadow-md hover:shadow-lg ${
                    (collateralType === 'NFT' ? selectedNft !== null : collateralAmount && parseFloat(collateralAmount) > 0) ? 'bg-[#00A8E8] hover:bg-[#0096D1]' : 'bg-slate-300 dark:bg-[#1F2937] text-slate-500 dark:text-white/40 cursor-not-allowed shadow-none'
                  }`}
                >
                  Deposit Collateral
                </button>
              ) : (
                <button 
                  disabled={!borrowAmount || parseFloat(borrowAmount) <= 0 || (collateralType !== 'NFT' && parseFloat(borrowAmount) > parseFloat(collateralAmount) * 0.75)}
                  className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 text-[15px] font-bold text-white transition-all shadow-md hover:shadow-lg ${
                    borrowAmount && parseFloat(borrowAmount) > 0 && (collateralType === 'NFT' || parseFloat(borrowAmount) <= parseFloat(collateralAmount) * 0.75) ? 'bg-gradient-to-r from-[#00A8E8] to-[#0096D1] hover:from-[#0096D1] hover:to-[#0082B5]' : 'bg-slate-300 dark:bg-[#1F2937] text-slate-500 dark:text-white/40 cursor-not-allowed shadow-none'
                  }`}
                >
                  <LockKey weight="bold" className="w-5 h-5" />
                  Borrow {selectedAsset.symbol}
                </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}    </div>
  );
};
