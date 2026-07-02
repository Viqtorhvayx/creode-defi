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
  ArrowRight 
} from '@phosphor-icons/react';

interface EarnTabProps {
  theme: 'light' | 'dark';
}

export const EarnTab: React.FC<EarnTabProps> = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('Yield Hub');
  
  const StrategyCard = ({
    token1Color,
    token1Label,
    token2Color,
    token2Label,
    pair,
    riskLevel,
    strategyName,
    apy,
    tvlHbar,
    tvlUsd,
    priceRangeStart,
    priceRangeEnd,
    rangeMin,
    rangeMax,
    riskColorClass,
    riskBgClass,
    riskTextClass,
    riskBorderClass,
  }: any) => {
    
    // Calculate slider width and position
    const totalRange = rangeMax - rangeMin;
    const highlightStart = ((priceRangeStart - rangeMin) / totalRange) * 100;
    const highlightWidth = ((priceRangeEnd - priceRangeStart) / totalRange) * 100;

    return (
      <div className={`flex flex-col h-full p-5 rounded-[16px] border transition-all duration-200 hover:border-[#00A8E8]/60 ${
        theme === 'dark' 
          ? 'bg-[#0F141A] border-white/5' 
          : 'bg-white border-slate-200'
      }`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex -space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs z-10 border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token1Color}`}>
              {token1Label}
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 ${theme === 'dark' ? 'border-[#0F141A]' : 'border-white'} ${token2Color}`}>
              {token2Label}
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${riskBgClass} ${riskTextClass}`}>
            {riskLevel} Risk
          </div>
        </div>

        {/* Pair & Strategy */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 dark:text-white">{pair}</h3>
            <div className="w-3.5 h-3.5 rounded-full bg-[#00A8E8] text-white flex items-center justify-center text-[9px]">✓</div>
          </div>
          <p className="text-[12px] font-medium text-slate-500 dark:text-white/50">{strategyName}</p>
        </div>

        {/* Stats */}
        <div className="flex justify-between mb-5">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">Live APY</span>
              <Info size={12} className="text-slate-400" />
            </div>
            <div className="text-[22px] font-bold tracking-tight text-[#00A8E8]">{apy}%</div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50">TVL</span>
              <Info size={12} className="text-slate-400" />
            </div>
            <div className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">{tvlHbar} HBAR</div>
            <div className="text-[11px] font-medium text-slate-500 dark:text-white/50">{tvlUsd} USD</div>
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-1">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Active Price Range</span>
              <Info size={14} className="text-slate-400" />
            </div>
            <span className="text-[12px] font-bold text-slate-900 dark:text-white">{priceRangeStart.toFixed(2)} - {priceRangeEnd.toFixed(2)} USD</span>
          </div>
          
          <div className="relative h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full mb-2">
            <div 
              className={`absolute h-full rounded-full ${riskColorClass}`} 
              style={{ left: `${highlightStart}%`, width: `${highlightWidth}%` }}
            >
              <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-[#0F141A] ${riskColorClass}`}></div>
              <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white dark:border-[#0F141A] ${riskColorClass}`}></div>
            </div>
          </div>
          
          <div className="flex justify-between text-[10px] font-medium text-slate-400">
            <span>{rangeMin.toFixed(2)}</span>
            <span>{(rangeMin + totalRange * 0.25).toFixed(2)}</span>
            <span>{(rangeMin + totalRange * 0.5).toFixed(2)}</span>
            <span>{(rangeMin + totalRange * 0.75).toFixed(2)}</span>
            <span>{rangeMax.toFixed(2)}</span>
          </div>
        </div>

        {/* Auto Rebalancing */}
        <div className={`flex items-center justify-center gap-2 py-2 rounded-lg mb-5 border ${riskBgClass} ${riskBorderClass}`}>
          <ArrowsClockwise size={14} className={riskTextClass} />
          <span className={`text-[12px] font-bold tracking-tight ${riskTextClass}`}>Auto-Rebalancing: ON</span>
        </div>

        {/* Action Button */}
        <div className="mt-auto">
          <button className={`w-full py-3 rounded-lg border text-[14px] font-bold transition-colors ${
            theme === 'dark' 
              ? 'border-[#00A8E8]/50 text-[#00A8E8] hover:bg-[#00A8E8]/10' 
              : 'border-[#00A8E8] text-[#00A8E8] hover:bg-[#00A8E8]/5'
          }`}>
            View Strategy
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header Info */}
      <div className="mb-6 flex flex-col">
        <h1 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight mb-1 leading-none">
          {activeTab === 'Community' ? 'Community' : 'Yield Hub'}
        </h1>
        <p className="text-[11px] font-semibold text-slate-500 dark:text-white/60 leading-none mt-1">
          {activeTab === 'Community'
            ? "Shape the future of Creode; Vote, propose and infleunce what's next"
            : "Discover and deploy optimized yield strategies with concentrated liquidity."}
        </p>
      </div>

      {/* Internal Tabs */}
      <div className="flex w-full mb-8 border-b border-slate-200 dark:border-white/10 relative">
        <div className={`flex rounded-t-[10px] border-t border-l border-r ${theme === 'dark' ? 'border-white/10 bg-transparent' : 'border-slate-200 bg-white/50'} relative bottom-[-1px]`}>
          {['Yield Hub', 'Community'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-[14px] font-bold relative transition-all duration-200 ${
                  isActive 
                    ? (theme === 'dark' ? 'bg-[#0B0F14] text-[#00A8E8]' : 'bg-white text-[#00A8E8]')
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80'
                }`}
              >
                {tab}
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'Yield Hub' ? (
        <>
          {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* TVL */}
        <div className={`flex items-start gap-4 p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 bg-[#00A8E8]/10 text-[#00A8E8]">
            <ChartLineUp size={28} weight="bold" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[13px] font-semibold text-slate-500 dark:text-white/60">Total Value Locked</span>
              <Info size={14} className="text-slate-400" />
            </div>
            <div className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">12,450.75 HBAR</div>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$1,105.45 USD</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+8.45%</span>
            </div>
          </div>
        </div>

        {/* Avg APY */}
        <div className={`flex items-start gap-4 p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 bg-[#00A8E8]/10 text-[#00A8E8]">
            <Coins size={28} weight="bold" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[13px] font-semibold text-slate-500 dark:text-white/60">Avg. APY Across Strategies</span>
              <Info size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">24.78%</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+2.18%</span>
            </div>
          </div>
        </div>

        {/* Active Strategies */}
        <div className={`flex items-start gap-4 p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 bg-[#00A8E8]/10 text-[#00A8E8]">
            <Users size={28} weight="bold" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[13px] font-semibold text-slate-500 dark:text-white/60">Active Strategies</span>
              <Info size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold text-slate-900 dark:text-white tracking-tight">8</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">+1 New</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex justify-end items-center gap-4 mb-6">
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 bg-[#0F141A] hover:bg-white/5 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'}`}>
          All Strategies <CaretDown size={14} />
        </button>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 bg-[#0F141A] hover:bg-white/5 text-white' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-900'}`}>
          Sort by: APY (High → Low) <CaretDown size={14} />
        </button>
        <div className={`flex items-center rounded-lg border p-1 ${theme === 'dark' ? 'border-white/10 bg-[#0F141A]' : 'border-slate-200 bg-white'}`}>
          <button className="p-1.5 rounded-md bg-[#00A8E8] text-white">
            <GridFour size={16} weight="fill" />
          </button>
          <button className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StrategyCard 
          token1Color="bg-black" token1Label="H"
          token2Color="bg-blue-500" token2Label="$"
          pair="HBAR/USDC"
          riskLevel="Low"
          strategyName="Conservative Strategy"
          apy={12.45}
          tvlHbar="2,450.75"
          tvlUsd="$218.45"
          priceRangeStart={0.07}
          priceRangeEnd={0.10}
          rangeMin={0.04}
          rangeMax={0.16}
          riskColorClass="bg-emerald-500"
          riskBgClass={theme === 'dark' ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}
          riskTextClass="text-emerald-500 dark:text-emerald-400"
          riskBorderClass="border-emerald-500/20"
        />
        <StrategyCard 
          token1Color="bg-black" token1Label="H"
          token2Color="bg-teal-500" token2Label="T"
          pair="HBAR/USDT"
          riskLevel="Medium"
          strategyName="Balanced Strategy"
          apy={24.78}
          tvlHbar="5,670.34"
          tvlUsd="$501.22"
          priceRangeStart={0.08}
          priceRangeEnd={0.12}
          rangeMin={0.04}
          rangeMax={0.20}
          riskColorClass="bg-amber-500"
          riskBgClass={theme === 'dark' ? 'bg-amber-500/10' : 'bg-amber-500/5'}
          riskTextClass="text-amber-500 dark:text-amber-400"
          riskBorderClass="border-amber-500/20"
        />
        <StrategyCard 
          token1Color="bg-black" token1Label="H"
          token2Color="bg-orange-500" token2Label="S"
          pair="HBAR/SAUCE"
          riskLevel="High"
          strategyName="Aggressive Strategy"
          apy={38.62}
          tvlHbar="4,329.66"
          tvlUsd="$382.76"
          priceRangeStart={0.10}
          priceRangeEnd={0.18}
          rangeMin={0.04}
          rangeMax={0.30}
          riskColorClass="bg-rose-500"
          riskBgClass={theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-500/5'}
          riskTextClass="text-rose-500 dark:text-rose-400"
          riskBorderClass="border-rose-500/20"
        />
      </div>

      {/* Info Banner */}
      <div className={`w-full flex items-center justify-between p-6 rounded-[16px] relative overflow-hidden border ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-[#00A8E8]/10 to-transparent border-[#00A8E8]/20' 
          : 'bg-gradient-to-r from-blue-50/80 to-white border-blue-100'
      }`}>
        <div className="flex items-start gap-4 z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20">
            <ShieldCheck size={24} weight="fill" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Automated. Optimized. Always Working.</h3>
            <p className="text-sm text-slate-600 dark:text-white/70 max-w-xl mb-3">
              Our smart strategies use concentrated liquidity and automated rebalancing to maximize your yield across market conditions.
            </p>
            <button className="text-sm font-bold text-[#00A8E8] flex items-center gap-1 hover:gap-2 transition-all">
              Learn how it works <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>

        {/* Abstract Illustration */}
        <div className="absolute right-8 bottom-0 flex items-end gap-2 z-0">
          <div className="w-8 h-12 bg-[#00A8E8]/30 dark:bg-[#00A8E8]/20 rounded-t-md relative shadow-sm"></div>
          <div className="w-8 h-20 bg-[#00A8E8]/60 dark:bg-[#00A8E8]/40 rounded-t-md relative shadow-sm"></div>
          <div className="w-8 h-16 bg-[#00A8E8] rounded-t-md relative shadow-md">
            <div className="absolute -left-3 top-1 w-10 h-10 bg-[#0F141A] dark:bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-[#00A8E8] font-black text-xl">C</span>
            </div>
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
