"use client";

import React, { useState, useEffect } from 'react';
import { CommunityTab } from './CommunityTab';
import { 
  ChartLineUp, 
  Stack, 
  Info,
  Star,
  Drop,
  CaretLeft,
  CaretRight,
  ArrowRight
} from '@phosphor-icons/react';

interface EarnTabProps {
  theme: 'light' | 'dark';
}

export const EarnTab: React.FC<EarnTabProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('Yield Hub');
  
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

  // StrategyCard Component
  const StrategyCard = ({
    token1Logo,
    token1Fallback,
    token1Bg,
    token2Logo,
    token2Fallback,
    token2Bg,
    pair,
    riskLevel,
    apy,
    tvl,
    riskBgClass,
    riskTextClass,
  }: any) => {
    return (
      <div className={`flex flex-col h-full p-5 rounded-[16px] border transition-all duration-200 w-full ${
        theme === 'dark' 
          ? 'bg-[#0F141A] border-white/5 shadow-sm' 
          : 'bg-white border-[#EAECEF] shadow-sm'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex -space-x-2">
            {token1Logo ? (
              <img src={token1Logo} alt="Token 1" className={`w-9 h-9 rounded-full border-2 z-10 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`} />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token1Bg}`}>
                {token1Fallback}
              </div>
            )}
            {token2Logo ? (
              <img src={token2Logo} alt="Token 2" className={`w-9 h-9 rounded-full border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'}`} />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token2Bg}`}>
                {token2Fallback}
              </div>
            )}
          </div>
          <div className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${riskBgClass} ${riskTextClass}`}>
            {riskLevel}
          </div>
        </div>

        {/* Pair */}
        <div className="mb-8">
          <h3 className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">{pair}</h3>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50 mb-0.5">APY</span>
            <span className="text-[17px] font-bold text-[#00A8E8]">{apy}</span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50 mb-0.5">TVL</span>
            <span className="text-[17px] font-bold text-slate-900 dark:text-white">{tvl}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button className={`w-full py-2.5 rounded-[8px] border text-[13px] font-bold transition-colors ${
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

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Internal Tabs */}
      <div className="flex w-full mb-8 relative">
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
                    <h2 className="text-[26px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">HBAR / SAUCE</h2>
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
              <button className="w-full bg-[#00A8E8] hover:bg-[#0090C7] text-white py-3.5 rounded-[8px] text-[14px] font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                Supply HBAR/SAUCE <ArrowRight size={14} weight="bold" />
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

          {/* Strategy Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <StrategyCard 
              token1Logo={hbarLogoUrlSmall} token1Fallback="H" token1Bg="bg-black"
              token2Logo={wbtcLogoUrlSmall} token2Fallback="B" token2Bg="bg-[#F7931A]"
              pair="HBAR / wBTC"
              riskLevel="Balanced"
              apy="14.2%"
              tvl="$8.5M"
              riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
              riskTextClass="text-emerald-600 dark:text-emerald-500"
            />
            <StrategyCard 
              token1Logo={hbarLogoUrlSmall} token1Fallback="H" token1Bg="bg-black"
              token2Logo={null} token2Fallback="D" token2Bg="bg-purple-600"
              pair="HBAR / DOVU"
              riskLevel="Aggressive"
              apy="62.1%"
              tvl="$1.2M"
              riskBgClass={theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50'}
              riskTextClass="text-rose-600 dark:text-rose-500"
            />
            <StrategyCard 
              token1Logo={hbarLogoUrlSmall} token1Fallback="H" token1Bg="bg-black"
              token2Logo={wethLogoUrlSmall} token2Fallback="E" token2Bg="bg-blue-600"
              pair="HBAR / wETH"
              riskLevel="Balanced"
              apy="11.4%"
              tvl="$5.1M"
              riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
              riskTextClass="text-emerald-600 dark:text-emerald-500"
            />
            <StrategyCard 
              token1Logo={hbarLogoUrlSmall} token1Fallback="H" token1Bg="bg-black"
              token2Logo={usdcLogoUrlSmall} token2Fallback="U" token2Bg="bg-[#2775CA]"
              pair="HBAR / USDC"
              riskLevel="Balanced"
              apy="10.2%"
              tvl="$6.8M"
              riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
              riskTextClass="text-emerald-600 dark:text-emerald-500"
            />
            <StrategyCard 
              token1Logo={sauceLogoUrlSmall} token1Fallback="S" token1Bg="bg-red-500"
              token2Logo={usdcLogoUrlSmall} token2Fallback="U" token2Bg="bg-[#2775CA]"
              pair="SAUCE / USDC"
              riskLevel="Balanced"
              apy="18.5%"
              tvl="$2.9M"
              riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
              riskTextClass="text-emerald-600 dark:text-emerald-500"
            />
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-center mt-2 mb-4">
            <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60 mb-4">
              Showing 1 to 5 of 11 strategies
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
    </div>
  );
};
