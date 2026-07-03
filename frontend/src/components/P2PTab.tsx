import React, { useState } from 'react';
import { P2PCandleChart } from './P2PCandleChart';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeTradeMode, setActiveTradeMode] = useState<'Market' | 'Limit' | 'Trigger'>('Market');
  const [activeOrderTab, setActiveOrderTab] = useState<'Orders' | 'Positions' | 'Assets' | 'Open Peer Orders'>('Orders');
  const [tradeSide, setTradeSide] = useState<'Long' | 'Short'>('Long');

  // Match VaultTab colors
  const bgColor = theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-slate-100';
  
  const textMuted = theme === 'dark' ? 'text-[#808a9d]' : 'text-slate-500';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const greenColor = '#00c076';
  const redColor = '#ff5353';

  return (
    <div className={`w-full flex flex-col gap-4 font-sans ${textMain}`}>
      
      {/* TOP TRADING BAR */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] p-4 flex items-center justify-between shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold">₿</div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-xl font-bold">BTC-USD</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <div className={`h-8 w-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className={`text-xs ${textMuted} mb-1`}>Mark Price</span>
              <span className="text-lg font-semibold">$70,552.2546</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs ${textMuted} mb-1`}>24h Change</span>
              <span className="text-sm font-medium" style={{ color: greenColor }}>+19.28%</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs ${textMuted} mb-1`}>24h Vol</span>
              <span className="text-sm font-medium">$391.41</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs ${textMuted} mb-1`}>Open Interest <span className={textMuted}>(</span><span style={{ color: greenColor }}>68%</span><span className={textMuted}>/</span><span style={{ color: redColor }}>32%</span><span className={textMuted}>)</span></span>
              <span className="text-sm font-medium">$173.56 M / $260.59 M</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-xs ${textMuted} mb-1`}>Funding/1h</span>
              <span className="text-sm font-medium" style={{ color: greenColor }}>~0.0024% <span style={{ color: redColor }}>-0.0253%</span></span>
            </div>
          </div>
        </div>
        <div>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-white transition-colors"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-col xl:flex-row gap-6 items-stretch w-full">
        
        {/* === LEFT & MIDDLE WRAPPER === */}
        <div className="flex-1 flex flex-col gap-6 min-w-0 w-full">
          
          {/* Top Row: Chart (Left) and Market Activity (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Chart Area */}
            <div className={`lg:col-span-3 ${cardBg} border ${borderColor} rounded-[16px] p-4 flex flex-col h-[550px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
              {/* Toolbar */}
              <div className={`flex flex-wrap items-center justify-between gap-3 pb-3 border-b ${borderColor} mb-3`}>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>1m</span>
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>5m</span>
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>15m</span>
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>1h</span>
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>4h</span>
                  <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>D</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  
                  <div className={`w-[1px] h-4 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'} mx-1`}></div>
                  
                  <div className="flex items-center gap-1 cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                    <span className={`text-sm ${textMuted} hover:${textMain}`}>Indicators</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    <span className={`text-sm ${textMuted} hover:${textMain}`}>Save</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-white"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-white"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              </div>
              
              {/* Chart Graphic Area */}
              <div className={`flex-1 w-full relative overflow-hidden flex flex-col`}>
                <div className="flex items-center gap-2 p-2 text-xs">
                  <span className={textMuted}>Crypto BTC/USD</span>
                  <span className={textMuted}>•</span>
                  <span className={textMain}>PYTH</span>
                  <span style={{color: redColor}}>O 69965.52</span>
                  <span style={{color: redColor}}>H 69981.03</span>
                  <span style={{color: redColor}}>L 69831.50</span>
                  <span style={{color: redColor}}>C 69907.09</span>
                  <span style={{color: redColor}}>-58.23 (-0.09%)</span>
                </div>
                
                <div className="flex-1 w-full relative">
                   <P2PCandleChart theme={theme} />
                </div>
              </div>
            </div>

            {/* Market Activity Area */}
            <div className={`lg:col-span-1 ${cardBg} border ${borderColor} rounded-[16px] flex flex-col h-[550px] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
              <div className="p-4 pb-2 text-sm font-semibold border-b border-transparent">
                Market Activity
              </div>
              
              <div className="flex-1 overflow-hidden">
                <table className="w-full text-xs text-right">
                  <thead className={`sticky top-0 ${cardBg} z-10`}>
                    <tr className={`${textMuted}`}>
                      <th className="font-normal py-2 px-4 text-left">Price (USD)</th>
                      <th className="font-normal py-2 px-4">Size (BTC)</th>
                      <th className="font-normal py-2 px-4">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { p: "70,552.2546", s: "214.34K", t: "16:02", d: "up" },
                      { p: "70,550.9912", s: "440.09K", t: "16:02", d: "up" },
                      { p: "66,316.8903", s: "488.34K", t: "15:59", d: "down" },
                      { p: "70,663.2215", s: "160.56K", t: "15:58", d: "down" },
                      { p: "70,672.1923", s: "504.21K", t: "15:58", d: "down" },
                      { p: "70,671.5985", s: "906.09K", t: "15:57", d: "down" },
                      { p: "69,148.5503", s: "724.99K", t: "15:56", d: "down" },
                      { p: "66,600.2311", s: "691.14K", t: "15:54", d: "up" },
                      { p: "70,765.4978", s: "279.83K", t: "15:54", d: "down" },
                      { p: "69,167.3710", s: "695.45K", t: "15:53", d: "up" },
                      { p: "63,291.2986", s: "188.04K", t: "15:53", d: "down" },
                      { p: "70,552.2546", s: "214.34K", t: "16:02", d: "up" },
                      { p: "70,550.9912", s: "440.09K", t: "16:02", d: "up" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                        <td className="py-2 px-4 text-left flex items-center gap-1 font-medium" style={{ color: row.d === 'up' ? greenColor : redColor }}>
                          {row.d === 'up' ? 
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg> : 
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          }
                          ${row.p}
                        </td>
                        <td className="py-2 px-4 font-medium">{row.s}</td>
                        <td className={`py-2 px-4 ${textMuted}`}>{row.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Bottom Row: Merged Tabs Panel (Spans across both Chart and Market Activity) */}
          <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col min-h-[300px] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            {/* Tabs */}
            <div className={`flex items-center gap-6 px-6 pt-4 border-b ${borderColor}`}>
              {['Orders', 'Positions', 'Assets', 'Open Peer Orders'].map((tab) => (
                <div 
                  key={tab}
                  className={`pb-3 text-sm cursor-pointer relative ${activeOrderTab === tab ? 'text-white font-medium' : textMuted}`}
                  onClick={() => setActiveOrderTab(tab as any)}
                >
                  {tab}
                  {activeOrderTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-t-sm" />
                  )}
                </div>
              ))}
            </div>
            
            {/* Table Content */}
            <div className="flex-1 overflow-hidden p-2">
              {activeOrderTab === 'Orders' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={textMuted}>
                      <th className="font-normal py-3 px-4">Pair</th>
                      <th className="font-normal py-3 px-4">Type</th>
                      <th className="font-normal py-3 px-4">Side</th>
                      <th className="font-normal py-3 px-4">Amount</th>
                      <th className="font-normal py-3 px-4">Price</th>
                      <th className="font-normal py-3 px-4">Status</th>
                      <th className="font-normal py-3 px-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                    <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 font-medium">BTC-USD</td>
                      <td className={`py-3 px-4 ${textMuted}`}>Limit</td>
                      <td className="py-3 px-4 text-[#00c076] font-medium">Buy</td>
                      <td className="py-3 px-4 font-medium">0.2541 BTC</td>
                      <td className="py-3 px-4 font-medium">$69,500.00</td>
                      <td className="py-3 px-4"><span className="text-[#3b82f6] font-medium">Open</span></td>
                      <td className={`py-3 px-4 flex justify-between items-center ${textMuted}`}>May 20, 16:02</td>
                    </tr>
                    <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 font-medium">ETH-USD</td>
                      <td className={`py-3 px-4 ${textMuted}`}>Limit</td>
                      <td className="py-3 px-4 text-[#ff5353] font-medium">Sell</td>
                      <td className="py-3 px-4 font-medium">2.0000 ETH</td>
                      <td className="py-3 px-4 font-medium">$3,400.00</td>
                      <td className="py-3 px-4"><span className="text-[#f59e0b] font-medium">Partially Filled</span></td>
                      <td className={`py-3 px-4 flex justify-between items-center ${textMuted}`}>May 20, 15:48</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {activeOrderTab === 'Open Peer Orders' && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={textMuted}>
                      <th className="font-normal py-3 px-4">User</th>
                      <th className="font-normal py-3 px-4 text-right">Price (USD)</th>
                      <th className="font-normal py-3 px-4 text-right">Available</th>
                      <th className="font-normal py-3 px-4">Payment</th>
                      <th className="font-normal py-3 px-4"></th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {[
                      { initial: 'A', name: 'AlphaTrader', bg: 'bg-[#3b82f6]', stats: '98% | 312 trades', p: '70,552.25', a: '0.8452 BTC', pay: 'USDC', action: 'Buy' },
                      { initial: 'B', name: 'BlockWave', bg: 'bg-[#8b5cf6]', stats: '95% | 156 trades', p: '70,550.99', a: '1.2310 BTC', pay: 'USDT', action: 'Buy' },
                      { initial: 'C', name: 'CryptoKnight', bg: 'bg-[#10b981]', stats: '97% | 278 trades', p: '70,548.88', a: '0.5321 BTC', pay: 'USDC', action: 'Buy' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full ${row.bg} flex items-center justify-center text-white font-bold shrink-0`}>
                              {row.initial}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 font-medium">
                                {row.name}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                              </div>
                              <span className={`text-[10px] ${textMuted}`}>{row.stats}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">${row.p}</td>
                        <td className="py-3 px-4 text-right font-medium">{row.a}</td>
                        <td className="py-3 px-4 text-[#3b82f6] font-medium">{row.pay}</td>
                        <td className="py-3 px-4 text-right">
                          <button className={`text-[10px] font-bold px-3 py-1.5 rounded bg-transparent border ${row.action === 'Buy' ? 'border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10' : 'border-[#ff5353] text-[#ff5353] hover:bg-[#ff5353]/10'} transition-colors`}>
                            {row.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* === RIGHT WRAPPER: Trade Panel === */}
        <div className="flex flex-col gap-6 w-full xl:w-[350px] shrink-0 h-full">
          
          <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col h-[550px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
            
            {/* Removed the "Slippage / Time" header completely as requested */}
            <div className="pt-4"></div>

            {/* Long / Short Tabs - FULLY ROUNDED TOGGLE */}
            <div className="px-4 pb-2">
              <div className={`flex ${theme === 'dark' ? 'border-white/10 bg-white/5 shadow-none' : 'border-black/10 bg-black/5 shadow-sm'} border rounded-full p-1 relative w-full h-11 items-center font-semibold text-sm`}>
                 <div 
                   className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Long' ? 'text-black' : textMuted + ' hover:text-white'}`}
                   onClick={() => setTradeSide('Long')}
                 >
                   Long
                 </div>
                 <div 
                   className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Short' ? 'text-white' : textMuted + ' hover:text-white'}`}
                   onClick={() => setTradeSide('Short')}
                 >
                   Short
                 </div>
                 <div 
                   className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ${tradeSide === 'Long' ? 'bg-[#86efac] left-1' : 'bg-[#ff5353] left-[calc(50%+2px)]'}`}
                 ></div>
              </div>
            </div>

            {/* Trade Mode Tabs */}
            <div className={`flex items-center gap-6 px-4 pt-2 border-b ${borderColor} mb-4`}>
              {['Market', 'Limit', 'Trigger'].map((tab) => (
                <div 
                  key={tab}
                  className={`pb-3 text-sm cursor-pointer relative transition-colors ${activeTradeMode === tab ? 'text-white font-medium' : textMuted + ' hover:text-white'}`}
                  onClick={() => setActiveTradeMode(tab as any)}
                >
                  {tab}
                  {activeTradeMode === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-t-sm" />
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              {activeTradeMode === 'Market' ? (
                <>
                  {/* Pay Input Section (Label removed but height restored and sizing locked) */}
                  <div className={`shrink-0 w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-slate-100'} border ${borderColor} rounded-[16px] p-5 py-6 mb-4 focus-within:border-[#4f46e5] transition-colors group flex items-center justify-between gap-2 min-h-[96px]`}>
                    <input 
                      type="text" 
                      value="0.0" 
                      readOnly
                      className={`bg-transparent ${textMain} text-2xl font-bold outline-none w-full min-w-0`} 
                    />
                    
                    {/* TOKEN SELECTOR */}
                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-[#1e2330] hover:bg-[#2a3040]' : 'bg-white hover:bg-slate-50'} shadow-sm transition-colors rounded-full px-4 py-2 cursor-pointer shrink-0`}>
                      <div className="w-6 h-6 bg-[#2775ca] rounded-full flex items-center justify-center">
                         <span className="text-white text-xs font-bold">$</span>
                      </div>
                      <span className="text-sm font-bold">USDC</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>

                  {/* Balance Info */}
                  <div className="flex justify-between items-end mb-6">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={textMuted}>You Can</span>
                      <span className={textMuted}>Available <span className={textMain}>0.00</span></span>
                    </div>
                    <span className="text-sm font-semibold">$1,000.00</span>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-[#00A8E8] hover:opacity-90 text-white font-bold py-3.5 rounded-[12px] transition-opacity mb-6 text-sm shadow-[0_0_15px_rgba(0,168,232,0.3)]">
                    Connect Wallet
                  </button>

                  {/* Info Section */}
                  <div className="flex flex-col gap-3 text-xs pb-2">
                    <div className="flex justify-between">
                      <span className={textMuted}>Open Fee</span>
                      <span className="font-medium">US$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Collateral in</span>
                      <span className="font-medium">USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Leverage</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPTY STATE FOR LIMIT / TRIGGER */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  <p className={`text-sm ${textMuted}`}>Not available in {activeTradeMode} mode.</p>
                  <p className={`text-xs ${textMuted} mt-1`}>Switch to Market to trade.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info Card (Trade with confidence) - mt-auto pushes it to the bottom baseline! */}
          <div className="mt-auto bg-gradient-to-br from-[#1e1b2e] to-[#12101a] border border-[#2d2442] rounded-[16px] p-5 flex items-center justify-between shadow-lg">
            <div className="flex flex-col max-w-[200px]">
              <span className="font-bold mb-2 text-sm text-white">Trade with confidence</span>
              <span className={`text-xs text-[#a59eb8] leading-relaxed`}>Low fees, deep liquidity, and best execution.</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-[12px] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
