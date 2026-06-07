// Implementation by Viqtorhvayx
"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Stack, ChartPieSlice, Wallet, Info } from '@phosphor-icons/react';

interface LendingModuleProps {
  points: number;
  theme?: 'light' | 'dark';
}

const MOCK_ASSETS = [
  { symbol: 'HBAR', name: 'HBAR', apy: '3.25%', deposited: '1,245.50 HBAR', depositedUsd: '$110.45 USD', earnings: '12.45 HBAR', earningsUsd: '$1.10 USD', tvl: '13,450.25 HBAR', tvlUsd: '$1,194.45 USD', cgId: 'hedera-hashgraph' },
  { symbol: 'SAUCE', name: 'SAUCE', apy: '5.12%', deposited: '2,340.00 SAUCE', depositedUsd: '$234.00 USD', earnings: '23.40 SAUCE', earningsUsd: '$2.34 USD', tvl: '5,670,340.00 SAUCE', tvlUsd: '$567,034.00 USD', cgId: 'saucerswap' },
  { symbol: 'WBTC', name: 'WBTC', apy: '2.85%', deposited: '0.0456 WBTC', depositedUsd: '$2,870.45 USD', earnings: '0.0006 WBTC', earningsUsd: '$37.85 USD', tvl: '320.45 WBTC', tvlUsd: '$20,192,850.45 USD', cgId: 'wrapped-bitcoin' },
  { symbol: 'WETH', name: 'WETH', apy: '2.60%', deposited: '1.2456 WETH', depositedUsd: '$3,142.45 USD', earnings: '0.0324 WETH', earningsUsd: '$81.78 USD', tvl: '8,945.67 WETH', tvlUsd: '$22,580,190.45 USD', cgId: 'weth' },
  { symbol: 'PACK', name: 'PACK', apy: '7.15%', deposited: '12,450.00 PACK', depositedUsd: '$1,245.00 USD', earnings: '87.15 PACK', earningsUsd: '$8.72 USD', tvl: '25,450,120.00 PACK', tvlUsd: '$2,545,012.00 USD', cgId: 'hashpack' },
  { symbol: 'BONZO', name: 'BONZO', apy: '6.35%', deposited: '5,430.00 BONZO', depositedUsd: '$543.00 USD', earnings: '34.47 BONZO', earningsUsd: '$3.44 USD', tvl: '15,340,230.00 BONZO', tvlUsd: '$1,534,023.00 USD', cgId: 'bonzo-finance' },
  { symbol: 'JAM', name: 'JAM', apy: '4.90%', deposited: '9,876.00 JAM', depositedUsd: '$987.60 USD', earnings: '48.39 JAM', earningsUsd: '$4.83 USD', tvl: '9,876,543.00 JAM', tvlUsd: '$987,654.30 USD', cgId: 'tune-fm' },
  { symbol: 'DOVU', name: 'DOVU', apy: '6.80%', deposited: '3,210.00 DOVU', depositedUsd: '$321.00 USD', earnings: '21.83 DOVU', earningsUsd: '$2.18 USD', tvl: '6,210,430.00 DOVU', tvlUsd: '$621,043.00 USD', cgId: 'dovu' },
  { symbol: 'GRELF', name: 'GRELF', apy: '5.65%', deposited: '7,650.00 GRELF', depositedUsd: '$765.00 USD', earnings: '43.22 GRELF', earningsUsd: '$4.32 USD', tvl: '7,650,210.00 GRELF', tvlUsd: '$765,021.00 USD', cgId: 'grelf' },
  { symbol: 'HST', name: 'HST', apy: '3.90%', deposited: '15,320.00 HST', depositedUsd: '$1,532.00 USD', earnings: '59.75 HST', earningsUsd: '$5.97 USD', tvl: '15,320,450.00 HST', tvlUsd: '$1,532,045.00 USD', cgId: 'headstarter' },
  { symbol: 'STEAM', name: 'STEAM', apy: '6.10%', deposited: '4,560.00 STEAM', depositedUsd: '$456.00 USD', earnings: '27.82 STEAM', earningsUsd: '$2.78 USD', tvl: '4,560,780.00 STEAM', tvlUsd: '$456,078.00 USD', cgId: 'steamexchange' },
  { symbol: 'KBL', name: 'KBL', apy: '4.75%', deposited: '2,890.00 KBL', depositedUsd: '$289.00 USD', earnings: '13.72 KBL', earningsUsd: '$1.37 USD', tvl: '2,890,340.00 KBL', tvlUsd: '$289,034.00 USD', cgId: 'karabiner' },
];

