// Implementation by Viqtorhvayx
"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Stack, ChartPieSlice, Wallet, Info, X, ArrowUp, LockKey } from '@phosphor-icons/react';

interface LendingModuleProps {
  points: number;
  theme?: 'light' | 'dark';
}

const MOCK_ASSETS = [
  { symbol: 'HBAR', name: 'HBAR', apy: '3.25%', deposited: '1.24K HBAR', depositedUsd: '$110.45 USD', earnings: '12.45 HBAR', earningsUsd: '$1.10 USD', tvl: '13.45K HBAR', tvlUsd: '$1.19K USD', cgId: 'hedera-hashgraph' },
  { symbol: 'SAUCE', name: 'SAUCE', apy: '5.12%', deposited: '2.34K SAUCE', depositedUsd: '$234.00 USD', earnings: '23.40 SAUCE', earningsUsd: '$2.34 USD', tvl: '5.67M SAUCE', tvlUsd: '$567.03K USD', cgId: 'saucerswap' },
  { symbol: 'WBTC', name: 'WBTC', apy: '2.85%', deposited: '0.0456 WBTC', depositedUsd: '$2,870.45 USD', earnings: '0.0006 WBTC', earningsUsd: '$37.85 USD', tvl: '320.45 WBTC', tvlUsd: '$20.19M USD', cgId: 'wrapped-bitcoin' },
  { symbol: 'WETH', name: 'WETH', apy: '2.60%', deposited: '1.24 WETH', depositedUsd: '$3,142.45 USD', earnings: '0.0324 WETH', earningsUsd: '$81.78 USD', tvl: '8.94K WETH', tvlUsd: '$22.58M USD', cgId: 'weth' },
  { symbol: 'PACK', name: 'PACK', apy: '7.15%', deposited: '12.45K PACK', depositedUsd: '$1,245.00 USD', earnings: '87.15 PACK', earningsUsd: '$8.72 USD', tvl: '25.45M PACK', tvlUsd: '$2.54M USD', cgId: 'hashpack' },
  { symbol: 'BONZO', name: 'BONZO', apy: '6.35%', deposited: '5.43K BONZO', depositedUsd: '$543.00 USD', earnings: '34.47 BONZO', earningsUsd: '$3.44 USD', tvl: '15.34M BONZO', tvlUsd: '$1.53M USD', cgId: 'bonzo-finance' },
  { symbol: 'JAM', name: 'JAM', apy: '4.90%', deposited: '9.87K JAM', depositedUsd: '$987.60 USD', earnings: '48.39 JAM', earningsUsd: '$4.83 USD', tvl: '9.87M JAM', tvlUsd: '$987.65K USD', cgId: 'tune-fm' },
  { symbol: 'DOVU', name: 'DOVU', apy: '6.80%', deposited: '3.21K DOVU', depositedUsd: '$321.00 USD', earnings: '21.83 DOVU', earningsUsd: '$2.18 USD', tvl: '6.21M DOVU', tvlUsd: '$621.04K USD', cgId: 'dovu' },
  { symbol: 'GRELF', name: 'GRELF', apy: '5.65%', deposited: '7.65K GRELF', depositedUsd: '$765.00 USD', earnings: '43.22 GRELF', earningsUsd: '$4.32 USD', tvl: '7.65M GRELF', tvlUsd: '$765.02K USD', cgId: 'grelf' },
  { symbol: 'HST', name: 'HST', apy: '3.90%', deposited: '15.32K HST', depositedUsd: '$1.53K USD', earnings: '59.75 HST', earningsUsd: '$5.97 USD', tvl: '15.32M HST', tvlUsd: '$1.53M USD', cgId: 'headstarter' },
  { symbol: 'STEAM', name: 'STEAM', apy: '6.10%', deposited: '4.56K STEAM', depositedUsd: '$456.00 USD', earnings: '27.82 STEAM', earningsUsd: '$2.78 USD', tvl: '4.56M STEAM', tvlUsd: '$456.07K USD', cgId: 'steamexchange' },
  { symbol: 'KBL', name: 'KBL', apy: '4.75%', deposited: '2.89K KBL', depositedUsd: '$289.00 USD', earnings: '13.72 KBL', earningsUsd: '$1.37 USD', tvl: '2.89M KBL', tvlUsd: '$289.03K USD', cgId: 'karabiner' },
];

