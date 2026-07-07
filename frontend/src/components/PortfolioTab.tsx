import React, { useState } from 'react';
import { ArrowUpRight, Minus, ArrowRight } from '@phosphor-icons/react';

interface PortfolioTabProps {
  theme: 'light' | 'dark';
}

export const PortfolioTab: React.FC<PortfolioTabProps> = ({ theme }) => {
  const [activeTimeRange, setActiveTimeRange] = useState('30D');

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';

  const timeRanges = ['7D', '30D', '90D', '1Y', 'All'];

  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-6 ${textMain} px-4 pb-10`}>
      
      {/* Header */}
      <div className="mb-2 flex flex-col">
        <h1 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">
          Portfolio Overview
        </h1>
      </div>

      {/* Top Chart Card */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-6 relative`}>
        {/* Card Header */}
        <div className="flex flex-col mb-6">
          <span className={`text-[13px] font-medium ${textMuted} mb-1`}>Total Net Worth</span>
          <div className="flex items-center gap-4">
            <span className={`text-[36px] font-bold tracking-tight ${textMain}`}>$45,250.00</span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>
              +$1,240.50 (2.8%) Today
            </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative w-full h-[240px] mb-6">
          {/* Y-Axis Labels */}
          <div className={`absolute right-0 top-0 h-full flex flex-col justify-between items-end text-[11px] font-medium ${textMuted} pb-6 z-10 pointer-events-none`}>
            <span>$48K</span>
            <span>$44K</span>
            <span>$40K</span>
            <span>$36K</span>
            <span>$32K</span>
          </div>

          {/* Grid Lines (Horizontal) */}
          <div className="absolute inset-0 flex flex-col justify-between pb-6 z-0 pointer-events-none">
            <div className={`w-[calc(100%-30px)] border-t ${borderColor} border-dashed opacity-50`}></div>
            <div className={`w-[calc(100%-30px)] border-t ${borderColor} border-dashed opacity-50`}></div>
            <div className={`w-[calc(100%-30px)] border-t ${borderColor} border-dashed opacity-50`}></div>
            <div className={`w-[calc(100%-30px)] border-t ${borderColor} border-dashed opacity-50`}></div>
            <div className={`w-[calc(100%-30px)] border-t ${borderColor} border-dashed opacity-50`}></div>
          </div>

          {/* SVG Chart */}
          <div className="absolute inset-0 right-[35px] bottom-6 z-0">
            <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A8E8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#00A8E8" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path 
                d="M 0,160 C 100,150 150,155 250,140 C 350,125 400,140 500,125 C 600,110 650,115 750,85 C 850,55 900,50 1000,25 L 1000,200 L 0,200 Z" 
                fill="url(#chartGradient)" 
              />
              <path 
                d="M 0,160 C 100,150 150,155 250,140 C 350,125 400,140 500,125 C 600,110 650,115 750,85 C 850,55 900,50 1000,25" 
                fill="none" 
                stroke="#00A8E8" 
                strokeWidth="2" 
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="1000" cy="25" r="4.5" fill="#00A8E8" />
            </svg>
          </div>

          {/* X-Axis Labels */}
          <div className={`absolute bottom-0 left-0 w-[calc(100%-35px)] flex justify-between items-center text-[11px] font-medium ${textMuted} pt-2 border-t ${borderColor}`}>
            <span>May 24</span>
            <span>May 28</span>
            <span>Jun 1</span>
            <span>Jun 5</span>
            <span>Jun 9</span>
            <span>Jun 13</span>
            <span>Jun 17</span>
            <span>Jun 21</span>
          </div>
        </div>

        {/* Time Filters */}
        <div className="flex items-center gap-2">
          {timeRanges.map((range) => {
            const isActive = activeTimeRange === range;
            return (
              <button
                key={range}
                onClick={() => setActiveTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                  isActive 
                    ? `bg-[#00A8E8]/10 text-[#00A8E8] border ${theme === 'dark' ? 'border-[#00A8E8]/20' : 'border-[#00A8E8]/30'}` 
                    : `${textMuted} hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent`
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lower Grid: Two Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 w-full">
        
        {/* Left Card: Asset Allocation */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-6 flex flex-col`}>
          <h2 className="text-[16px] font-bold mb-6">Asset Allocation</h2>
          
          {/* Segmented Bar */}
          <div className="flex w-full h-3 rounded-full overflow-hidden mb-8 gap-1">
            <div className="h-full bg-[#00A8E8] rounded-l-full" style={{ width: '45%' }}></div>
            <div className="h-full bg-[#A855F7]" style={{ width: '35%' }}></div>
            <div className="h-full bg-[#1E3A8A] rounded-r-full" style={{ width: '20%' }}></div>
          </div>

          {/* Legend Table */}
          <div className="flex flex-col gap-4">
            {/* Row 1 */}
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00A8E8]"></div>
                <span className={`font-medium ${textMain}`}>Yield Hub (Earn)</span>
              </div>
              <div className="flex items-center gap-8 text-right">
                <span className={`font-bold ${textMuted} w-8`}>45%</span>
                <span className={`font-medium ${textMuted} w-20`}>$20,362.50</span>
              </div>
            </div>
            {/* Row 2 */}
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A855F7]"></div>
                <span className={`font-medium ${textMain}`}>Savings Vault</span>
              </div>
              <div className="flex items-center gap-8 text-right">
                <span className={`font-bold ${textMuted} w-8`}>35%</span>
                <span className={`font-medium ${textMuted} w-20`}>$15,818.75</span>
              </div>
            </div>
            {/* Row 3 */}
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></div>
                <span className={`font-medium ${textMain}`}>Wallet Balance</span>
              </div>
              <div className="flex items-center gap-8 text-right">
                <span className={`font-bold ${textMuted} w-8`}>20%</span>
                <span className={`font-medium ${textMuted} w-20`}>$9,068.75</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Top Performing Assets */}
        <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm p-6 flex flex-col`}>
          <h2 className="text-[16px] font-bold mb-6">Top Performing Assets</h2>
          
          <div className="flex flex-col gap-6 flex-grow">
            {/* Row 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 12H9M15 12V7H17V17H15V12ZM9 12V7H7V17H9V12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${textMain} leading-tight`}>HBAR</span>
                  <span className={`text-[12px] font-medium ${textMuted}`}>Hedera</span>
                </div>
              </div>
              <div className="text-[14px] font-bold text-right w-24">$15,200.00</div>
              <div className="text-[13px] font-bold text-[#16C784] text-right w-16 flex justify-end items-center gap-1">
                +5.4% <ArrowUpRight size={12} weight="bold" />
              </div>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2775CA] flex items-center justify-center text-white shrink-0">
                  <span className="font-bold text-[18px] leading-none">$</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold ${textMain} leading-tight`}>USDC</span>
                  <span className={`text-[12px] font-medium ${textMuted}`}>USD Coin</span>
                </div>
              </div>
              <div className="text-[14px] font-bold text-right w-24">$12,000.00</div>
              <div className="text-[13px] font-bold text-[#16C784] text-right w-16 flex justify-end items-center gap-1">
                +0.0% <Minus size={12} weight="bold" />
              </div>
            </div>
          </div>

          <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#00A8E8] hover:opacity-80 transition-opacity mt-auto pt-4">
            View all assets <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Bottom Table: Your Active Positions */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm overflow-hidden flex flex-col mt-2`}>
        <div className="px-6 py-5 border-b border-transparent">
          <h2 className="text-[16px] font-bold">Your Active Positions</h2>
        </div>
        
        {/* Table Header */}
        <div className={`hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b ${borderColor} text-[12px] font-semibold ${textMuted}`}>
          <div>Product</div>
          <div>Asset/Strategy</div>
          <div>Principal Balance</div>
          <div>Accrued Yield</div>
          <div className="text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          {/* Row 1 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[13px]`}>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#00A8E8]/10 text-[#00A8E8]' : 'bg-[#e0f4fc] text-[#00A8E8]'}`}>
                Yield Hub
              </span>
            </div>
            <div className="font-medium">HBAR/USDC Farm</div>
            <div className="font-bold">$10,500.00</div>
            <div className="text-[#16C784] font-bold">+$340.00</div>
            <div className="flex justify-end">
              <button className="px-4 py-1.5 rounded-md border border-[#00A8E8] text-[#00A8E8] font-bold hover:bg-[#00A8E8]/5 transition-colors">
                Manage
              </button>
            </div>
          </div>

          {/* Row 2 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[13px]`}>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                Vault
              </span>
            </div>
            <div className="font-medium">90-Day USDC</div>
            <div className="font-bold">$12,000.00</div>
            <div className="text-[#16C784] font-bold">+$120.00</div>
            <div className="flex justify-end">
              <button className="px-4 py-1.5 rounded-md border border-[#00A8E8] text-[#00A8E8] font-bold hover:bg-[#00A8E8]/5 transition-colors">
                Manage
              </button>
            </div>
          </div>
        </div>

        <div className="w-full flex justify-center py-5 bg-transparent">
          <button className="flex items-center gap-1.5 text-[13px] font-bold text-[#00A8E8] hover:opacity-80 transition-opacity">
            View all positions <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

    </div>
  );
};
