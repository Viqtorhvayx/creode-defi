"use client";

import React, { useState } from 'react';
import { CommunityTab } from './CommunityTab';
import { 
  ChartLineUp, 
  Coins, 
  Users, 
  CaretDown, 
  List, 
  GridFour, 
  Info, 
  ArrowsClockwise, 
  ShieldCheck, 
  ArrowRight,
  StarFour,
  Crosshair
} from '@phosphor-icons/react';

interface EarnTabProps {
  theme: 'light' | 'dark';
}

export const EarnTab: React.FC<EarnTabProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('Discover Strategies');
  
  const StrategyCard = ({
    token1Color,
    token1Label,
    token2Color,
    token2Label,
    pair,
    riskLevel,
    strategyName,
    description,
    apy,
    tvlUsd,
    feeTier,
    rangeMode,
    rebalance,
    riskBgClass,
    riskTextClass,
  }: any) => {
    return (
      <div className={`flex flex-col h-full p-5 rounded-[16px] border transition-all duration-200 hover:shadow-md ${
        theme === 'dark' 
          ? 'bg-[#0F141A] border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.2)]' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Token Icons & Risk Badge */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex -space-x-1.5">
            <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-white font-bold text-[10px] z-10 border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token1Color}`}>
              {token1Label}
            </div>
            <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-white font-bold text-[10px] border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token2Color}`}>
              {token2Label}
            </div>
          </div>
          <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${riskBgClass} ${riskTextClass}`}>
            {riskLevel}
          </div>
        </div>

        {/* Pair & Strategy Type */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">{pair}</h3>
            <div className="px-2 py-0.5 rounded-md bg-[#00A8E8]/10 text-[#00A8E8] text-[10px] font-bold">
              Concentrated Liquidity
            </div>
          </div>
          <p className="text-[12px] font-medium text-slate-500 dark:text-white/60 leading-snug line-clamp-2 h-[34px]">
            {description}
          </p>
        </div>

        {/* Stats: APY & TVL */}
        <div className="flex justify-between mb-5 mt-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">APY</span>
              <Info size={12} className="text-slate-400" />
            </div>
            <div className="text-[22px] font-bold tracking-tight text-[#00A8E8] leading-none">{apy}</div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">TVL</span>
              <Info size={12} className="text-slate-400" />
            </div>
            <div className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight leading-none mt-auto">{tvlUsd}</div>
          </div>
        </div>

        {/* Metadata Row */}
        <div className="grid grid-cols-4 gap-2 mb-6 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Protocol</span>
            <div className="flex -space-x-1">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[6px] z-10 border ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token1Color}`}>
                {token1Label}
              </div>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[6px] border ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token2Color}`}>
                {token2Label}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Fee Tier</span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">{feeTier}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Range Mode</span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">{rangeMode}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-white/50">Rebalance</span>
            <span className="text-[11px] font-bold text-slate-900 dark:text-white">{rebalance}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button className="w-full py-2.5 rounded-lg bg-[#00A8E8] hover:bg-[#0090C7] text-white text-[13px] font-bold transition-all shadow-sm active:scale-[0.98]">
            View Details
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Info */}
      <div className="mb-6 flex flex-col">
        <h1 className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight mb-2 leading-none">
          Earn
        </h1>
        <p className="text-[13px] font-medium text-slate-500 dark:text-white/60 leading-none">
          Discover and deploy into advanced yield strategies powered by concentrated liquidity.
        </p>
      </div>

      {/* Internal Tabs */}
      <div className="flex w-full mb-8 gap-3">
        {['Discover Strategies', 'My Positions', 'Community'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-[12px] text-[13px] font-bold transition-all duration-200 border ${
                isActive 
                  ? 'bg-[#00A8E8] border-[#00A8E8] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#00A8E8]/50 hover:text-[#00A8E8] dark:bg-[#0F141A] dark:border-white/10 dark:text-white/80'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {activeTab === 'Discover Strategies' ? (
        <>
          {/* Top Overview Row (Single Card) */}
          <div className={`flex w-full rounded-[16px] border shadow-sm mb-6 ${
            theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200'
          }`}>
            {/* TVL */}
            <div className="flex-1 p-6 flex flex-col justify-center border-r border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">Total Value Locked (TVL)</span>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2 leading-none">$28.46M</div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold text-emerald-500">+8.32%</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">7D</span>
              </div>
            </div>

            {/* Avg APY */}
            <div className="flex-1 p-6 flex flex-col justify-center border-r border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">Weighted Avg. APY</span>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2 leading-none">36.78%</div>
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold text-emerald-500">+2.61%</span>
                <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">7D</span>
              </div>
            </div>

            {/* Active Strategies */}
            <div className="flex-1 p-6 flex flex-col justify-center border-r border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">Active Strategies</span>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="text-[28px] font-bold text-slate-900 dark:text-white tracking-tight mb-2 leading-none">12</div>
              <div className="text-[12px] font-medium text-slate-500 dark:text-white/50">Across 6 Protocols</div>
            </div>

            {/* Auto-Compounding */}
            <div className="flex-1 p-6 flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-semibold text-slate-500 dark:text-white/60">Auto-Compounding</span>
                  <div className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-500 text-[10px] font-bold">ON</div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 dark:text-white/50 leading-snug max-w-[150px]">
                  Earnings are automatically compounded to boost yield.
                </p>
              </div>
              <button className="w-10 h-10 rounded-full bg-[#F0F8FF] text-[#00A8E8] flex items-center justify-center hover:bg-[#E0F0FF] transition-colors">
                <ArrowsClockwise size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* Smart Liquidity Engine Info Strip */}
          <div className="flex items-center justify-between w-full p-4 rounded-[12px] bg-[#F4F9FF] dark:bg-[#00A8E8]/5 border border-[#E6F0FA] dark:border-[#00A8E8]/10 mb-8">
            <div className="flex items-center gap-3">
              <StarFour size={18} className="text-[#00A8E8]" weight="fill" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Smart Liquidity Engine</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">All strategies use Concentrated Liquidity to maximize capital efficiency.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Crosshair size={18} className="text-[#00A8E8]" weight="bold" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Dynamic Range Management</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">Auto-adjusts to market conditions</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ArrowsClockwise size={18} className="text-[#00A8E8]" weight="bold" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Rebalancing Active</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">Maximizing fees & yield</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-[#00A8E8]" weight="bold" />
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white">Capital Efficient</span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-white/60">Higher yield with lower risk</span>
              </div>
            </div>
          </div>

          {/* Filter & Sort Row */}
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex items-center gap-3">
              <button className="flex items-center justify-between gap-6 px-4 py-2.5 rounded-[12px] bg-white dark:bg-[#0F141A] border border-slate-200 dark:border-white/10 text-[13px] font-semibold text-slate-700 dark:text-white hover:border-[#00A8E8]/50 transition-colors">
                All Strategies <CaretDown size={14} className="text-slate-400" />
              </button>
              <button className="flex items-center justify-between gap-6 px-4 py-2.5 rounded-[12px] bg-white dark:bg-[#0F141A] border border-slate-200 dark:border-white/10 text-[13px] font-semibold text-slate-700 dark:text-white hover:border-[#00A8E8]/50 transition-colors">
                All Assets <CaretDown size={14} className="text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium text-slate-500 dark:text-white/60">Sort by</span>
                <button className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-[12px] bg-white dark:bg-[#0F141A] border border-slate-200 dark:border-white/10 text-[13px] font-semibold text-slate-900 dark:text-white hover:border-[#00A8E8]/50 transition-colors">
                  Highest APY <CaretDown size={14} className="text-slate-400" />
                </button>
              </div>
              <div className={`flex items-center rounded-lg border p-1 ${theme === 'dark' ? 'border-white/10 bg-[#0F141A]' : 'border-slate-200 bg-white'}`}>
                <button className="p-1.5 rounded-md bg-[#00A8E8] text-white transition-colors">
                  <GridFour size={16} weight="fill" />
                </button>
                <button className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

      {/* Strategy Grid */}
      <div className="h-[430px] overflow-y-auto pr-2 mb-8" style={{ scrollbarWidth: 'thin' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StrategyCard 
            token1Color="bg-black" token1Label="H"
            token2Color="bg-blue-500" token2Label="$"
            pair="HBAR/USDC"
            riskLevel="Conservative"
            strategyName="Conservative Strategy"
            description="Stable pair strategy focused on consistent yield."
            apy="28.65%"
            tvlUsd="$8.45M"
            feeTier="0.05%"
            rangeMode="Wide"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-[#00A8E8]/10' : 'bg-blue-50'}
            riskTextClass="text-[#00A8E8]"
          />
          <StrategyCard 
            token1Color="bg-black" token1Label="H"
            token2Color="bg-purple-500" token2Label="W"
            pair="HBAR/wETH"
            riskLevel="Conservative"
            strategyName="Conservative Strategy"
            description="Blue-chip pair strategy focused on consistent yield."
            apy="31.20%"
            tvlUsd="$5.12M"
            feeTier="0.3%"
            rangeMode="Wide"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-[#00A8E8]/10' : 'bg-blue-50'}
            riskTextClass="text-[#00A8E8]"
          />
          <StrategyCard 
            token1Color="bg-black" token1Label="H"
            token2Color="bg-orange-500" token2Label="S"
            pair="HBAR/SAUCE"
            riskLevel="Balanced"
            strategyName="Balanced Strategy"
            description="Optimized liquidity range with auto-rebalancing across SaucerSwap and Hedera Native Staking."
            apy="45.20%"
            tvlUsd="$6.42M"
            feeTier="0.3%"
            rangeMode="Dynamic"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
            riskTextClass="text-emerald-500"
          />
          <StrategyCard 
            token1Color="bg-orange-500" token1Label="S"
            token2Color="bg-black" token2Label="H"
            pair="SAUCE/HBAR"
            riskLevel="Balanced"
            strategyName="Balanced Strategy"
            description="Optimized liquidity range with auto-rebalancing across SaucerSwap."
            apy="48.15%"
            tvlUsd="$4.80M"
            feeTier="0.3%"
            rangeMode="Dynamic"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-50'}
            riskTextClass="text-emerald-500"
          />
          <StrategyCard 
            token1Color="bg-black" token1Label="H"
            token2Color="bg-green-500" token2Label="D"
            pair="HBAR/DOVU"
            riskLevel="Aggressive"
            strategyName="Aggressive Strategy"
            description="Higher risk, higher reward. Tight range strategy for maximum fee capture."
            apy="68.90%"
            tvlUsd="$2.15M"
            feeTier="0.3%"
            rangeMode="Narrow"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50'}
            riskTextClass="text-rose-500"
          />
          <StrategyCard 
            token1Color="bg-black" token1Label="H"
            token2Color="bg-yellow-500" token2Label="P"
            pair="HBAR/PACK"
            riskLevel="Aggressive"
            strategyName="Aggressive Strategy"
            description="Volatile pair strategy targeting maximum yield through high fee generation."
            apy="82.40%"
            tvlUsd="$1.05M"
            feeTier="1.0%"
            rangeMode="Narrow"
            rebalance="Auto"
            riskBgClass={theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50'}
            riskTextClass="text-rose-500"
          />
        </div>
      </div>

      {/* Community Pulse Banner */}
      <div className={`w-full flex items-center justify-between p-6 rounded-[16px] border ${
        theme === 'dark' 
          ? 'bg-[#0F141A] border-white/10' 
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-12 w-full">
          {/* Left: Title & Icon */}
          <div className="flex items-start gap-4 shrink-0">
            <div className="w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 bg-[#00A8E8]/10 text-[#00A8E8]">
              <Users size={24} weight="fill" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1 text-slate-900 dark:text-white leading-none">Community Pulse</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-white/60">
                Which pair should we optimize next?
              </p>
            </div>
          </div>

          {/* Center: Poll Results */}
          <div className="flex-1 flex items-center gap-6">
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-slate-700 dark:text-white">HBAR / BONZO</span>
                <span className="text-slate-500">32%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-slate-300 dark:bg-slate-500 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-[#00A8E8]">SAUCE / USDC</span>
                <span className="text-[#00A8E8]">41%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '41%' }}></div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="flex justify-between text-[12px] font-bold">
                <span className="text-slate-700 dark:text-white">HBAR / PACK</span>
                <span className="text-slate-500">27%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-slate-300 dark:bg-slate-500 rounded-full" style={{ width: '27%' }}></div>
              </div>
            </div>
          </div>

          {/* Right: CTA */}
          <div className="shrink-0 pl-6 border-l border-slate-100 dark:border-white/10">
            <button className={`px-5 py-2.5 rounded-lg border text-[13px] font-bold transition-colors ${
              theme === 'dark' 
                ? 'border-white/20 text-white hover:bg-white/5' 
                : 'border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}>
              View Polls
            </button>
          </div>
        </div>
      </div>
        </>
      ) : (
        <CommunityTab theme={theme} />
      )}
    </div>
  );
};