export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isLogosLoading, setIsLogosLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [lendAmount, setLendAmount] = useState('0');
  const [selectedPercent, setSelectedPercent] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const ids = MOCK_ASSETS.map(a => a.cgId).join(',');
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}`);
        
        if (res.ok) {
          const data = await res.json();
          const newLogos: Record<string, string> = {};
          data.forEach((coin: any) => {
            if (coin.image) {
              const symbol = MOCK_ASSETS.find(a => a.cgId === coin.id)?.symbol;
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

  return (
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      

      {/* Top Metrics Section (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Total Supply */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <Stack className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60 mb-1">Total Supply</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">42,390.75 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-white/50">$3,756.45 USD</span>
          </div>
        </div>

        {/* Current Utilization */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <ChartPieSlice className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-[12px] font-medium text-slate-500 dark:text-white/60 mb-1">Current Utilization</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-2">68.45%</span>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-[#1F2937] rounded-full overflow-hidden">
              <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '68.45%' }}></div>
            </div>
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

      {/* Lend Assets Section */}
      <div className="flex flex-col">
        <div className="flex flex-col mb-6">
          <h2 className="text-[20px] font-bold text-slate-900 dark:text-white mb-1">Lend Assets</h2>
          <span className="text-[13px] text-slate-500 dark:text-white/60">Supply your assets and start earning yield instantly.</span>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] overflow-hidden shadow-sm">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-[#1F2937] bg-slate-50/50 dark:bg-[#0B0F14]/50 text-[12px] font-medium text-slate-500 dark:text-white/60">
            <div className="col-span-3 pl-2">Asset</div>
            <div className="col-span-2 flex items-center gap-1">APY <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2">Amount Deposited</div>
            <div className="col-span-2 flex items-center gap-1">Earnings <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2">TVL</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {MOCK_ASSETS.map((asset, index) => {
              const isSelected = selectedAsset?.symbol === asset.symbol;
              return (
                <div 
                  key={asset.symbol} 
                  onClick={() => { setSelectedAsset(asset); setIsModalOpen(true); setLendAmount(''); setSelectedPercent(null); }}
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all cursor-pointer relative ${
                    isSelected 
                      ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20 ring-1 ring-[#00A8E8]/50 z-10 rounded-xl shadow-[0_0_15px_rgba(0,168,232,0.15)]' 
                      : `hover:bg-slate-50 dark:hover:bg-[#1F2937]/30 ${index !== MOCK_ASSETS.length - 1 ? 'border-b border-slate-100 dark:border-[#1F2937]' : ''}`
                  }`}
                >
                
                {/* Asset Column */}
                <div className="col-span-3 flex items-center gap-3 pl-2">
                  {!isLogosLoading && logos[asset.symbol] ? (
                    <img src={logos[asset.symbol]} alt={`${asset.name} Logo`} className="w-8 h-8 rounded-full object-cover shadow-sm bg-slate-900 dark:bg-white" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[12px] font-black shadow-sm">
                      {asset.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">{asset.name}</span>
                    <span className="text-[12px] text-slate-500 dark:text-white/50">{asset.symbol}</span>
                  </div>
                </div>

                {/* APY Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-[#00A8E8]">{asset.apy}</span>
                  <span className="text-[12px] text-[#00A8E8] font-medium">Variable</span>
                </div>

                {/* Amount Deposited Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-medium text-slate-900 dark:text-white">{asset.deposited}</span>
                  <span className="text-[12px] text-slate-400 dark:text-white/50">{asset.depositedUsd}</span>
                </div>

                {/* Earnings Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-medium text-slate-900 dark:text-white">{asset.earnings}</span>
                  <span className="text-[12px] text-slate-400 dark:text-white/50">{asset.earningsUsd}</span>
                </div>

                {/* TVL Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-medium text-slate-900 dark:text-white">{asset.tvl}</span>
                  <span className="text-[12px] text-slate-400 dark:text-white/50">{asset.tvlUsd}</span>
                </div>

                {/* Action Column */}
                <div className="col-span-1 flex justify-end pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setIsModalOpen(true); setLendAmount(''); setSelectedPercent(null); }}
                    className={`px-5 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-[#00A8E8] text-white border-[#00A8E8] shadow-[0_0_10px_rgba(0,168,232,0.3)]' 
                        : 'border-[#00A8E8] text-[#00A8E8] hover:bg-[#00A8E8] hover:text-white'
                    }`}>
                    Lend
                  </button>
                </div>

              </div>
            )})}
          </div>

        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] rounded-[16px] shadow-2xl w-full max-w-[440px] mx-auto flex flex-col relative overflow-hidden border border-slate-200 dark:border-[#1F2937] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-[20px] font-bold text-slate-900 dark:text-white leading-none">Lend {selectedAsset.symbol}</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white transition-colors p-1"
              >
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 pt-2 flex flex-col">
              
              {/* Top Info Card (2-Column) */}
              <div className="flex items-center w-full mb-6">
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-white/60">APY</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[22px] font-bold text-[#00A8E8] leading-none">{selectedAsset.apy}</span>
                    <span className="text-[13px] font-bold text-[#00A8E8]">Variable</span>
                  </div>
                </div>
                
                <div className="w-px h-10 bg-slate-200 dark:bg-[#1F2937] mx-4"></div>
                
                <div className="flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-white/60">Vault TVL</span>
                    <Info className="w-3.5 h-3.5 text-slate-400 dark:text-white/40" />
                  </div>
                  <span className="text-[18px] font-bold text-slate-900 dark:text-white mb-0.5 leading-none">{selectedAsset.tvl}</span>
                  <span className="text-[13px] text-slate-400 dark:text-white/50">{selectedAsset.tvlUsd}</span>
                </div>
              </div>

              {/* Input Section */}
              <div className="flex flex-col w-full mb-3">
                <label className="text-[14px] font-bold text-slate-900 dark:text-white mb-2.5">Amount to Lend</label>
                <div className="flex items-center justify-between w-full h-[96px] px-5 bg-[#F9FAFB] dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-[16px] transition-all focus-within:border-[#00A8E8]/50 focus-within:ring-2 focus-within:ring-[#00A8E8]/10">
                  
                  {/* Left: Token */}
                  <div className="flex items-center gap-3 shrink-0">
                    {!isLogosLoading && logos[selectedAsset.symbol] ? (
                      <img src={logos[selectedAsset.symbol]} alt={`${selectedAsset.name} Logo`} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-900 dark:bg-white" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[13px] font-black shadow-sm">
                        {selectedAsset.symbol.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">{selectedAsset.name}</span>
                      <span className="text-[13px] text-slate-500 dark:text-white/50">{selectedAsset.symbol}</span>
                    </div>
                  </div>

                  {/* Right: Input */}
                  <div className="flex flex-col items-end justify-center h-full flex-1 ml-4">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={lendAmount}
                      onChange={(e) => setLendAmount(e.target.value)}
                      className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[36px] font-bold w-full text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-1" 
                    />
                    <span className="text-[14px] font-medium text-slate-400 dark:text-white/40">$0.00</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center w-full gap-2.5 mb-7">
                <button 
                  onClick={() => setSelectedPercent('25%')}
                  className={`flex-1 py-2.5 rounded-[10px] border text-[13px] font-bold transition-all ${selectedPercent === '25%' ? 'border-[#00A8E8] bg-[#00A8E8]/5 text-[#00A8E8]' : 'border-slate-200 dark:border-[#1F2937] text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-[#1F2937]/50 hover:border-slate-300 dark:hover:border-[#374151]'}`}>
                  25%
                </button>
                <button 
                  onClick={() => setSelectedPercent('50%')}
                  className={`flex-1 py-2.5 rounded-[10px] border text-[13px] font-bold transition-all ${selectedPercent === '50%' ? 'border-[#00A8E8] bg-[#00A8E8]/5 text-[#00A8E8]' : 'border-slate-200 dark:border-[#1F2937] text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-[#1F2937]/50 hover:border-slate-300 dark:hover:border-[#374151]'}`}>
                  50%
                </button>
                <button 
                  onClick={() => setSelectedPercent('MAX')}
                  className={`flex-1 py-2.5 rounded-[10px] border text-[13px] font-bold transition-all ${selectedPercent === 'MAX' ? 'border-[#00A8E8] bg-[#00A8E8]/5 text-[#00A8E8]' : 'border-slate-200 dark:border-[#1F2937] text-[#00A8E8] hover:bg-[#00A8E8]/5 hover:border-[#00A8E8]/30'}`}>
                  MAX
                </button>
              </div>

              {/* Balance Info */}
              <div className="flex flex-col gap-3 mb-8 px-1">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-slate-500 dark:text-white/60">Available Balance</span>
                  <span className="text-[14px] font-medium text-slate-700 dark:text-white/80">2,450.75 {selectedAsset.symbol}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-slate-500 dark:text-white/60">USD Value</span>
                  <span className="text-[14px] font-medium text-slate-700 dark:text-white/80">$217.45 USD</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 rounded-[12px] border border-[#00A8E8] text-[#00A8E8] text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#00A8E8]/5 transition-colors active:scale-[0.98]"
                >
                  <ArrowUp size={18} weight="bold" />
                  Withdraw
                </button>
                <button 
                  className="flex-1 h-14 bg-[#00A8E8] hover:bg-[#0090C7] text-white rounded-[12px] text-[16px] font-bold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(0,168,232,0.25)] transition-all duration-300 active:scale-[0.98]"
                >
                  <LockKey size={18} weight="bold" />
                  Lend
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