export const LendingModule: React.FC<LendingModuleProps> = ({ points, theme }) => {
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isLogosLoading, setIsLogosLoading] = useState(true);

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
    <div className="w-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-[1200px] mx-auto">
      
      {/* Top Header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-[32px] font-bold text-slate-900 dark:text-white leading-none tracking-tight">Lend</h1>
          <ShieldCheck className="w-6 h-6 text-[#00A8E8]" weight="regular" />
        </div>
        <p className="text-[13px] text-slate-500 dark:text-white/60">Lend your assets and earn competitive yields.</p>
      </div>

      {/* Top Metrics Section (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        
        {/* Total Supply */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <Stack className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-slate-500 dark:text-gray-400 mb-1">Total Supply</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">42,390.75 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-gray-500">$3,756.45 USD</span>
          </div>
        </div>

        {/* Current Utilization */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] p-6 flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#F0F7FF] dark:bg-[#00A8E8]/10 flex items-center justify-center shrink-0">
            <ChartPieSlice className="w-6 h-6 text-[#00A8E8]" weight="fill" />
          </div>
          <div className="flex flex-col w-full">
            <span className="text-[12px] font-medium text-slate-500 dark:text-gray-400 mb-1">Current Utilization</span>
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
            <span className="text-[12px] font-medium text-slate-500 dark:text-gray-400 mb-1">Total Available</span>
            <span className="text-[20px] font-bold text-slate-900 dark:text-white mb-0.5">13,450.25 HBAR</span>
            <span className="text-[13px] text-slate-400 dark:text-gray-500">$1,194.45 USD</span>
          </div>
        </div>

      </div>

      {/* Lend Assets Section */}
      <div className="flex flex-col">
        <div className="flex flex-col mb-6">
          <h2 className="text-[20px] font-bold text-slate-900 dark:text-white mb-1">Lend Assets</h2>
          <span className="text-[13px] text-slate-500 dark:text-gray-400">Supply your assets and start earning yield instantly.</span>
        </div>

        {/* Table Container */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#1F2937] rounded-[16px] overflow-hidden shadow-sm">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-[#1F2937] bg-slate-50/50 dark:bg-[#0B0F14]/50 text-[12px] font-medium text-slate-500 dark:text-gray-400">
            <div className="col-span-3 pl-2">Asset</div>
            <div className="col-span-2 flex items-center gap-1">APY <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2">Amount Deposited</div>
            <div className="col-span-2 flex items-center gap-1">Earnings <Info className="w-3.5 h-3.5" /></div>
            <div className="col-span-2">TVL</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Body */}
          <div className="flex flex-col">
            {MOCK_ASSETS.map((asset, index) => (
              <div 
                key={asset.symbol} 
                className={`grid grid-cols-12 gap-4 p-4 items-center transition-colors hover:bg-slate-50 dark:hover:bg-[#1F2937]/30 ${index !== MOCK_ASSETS.length - 1 ? 'border-b border-slate-100 dark:border-[#1F2937]' : ''}`}
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
                    <span className="text-[12px] text-slate-500 dark:text-gray-500">{asset.symbol}</span>
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
                  <span className="text-[12px] text-slate-400 dark:text-gray-500">{asset.depositedUsd}</span>
                </div>

                {/* Earnings Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-medium text-slate-900 dark:text-white">{asset.earnings}</span>
                  <span className="text-[12px] text-slate-400 dark:text-gray-500">{asset.earningsUsd}</span>
                </div>

                {/* TVL Column */}
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-[14px] font-medium text-slate-900 dark:text-white">{asset.tvl}</span>
                  <span className="text-[12px] text-slate-400 dark:text-gray-500">{asset.tvlUsd}</span>
                </div>

                {/* Action Column */}
                <div className="col-span-1 flex justify-end pr-2">
                  <button className="px-5 py-1.5 rounded-lg border border-[#00A8E8] text-[#00A8E8] text-[13px] font-semibold hover:bg-[#00A8E8] hover:text-white transition-colors duration-200">
                    Lend
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};
