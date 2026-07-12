import React, { useState } from 'react';
import { P2PCandleChart } from './P2PCandleChart';
import { ChevronDown, Settings, Zap, Info, Search, FileText } from 'lucide-react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeChartTab, setActiveChartTab] = useState<'Market Overview' | 'Order Book'>('Market Overview');
  const [activeTimeFilter, setActiveTimeFilter] = useState('24H');
  
  const [orderSide, setOrderSide] = useState<'Long' | 'Short'>('Long');
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const [amount, setAmount] = useState('1,500.00');
  const [sliderValue, setSliderValue] = useState(25);
  
  const [activeBottomTab, setActiveBottomTab] = useState<'My Orders' | 'Positions' | 'Assets' | 'Open Peer Offers'>('My Orders');

  // Styles
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-slate-100';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  
  const greenColor = '#10B981'; // Match design
  const blueColor = '#00A8E8';

  return (
    <div className={`w-full flex flex-col gap-6 ${textMain}`}>
      {/* Top Layout: Chart (Left) and Order Panel (Right) */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full">
        
        {/* 1. MAIN CHART AREA */}
        <div className={`flex-1 ${cardBg} border ${borderColor} rounded-[16px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] p-6 flex flex-col min-w-0`}>
          
          {/* Header row: Tabs & Pair info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            
            {/* Left side: Tabs and Pair */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6 border-b border-transparent">
                {['Market Overview', 'Order Book'].map((tab) => (
                  <div 
                    key={tab}
                    onClick={() => setActiveChartTab(tab as any)}
                    className={`pb-2 text-[14px] font-bold cursor-pointer relative transition-colors ${activeChartTab === tab ? 'text-[#00A8E8]' : textMuted + ' hover:' + textMain}`}
                  >
                    {tab}
                    {activeChartTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full" />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1 cursor-pointer mb-1 w-fit">
                  <span className="text-[16px] font-bold tracking-tight">HBAR / USDC</span>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-[28px] font-bold leading-none tracking-tight">0.08149</span>
                  <span className="text-[15px] font-bold" style={{ color: greenColor }}>+2.48%</span>
                </div>
              </div>
            </div>

            {/* Right side: Time filters */}
            <div className="flex items-center gap-2 mt-auto">
               <div className="flex items-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg p-1">
                 {['24H', '7D', '1M', '1Y'].map(time => (
                   <button
                     key={time}
                     onClick={() => setActiveTimeFilter(time)}
                     className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-colors ${activeTimeFilter === time ? 'bg-white dark:bg-[#0F141A] text-[#00A8E8] shadow-sm border border-slate-200 dark:border-white/10' : textMuted + ' hover:' + textMain}`}
                   >
                     {time}
                   </button>
                 ))}
               </div>
               <button className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-slate-500 hover:text-slate-900 dark:text-white/60 dark:hover:text-white transition-colors flex items-center justify-center">
                 <Settings className="w-[18px] h-[18px]" />
               </button>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 w-full min-h-[350px] relative border-b border-slate-100 dark:border-white/5 pb-4 mb-4">
            <P2PCandleChart theme={theme} />
          </div>

          {/* Bottom Stats Row */}
          <div className="flex items-center justify-between px-2 pt-2">
            <div className="flex flex-col">
              <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H High</span>
              <span className="text-[14px] font-bold">0.08290</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Low</span>
              <span className="text-[14px] font-bold">0.07821</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Volume</span>
              <span className="text-[14px] font-bold">12.45M USDC</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Change</span>
              <span className="text-[14px] font-bold" style={{ color: greenColor }}>+2.48%</span>
            </div>
          </div>
        </div>

        {/* 2. ORDER PANEL (RIGHT) */}
        <div className={`w-full xl:w-[400px] shrink-0 ${cardBg} border ${borderColor} rounded-[16px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] p-6 flex flex-col h-full`}>
          {/* Long/Short Toggle */}
          <div className={`flex bg-slate-50 dark:bg-white/5 border ${borderColor} rounded-full p-1 mb-5 relative w-full h-[46px] items-center font-bold text-[14px]`}>
            <div 
              className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${orderSide === 'Long' ? 'text-white' : textMuted + ' hover:' + textMain}`}
              onClick={() => setOrderSide('Long')}
            >
              Long
            </div>
            <div 
              className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${orderSide === 'Short' ? 'text-white' : textMuted + ' hover:' + textMain}`}
              onClick={() => setOrderSide('Short')}
            >
              Short
            </div>
            <div 
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ${orderSide === 'Long' ? 'bg-[#10B981] left-1' : 'bg-[#EF4444] left-[calc(50%+2px)]'}`}
            ></div>
          </div>

          {/* Market / Limit Tabs */}
          <div className="flex items-center gap-6 mb-5 px-1 border-b border-slate-100 dark:border-white/5 pb-[1px]">
            {['Market', 'Limit'].map((tab) => (
              <div 
                key={tab}
                onClick={() => setOrderType(tab as any)}
                className={`pb-2 text-[14px] font-bold cursor-pointer relative transition-colors ${orderType === tab ? 'text-[#00A8E8]' : textMuted + ' hover:' + textMain}`}
              >
                {tab}
                {orderType === tab && (
                  <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full" />
                )}
              </div>
            ))}
          </div>

          {/* Market Order Info Box */}
          <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl p-4 flex gap-3 mb-6">
            <Zap className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">Market Order</span>
              <span className={`text-[11px] text-slate-600 dark:text-white/70 leading-relaxed font-medium`}>Your order will be executed instantly at the best available price.</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="flex flex-col mb-2">
            <label className={`text-[13px] font-bold ${textMuted} mb-2`}>Amount (You pay)</label>
            <div className={`flex items-center justify-between w-full h-[88px] px-5 bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/10 rounded-[12px] focus-within:border-[#00A8E8] dark:focus-within:border-[#00A8E8] transition-colors`}>
              <div className="flex flex-col justify-center h-full">
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-transparent outline-none border-none text-[28px] font-bold w-full text-left [appearance:textfield] text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 m-0 p-0 leading-none mb-1" 
                />
                <span className={`text-[13px] font-bold ${textMuted}`}>≈ ${amount} USD</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-3 py-2 rounded-full border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer">
                <div className="w-5 h-5 bg-[#2775ca] rounded-full flex items-center justify-center shrink-0">
                   <span className="text-white text-[10px] font-bold">$</span>
                </div>
                <span className="text-[13px] font-bold text-slate-900 dark:text-white">USDC</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Available & Equivalent */}
          <div className="flex justify-between items-center mb-6 px-1">
            <span className={`text-[12px] font-bold ${textMuted}`}>Available: <span className="text-[#00A8E8] cursor-pointer hover:underline">5,420 USDC</span></span>
            <span className={`text-[12px] font-bold ${textMain}`}>$123.75</span>
          </div>

          {/* Slider */}
          <div className="mb-8 px-2 mt-4">
            <div className="relative h-1.5 bg-slate-100 dark:bg-white/5 rounded-full w-full">
              {/* Active Track */}
              <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10" style={{ width: `${sliderValue}%` }}></div>
              
              {/* Markers & Labels */}
              {[0, 25, 50, 75, 100].map(val => (
                <div key={val} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${val}%` }}>
                  <div className={`w-2.5 h-2.5 rounded-full -ml-[5px] relative z-20 ${val <= sliderValue ? 'bg-[#00A8E8]' : 'bg-slate-200 dark:bg-white/20'}`}></div>
                  <span className={`absolute top-4 left-1/2 -translate-x-1/2 text-[11px] font-bold ${val === sliderValue ? textMain : textMuted}`}>{val}%</span>
                </div>
              ))}
              
              {/* Current Value Tooltip above thumb */}
              <div 
                className="absolute top-[-28px] -ml-[18px] w-[36px] h-[20px] bg-[#00A8E8] text-white text-[10px] font-bold flex items-center justify-center rounded-md z-30 pointer-events-none"
                style={{ left: `${sliderValue}%` }}
              >
                {sliderValue}%
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#00A8E8]"></div>
              </div>

              <input 
                type="range" 
                min="0" max="100" step="1"
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-40 m-0 p-0"
              />
            </div>
          </div>

          {/* Estimation Box */}
          <div className="flex flex-col gap-3 mb-6 mt-4 px-1">
            <div className="flex justify-between items-center">
              <span className={`text-[13px] font-bold ${textMuted}`}>You will receive (Est.)</span>
              <span className="text-[14px] font-bold" style={{ color: greenColor }}>1,841.48 USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-[13px] font-bold ${textMuted}`}>Estimated Price</span>
              <span className={`text-[13px] font-bold ${textMain}`}>0.08149 USDT</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className={`text-[13px] font-bold ${textMuted}`}>Slippage Tolerance</span>
                <Info className={`w-3.5 h-3.5 ${textMuted} cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors`} />
              </div>
              <span className={`text-[13px] font-bold ${textMain}`}>0.50%</span>
            </div>
          </div>

          {/* CTA */}
          <button 
            className="mt-auto w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[15px] py-4 rounded-[12px] shadow-sm transition-colors tracking-wide"
            onClick={() => setIsWalletConnected(true)}
          >
            {isWalletConnected ? orderSide : 'Connect Wallet'}
          </button>
        </div>

      </div>

      {/* 3. BOTTOM PANEL */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] min-h-[300px] flex flex-col`}>
        {/* Tabs */}
        <div className={`flex items-center gap-8 px-6 pt-5 border-b ${borderColor}`}>
          {['My Orders', 'Positions', 'Assets', 'Open Peer Offers'].map((tab) => (
            <div 
              key={tab}
              onClick={() => setActiveBottomTab(tab as any)}
              className={`pb-3 text-[14px] font-bold cursor-pointer relative transition-colors ${activeBottomTab === tab ? 'text-[#00A8E8]' : textMuted + ' hover:' + textMain}`}
            >
              {tab}
              {activeBottomTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full" />
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center py-16">
          <div className="relative mb-6">
            <div className="w-[84px] h-[84px] rounded-full bg-[#00A8E8]/10 dark:bg-[#00A8E8]/5 flex items-center justify-center">
              <FileText className="w-10 h-10 text-[#00A8E8]/40 dark:text-[#00A8E8]/30 stroke-[1.5]" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-white dark:bg-[#0F141A] shadow-sm flex items-center justify-center p-1.5">
              <div className="w-full h-full rounded-full bg-[#00A8E8]/20 dark:bg-[#00A8E8]/20 flex items-center justify-center">
                <Search className="w-4 h-4 text-[#00A8E8] stroke-[3]" />
              </div>
            </div>
          </div>
          <h3 className="text-[18px] font-bold mb-1.5">No P2P Orders Yet</h3>
          <p className={`text-[14px] font-bold ${textMuted} mb-6 text-center`}>
            You haven't created any P2P orders yet.
          </p>
          <button className="bg-[#00A8E8] hover:opacity-90 text-white font-bold text-[13px] px-6 py-2.5 rounded-lg shadow-sm transition-colors">
            Place Your First Order
          </button>
        </div>
      </div>

    </div>
  );
};
