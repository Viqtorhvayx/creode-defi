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
          <div className="flex items-center gap-2 mb-1">
            <svg 
              className="w-[22px] h-[22px] shrink-0 text-slate-900 dark:text-white"
              viewBox="0 0 720 768" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="currentColor" opacity="1.0" stroke="none" d="M721.000000,720.000000 C721.000000,736.283875 721.000000,752.567810 721.000000,769.000000 C689.312561,769.000000 657.624939,769.000000 625.375488,768.593506 C624.668335,766.493591 625.114563,764.915771 625.576050,763.297058 C629.143433,750.783325 638.521362,743.213806 649.015259,737.242126 C671.253967,724.587097 695.710510,720.354919 721.000000,720.000000 z"/>
              <path fill="currentColor" opacity="1.0" stroke="none" d="M1.000000,726.468628 C22.435741,725.571838 43.526924,727.745667 63.852039,734.936401 C73.784363,738.450378 83.180984,743.136230 90.944885,750.468262 C96.089973,755.327209 100.448959,760.751709 101.084084,768.606873 C67.768959,769.000000 34.537922,769.000000 1.000000,769.000000 C1.000000,754.980591 1.000000,740.958984 1.000000,726.468628 M34.658001,734.543213 C32.670017,734.039673 30.578968,733.574646 29.603304,736.035583 C28.998011,737.562378 29.803045,738.963135 31.019049,739.971863 C32.248611,740.992004 33.532890,740.660645 34.603371,739.690674 C36.129364,738.308105 37.681721,736.838562 34.658001,734.543213 z"/>
              <path fill="currentColor" opacity="1.0" stroke="none" d="M589.466125,769.000000 C587.680359,759.757324 591.394104,751.940552 596.557678,744.867737 C606.931274,730.658142 621.661377,722.287476 637.527588,715.706116 C663.096069,705.100220 689.900269,700.812012 717.436768,700.409424 C718.424988,700.394958 719.411377,700.252014 720.699341,700.084473 C721.000000,703.030579 721.000000,706.061218 720.534363,709.586487 C710.910034,709.932312 701.858276,710.943726 692.795471,712.211060 C669.033875,715.534058 646.193237,721.613403 626.162109,735.357727 C614.374878,743.445435 604.903015,753.520752 604.000000,769.000000 C599.310730,769.000000 594.621521,769.000000 589.466125,769.000000 z"/>
              {/* IMPORTANT: The rest of your SVG paths were truncated. Please paste them below this line! */}
            </svg>
            <h2 className="text-[20px] font-bold text-slate-900 dark:text-white">Lend Assets</h2>
          </div>
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
                  className={`grid grid-cols-12 gap-4 p-4 items-center transition-all cursor-pointer relative outline-none focus:outline-none focus:ring-0 ${
                    isSelected 
                      ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20 z-10 rounded-xl' 
                      : `hover:bg-slate-50 dark:hover:bg-[#1F2937]/30 ${index !== MOCK_ASSETS.length - 1 ? 'border-b border-slate-100 dark:border-[#1F2937]' : ''}`
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

                {/* APY Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-bold text-[#00A8E8]">{asset.apy}</span>
                  <span className="text-[12px] text-[#00A8E8] font-medium">Variable</span>
                </div>

                {/* Amount Deposited Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className={`text-[14px] font-medium ${isSelected ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white'}`}>{asset.deposited}</span>
                  <span className={`text-[12px] ${isSelected ? 'text-[#00A8E8]/80' : 'text-slate-400 dark:text-white/50'}`}>{asset.depositedUsd}</span>
                </div>

                {/* Earnings Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className={`text-[14px] font-medium ${isSelected ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white'}`}>{asset.earnings}</span>
                  <span className={`text-[12px] ${isSelected ? 'text-[#00A8E8]/80' : 'text-slate-400 dark:text-white/50'}`}>{asset.earningsUsd}</span>
                </div>

                {/* TVL Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className={`text-[14px] font-medium ${isSelected ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white'}`}>{asset.tvl}</span>
                  <span className={`text-[12px] ${isSelected ? 'text-[#00A8E8]/80' : 'text-slate-400 dark:text-white/50'}`}>{asset.tvlUsd}</span>
                </div>

                {/* Action Column */}
                <div className="col-span-1 flex justify-end pr-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); setIsModalOpen(true); setLendAmount(''); setSelectedPercent(null); }}
                    className={`px-5 py-1.5 rounded-lg border text-[13px] font-semibold transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-[#00A8E8] text-white border-[#00A8E8]' 
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
                onClick={() => { setIsModalOpen(false); setSelectedAsset(null); }}
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
              <div className="flex flex-col w-full mb-7">
                <label className="text-[14px] font-bold text-slate-900 dark:text-white mb-2.5">Amount to Lend</label>
                <div className="flex items-center justify-between w-full h-[120px] px-6 bg-[#F9FAFB] dark:bg-[#0B0F14] border border-slate-200 dark:border-[#1F2937] rounded-[16px] transition-all focus-within:border-[#00A8E8]/50 focus-within:ring-2 focus-within:ring-[#00A8E8]/10 group">
                  
                  {/* Left Side: Input & USD Value */}
                  <div className="flex flex-col justify-center h-full flex-1">
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={lendAmount}
                      onChange={(e) => setLendAmount(e.target.value)}
                      className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[42px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-2" 
                    />
                    <span className="text-[12px] font-bold text-slate-400 dark:text-white/40 ml-1">$0.00</span>
                  </div>

                  {/* Right Side: Token & Percentages */}
                  <div className="flex flex-col items-center justify-center h-full shrink-0">
                    <div className="mb-[14px]">
                      {/* Fixed Token Indicator (styled like Vault selector) */}
                      <div className="flex items-center justify-center gap-2 px-4 py-2 min-w-[104px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)]">
                        {!isLogosLoading && logos[selectedAsset.symbol] ? (
                          <img src={logos[selectedAsset.symbol]} alt={`${selectedAsset.name} Logo`} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-[#1F2937] text-slate-900 dark:text-white flex items-center justify-center text-[10px] font-black shrink-0">{selectedAsset.symbol.charAt(0)}</span>
                        )}
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{selectedAsset.symbol}</span>
                      </div>
                    </div>

                    {/* Shortcut Buttons */}
                    <div className="flex items-center justify-between w-full px-1">
                      <button 
                        onClick={() => setSelectedPercent(prev => prev === '25%' ? null : '25%')}
                        className={`text-[12px] font-bold transition-colors ${selectedPercent === '25%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>25%</button>
                      <button 
                        onClick={() => setSelectedPercent(prev => prev === '50%' ? null : '50%')}
                        className={`text-[12px] font-bold transition-colors ${selectedPercent === '50%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>50%</button>
                      <button 
                        onClick={() => setSelectedPercent(prev => prev === 'MAX' ? null : 'MAX')}
                        className={`text-[12px] font-bold transition-colors ${selectedPercent === 'MAX' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>MAX</button>
                    </div>
                  </div>

                </div>
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
              <div className="flex items-center gap-4 w-full">
                <button 
                  className="flex-1 h-14 rounded-[12px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-[#00A8E8]/15 hover:bg-[#00A8E8]/25 text-[#00A8E8] active:bg-[#00A8E8] dark:active:bg-[#00A8E8] active:text-white dark:active:text-white active:shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:active:shadow-[0_0_20px_rgba(0,168,232,0.3)]"
                >
                  Lend
                </button>
                <button 
                  onClick={() => { setIsModalOpen(false); setSelectedAsset(null); }}
                  className="flex-1 h-14 rounded-[12px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-[#00A8E8]/15 hover:bg-[#00A8E8]/25 text-[#00A8E8] active:bg-[#00A8E8] dark:active:bg-[#00A8E8] active:text-white dark:active:text-white active:shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:active:shadow-[0_0_20px_rgba(0,168,232,0.3)]"
                >
                  Withdraw
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
