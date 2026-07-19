"use client";

import React, { useState, useEffect } from 'react';
import { CommunityTab } from './CommunityTab';
import { EarnStrategyDetail } from './EarnStrategyDetail';
import { 
  ChartLineUp, 
  Stack, 
  Info,
  Star,
  Drop,
  CaretLeft,
  CaretRight,
  ArrowRight,
  CaretDown,
  GridFour,
  List
} from '@phosphor-icons/react';

interface EarnTabProps {
  theme: 'light' | 'dark';
}

export const EarnTab: React.FC<EarnTabProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('Yield Hub');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  
  // State for token logos
  const [hbarLogoUrlSmall, setHbarLogoUrlSmall] = useState<string | null>(null);
  const [usdcLogoUrlSmall, setUsdcLogoUrlSmall] = useState<string | null>(null);
  const [sauceLogoUrlSmall, setSauceLogoUrlSmall] = useState<string | null>(null);
  const [wbtcLogoUrlSmall, setWbtcLogoUrlSmall] = useState<string | null>(null);
  const [wethLogoUrlSmall, setWethLogoUrlSmall] = useState<string | null>(null);
  const [isLogosLoading, setIsLogosLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=hedera-hashgraph,usd-coin,saucerswap,wrapped-bitcoin,weth");
        
        if (res.ok) {
          const data = await res.json();
          data.forEach((coin: any) => {
            if (coin.id === 'hedera-hashgraph' && coin.image) setHbarLogoUrlSmall(coin.image);
            else if (coin.id === 'usd-coin' && coin.image) setUsdcLogoUrlSmall(coin.image);
            else if (coin.id === 'saucerswap' && coin.image) setSauceLogoUrlSmall(coin.image);
            else if (coin.id === 'wrapped-bitcoin' && coin.image) setWbtcLogoUrlSmall(coin.image);
            else if (coin.id === 'weth' && coin.image) setWethLogoUrlSmall(coin.image);
          });
        }
      } catch (err) {
        console.error("CoinGecko Logo Error:", err);
      } finally {
        setIsLogosLoading(false);
      }
    };

    fetchLogos();
  }, []);

  const emeraldRisk = {
    riskBgClass: theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50',
    riskTextClass: 'text-emerald-600 dark:text-emerald-500',
  };
  const roseRisk = {
    riskBgClass: theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50',
    riskTextClass: 'text-rose-600 dark:text-rose-500',
  };

  const hbar = { sym: 'HBAR', logo: hbarLogoUrlSmall, fallback: 'H', bg: 'bg-black' };
  const sauce = { sym: 'SAUCE', logo: sauceLogoUrlSmall, fallback: 'S', bg: 'bg-red-500' };
  const wbtc = { sym: 'WBTC', logo: wbtcLogoUrlSmall, fallback: 'B', bg: 'bg-[#F7931A]' };
  const weth = { sym: 'WETH', logo: wethLogoUrlSmall, fallback: 'E', bg: 'bg-blue-600' };
  const usdc = { sym: 'USDC', logo: usdcLogoUrlSmall, fallback: 'U', bg: 'bg-[#2775CA]' };
  const dovu = { sym: 'DOVU', logo: '/tokens/dovu.png', fallback: 'D', bg: 'bg-white' };

  // The featured pool in the top banner is itself a selectable strategy.
  const featuredStrategy = {
    token1: hbar, token2: sauce, pair: 'HBAR-SAUCE', riskLevel: 'Balanced', apy: '45.2%', tvl: '$3.4M',
    ...emeraldRisk,
    token1Amount: '5,000.00', token1Usd: '$425.00',
    token2Amount: '12,450.00', token2Usd: '$425.00',
    dailyEarnings: '+14.2 HBAR / +35.4 SAUCE',
  };

  const strategies = [
    {
      token1: hbar, token2: wbtc, pair: 'HBAR-WBTC', riskLevel: 'Balanced', apy: '14.2%', tvl: '$8.5M',
      ...emeraldRisk,
      token1Amount: '5,000.00', token1Usd: '$425.00',
      token2Amount: '0.0071', token2Usd: '$425.00',
      dailyEarnings: '+2.1 HBAR / +0.0000029 WBTC',
    },
    {
      token1: hbar, token2: dovu, pair: 'HBAR-DOVU', riskLevel: 'Aggressive', apy: '62.1%', tvl: '$1.2M',
      ...roseRisk,
      token1Amount: '5,000.00', token1Usd: '$425.00',
      token2Amount: '48,200.00', token2Usd: '$425.00',
      dailyEarnings: '+9.4 HBAR / +82.1 DOVU',
    },
    {
      token1: hbar, token2: weth, pair: 'HBAR-WETH', riskLevel: 'Balanced', apy: '11.4%', tvl: '$5.1M',
      ...emeraldRisk,
      token1Amount: '5,000.00', token1Usd: '$425.00',
      token2Amount: '0.132', token2Usd: '$425.00',
      dailyEarnings: '+1.7 HBAR / +0.000041 WETH',
    },
    {
      token1: hbar, token2: usdc, pair: 'HBAR-USDC', riskLevel: 'Balanced', apy: '10.2%', tvl: '$6.8M',
      ...emeraldRisk,
      token1Amount: '5,000.00', token1Usd: '$425.00',
      token2Amount: '425.00', token2Usd: '$425.00',
      dailyEarnings: '+1.5 HBAR / +0.12 USDC',
    },
    {
      token1: sauce, token2: usdc, pair: 'SAUCE-USDC', riskLevel: 'Balanced', apy: '18.5%', tvl: '$2.9M',
      ...emeraldRisk,
      token1Amount: '12,450.00', token1Usd: '$425.00',
      token2Amount: '425.00', token2Usd: '$425.00',
      dailyEarnings: '+21.5 SAUCE / +0.21 USDC',
    },
  ];

  // Overlapping token logos used by both card and row.
  const PairLogos = ({ token1, token2, size }: any) => {
    const border = theme === 'dark' ? 'border-[#0F141A]' : 'border-white';
    const circle = (t: any, z: string) =>
      t.logo ? (
        <img src={t.logo} alt={t.sym} className={`rounded-full border-2 ${z} ${border}`} style={{ width: size, height: size }} />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center text-white font-bold border-2 ${z} ${border} ${t.bg}`}
          style={{ width: size, height: size, fontSize: size * 0.34 }}
        >
          {t.fallback}
        </div>
      );
    return (
      <div className="flex -space-x-2">
        {circle(token1, 'z-10')}
        {circle(token2, '')}
      </div>
    );
  };

  // StrategyCard Component for Grid View
  const StrategyCard = ({ strategy }: any) => {
    return (
      <div className={`flex flex-col h-full p-5 rounded-[16px] border transition-all duration-200 w-full ${
        theme === 'dark'
          ? 'bg-[#0F141A] border-white/5 shadow-sm'
          : 'bg-white border-[#EAECEF] shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <PairLogos token1={strategy.token1} token2={strategy.token2} size={36} />
          <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${strategy.riskBgClass} ${strategy.riskTextClass}`}>
            {strategy.riskLevel}
          </div>
        </div>

        {/* Pair */}
        <div className="mb-8">
          <h3 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">{strategy.pair}</h3>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50 mb-0.5">APY</span>
            <span className="text-[17px] font-bold text-[#00A8E8]">{strategy.apy}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50 mb-0.5">TVL</span>
            <span className="text-[17px] font-bold text-slate-900 dark:text-white">{strategy.tvl}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button
            onClick={() => setSelectedStrategy(strategy)}
            className={`w-full py-2.5 rounded-[8px] border text-[13px] font-bold transition-colors ${
            theme === 'dark'
              ? 'border-white/10 text-slate-300 hover:bg-white/5'
              : 'border-[#EAECEF] text-[#00A8E8] hover:bg-slate-50 hover:border-[#00A8E8]/50'
          }`}>
            View Strategy
          </button>
        </div>
      </div>
    );
  };

  // StrategyRow Component for List View
  const StrategyRow = ({ strategy }: any) => {
    return (
      <div className={`grid grid-cols-4 md:grid-cols-[1fr_140px_100px_120px_140px] gap-4 items-center px-6 py-4 border-b transition-colors last:border-0 ${
        theme === 'dark'
          ? 'border-white/5 hover:bg-white/5'
          : 'border-[#EAECEF] hover:bg-slate-50'
      }`}>
        {/* Column 1: Strategy */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <PairLogos token1={strategy.token1} token2={strategy.token2} size={32} />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900 dark:text-white whitespace-nowrap">{strategy.pair}</h3>
        </div>

        {/* Column 2: Risk Profile */}
        <div className="hidden md:flex justify-center">
          <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${strategy.riskBgClass} ${strategy.riskTextClass}`}>
            {strategy.riskLevel}
          </div>
        </div>

        {/* Column 3: TVL */}
        <div className="hidden md:flex justify-center">
          <span className="text-[14px] font-bold text-slate-900 dark:text-white">{strategy.tvl}</span>
        </div>

        {/* Column 4: Current APY */}
        <div className="flex justify-center md:justify-center">
          <span className="text-[14px] font-bold text-[#00A8E8]">{strategy.apy}</span>
        </div>

        {/* Column 5: Action */}
        <div className="flex justify-end">
          <button
            onClick={() => setSelectedStrategy(strategy)}
            className={`w-[120px] py-2 rounded-[8px] border text-[13px] font-bold transition-colors ${
            theme === 'dark'
              ? 'border-white/10 text-slate-300 hover:bg-white/10'
              : 'border-[#EAECEF] text-slate-700 hover:bg-slate-100'
          }`}>
            View Strategy
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {selectedStrategy ? (
        <EarnStrategyDetail theme={theme} strategy={selectedStrategy} onBack={() => setSelectedStrategy(null)} />
      ) : (
        <>
          {/* Internal Tabs and View Mode Toggles */}
          <div className="flex w-full justify-between items-center mb-8 relative">
        <div className={`flex rounded-full border p-1 ${theme === 'dark' ? 'border-white/10 bg-[#0F141A]' : 'border-[#EAECEF] bg-slate-50'}`}>
          {['Yield Hub', 'Community'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#00A8E8] text-white shadow-sm'
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === 'Yield Hub' && (
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <button className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-[8px] text-[13px] font-bold border transition-colors ${
              theme === 'dark' 
                ? 'border-white/10 bg-[#0F141A] hover:bg-white/5 text-slate-300' 
                : 'border-[#EAECEF] bg-white hover:bg-slate-50 text-slate-700'
            }`}>
              Sort by: APY (High → Low) <CaretDown size={14} weight="bold" />
            </button>

            {/* View Mode Toggle */}
            <div className={`flex items-center rounded-[8px] border p-1 ${
              theme === 'dark' ? 'border-white/10 bg-[#0F141A]' : 'border-[#EAECEF] bg-white'
            }`}>
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[#00A8E8] text-white' 
                    : (theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800')
                }`}
              >
                <GridFour size={16} weight={viewMode === 'grid' ? "fill" : "bold"} />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[#00A8E8] text-white' 
                    : (theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800')
                }`}
              >
                <List size={16} weight={viewMode === 'list' ? "fill" : "bold"} />
              </button>
            </div>
          </div>
        )}
      </div>

      {activeTab === 'Yield Hub' ? (
        <>
          {/* Top Featured Banner */}
          <div className={`w-full flex flex-col md:flex-row rounded-[16px] border mb-6 overflow-hidden ${
            theme === 'dark'
              ? 'bg-[#0F141A] border-white/5'
              : 'bg-white border-[#EAECEF]'
          }`}>
            {/* Left Side */}
            <div className={`flex-1 p-8 relative flex flex-col justify-center ${
              theme === 'dark'
                ? 'bg-gradient-to-r from-[#00A8E8]/10 to-transparent'
                : 'bg-gradient-to-r from-[#00A8E8]/[0.05] to-transparent'
            }`}>
              {/* Sweeping lines background simulation */}
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 0% 0%, #00A8E8 0%, transparent 40%), radial-gradient(circle at 100% 100%, #00A8E8 0%, transparent 40%)'
              }}></div>
              
              <div className="relative z-10 flex flex-col items-start">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-6 ${
                  theme === 'dark' ? 'bg-white/10 text-[#00A8E8]' : 'bg-white shadow-sm border border-slate-100 text-[#00A8E8]'
                }`}>
                  <Star size={12} weight="fill" />
                  <span className="text-[11px] font-bold">Featured</span>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div className="flex -space-x-4">
                    {hbarLogoUrlSmall ? (
                      <img src={hbarLogoUrlSmall} alt="HBAR" className={`w-[60px] h-[60px] rounded-full border-4 z-10 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`} />
                    ) : (
                      <div className={`w-[60px] h-[60px] rounded-full bg-black flex items-center justify-center text-white font-bold text-xl z-10 border-4 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`}>H</div>
                    )}
                    {sauceLogoUrlSmall ? (
                      <img src={sauceLogoUrlSmall} alt="SAUCE" className={`w-[60px] h-[60px] rounded-full border-4 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`} />
                    ) : (
                      <div className={`w-[60px] h-[60px] rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xl border-4 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`}>S</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60 mb-1">Top Performing Ecosystem Pool</span>
                    <h2 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">HBAR-SAUCE</h2>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md mt-2 ${
                  theme === 'dark' ? 'bg-[#00A8E8]/20 text-[#00A8E8]' : 'bg-[#00A8E8]/10 text-[#00A8E8]'
                }`}>
                  <Drop size={14} weight="fill" />
                  <span className="text-[12px] font-bold">High Liquidity</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className={`w-px hidden md:block ${theme === 'dark' ? 'bg-white/5' : 'bg-[#EAECEF]'}`}></div>

            {/* Right Side */}
            <div className={`w-full md:w-[380px] p-8 flex flex-col justify-center relative ${
              theme === 'dark'
                ? 'bg-gradient-to-l from-[#00A8E8]/5 to-transparent'
                : 'bg-gradient-to-l from-[#00A8E8]/[0.02] to-transparent'
            }`}>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[52px] font-bold text-[#00A8E8] leading-none tracking-tight">45.2</span>
                <span className="text-[24px] font-bold text-[#00A8E8]">%</span>
                <span className="text-[18px] font-bold text-[#00A8E8] ml-1">APY</span>
              </div>
              <div className="text-[15px] font-bold text-slate-900 dark:text-white mb-8">
                TVL: $3.4M
              </div>
              <button
                onClick={() => setSelectedStrategy(featuredStrategy)}
                className="w-full bg-[#00A8E8] hover:bg-[#0090C7] text-white py-3.5 rounded-[8px] text-[14px] font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                Supply HBAR-SAUCE <ArrowRight size={14} weight="bold" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* TVL */}
            <div className={`flex flex-col p-5 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-[#EAECEF] shadow-sm'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#00A8E8]/10 text-[#00A8E8]">
                    <ChartLineUp size={18} weight="bold" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-slate-600 dark:text-white/60">Total Value Locked (TVL)</span>
                    <Info size={14} className="text-slate-400" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 mb-0.5">
                    ↑ 12.6%
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">vs last 7 days</span>
                </div>
              </div>
              <div className="mt-1 text-[24px] font-bold text-slate-900 dark:text-white tracking-tight ml-[48px]">
                $32.10M
              </div>
            </div>

            {/* Active Strategies */}
            <div className={`flex flex-col p-5 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-[#EAECEF] shadow-sm'}`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[#00A8E8]/10 text-[#00A8E8]">
                    <Stack size={18} weight="bold" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-slate-600 dark:text-white/60">Active Strategies</span>
                    <Info size={14} className="text-slate-400" />
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1 mb-0.5">
                    ↑ 2
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">vs last 7 days</span>
                </div>
              </div>
              <div className="mt-1 text-[24px] font-bold text-slate-900 dark:text-white tracking-tight ml-[48px]">
                12
              </div>
            </div>
          </div>

          {/* Strategy View Mode */}
          {viewMode === 'list' ? (
            <div className={`flex flex-col rounded-[16px] border overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-[#0F141A] border-white/5 shadow-sm' : 'bg-white border-[#EAECEF] shadow-sm'
            }`}>
              {/* Table Header */}
              <div className={`hidden md:grid grid-cols-[1fr_140px_100px_120px_140px] gap-4 items-center px-6 py-4 border-b text-[12px] font-semibold ${
                theme === 'dark' ? 'border-white/5 text-white/50' : 'border-slate-100 text-slate-500'
              }`}>
                <div>Strategy</div>
                <div className="text-center">Risk Profile</div>
                <div className="text-center">TVL</div>
                <div className="flex items-center justify-center gap-1">
                  Current APY <Info size={14} className="opacity-70" />
                </div>
                <div className="text-right">Action</div>
              </div>

              {/* Table Body */}
              <div className="flex flex-col">
                {strategies.map((strat, idx) => (
                  <StrategyRow key={idx} strategy={strat} />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {strategies.map((strat, idx) => (
                <StrategyCard key={idx} strategy={strat} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col items-center justify-center mt-2 mb-4">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60 mb-4">
              Showing 1 to 6 of 12 strategies
            </span>
            <div className="flex items-center gap-2">
              <button className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
                theme === 'dark' ? 'border-white/10 bg-[#0F141A] text-white/50 hover:bg-white/5' : 'border-[#EAECEF] bg-white text-slate-400 hover:bg-slate-50'
              }`}>
                <CaretLeft size={14} weight="bold" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#00A8E8] text-white font-bold text-[13px]">
                1
              </button>
              <button className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
                theme === 'dark' ? 'border-white/10 bg-[#0F141A] text-slate-400 hover:bg-white/5' : 'border-[#EAECEF] bg-white text-slate-700 hover:bg-slate-50'
              } font-bold text-[13px]`}>
                2
              </button>
              <button className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors ${
                theme === 'dark' ? 'border-white/10 bg-[#0F141A] text-slate-400 hover:bg-white/5' : 'border-[#EAECEF] bg-white text-slate-700 hover:bg-slate-50'
              }`}>
                <CaretRight size={14} weight="bold" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <CommunityTab theme={theme} />
      )}
      
      </>
      )}
    </div>
  );
};
