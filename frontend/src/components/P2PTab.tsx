import React, { useState } from 'react';
import { P2PCandleChart } from './P2PCandleChart';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeTradeMode, setActiveTradeMode] = useState<'Market' | 'Limit' | 'Trigger'>('Market');
  const [activeOrderTab, setActiveOrderTab] = useState<'Orders' | 'Positions' | 'Assets' | 'Open Peer Orders'>('Orders');
  const [tradeSide, setTradeSide] = useState<'Long' | 'Short'>('Long');
  const [payAmount, setPayAmount] = useState<string>('');
  const [priceAmount, setPriceAmount] = useState<string>('');
  const [posSize, setPosSize] = useState<number>(10);

  // Match VaultTab colors
  const bgColor = theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-slate-100';
  
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const greenColor = '#00c076';
  const redColor = '#ff5353';

  return (
    <div className={`w-full flex flex-col gap-4 ${textMain}`}>
      
      {/* TOP TRADING BAR */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[16px] p-4 flex items-center justify-between shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold">₿</div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-xl font-bold tracking-tight">BTC-USD</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <div className={`h-8 w-[1px] ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>Mark Price</span>
              <span className="text-lg font-bold tracking-tight">$70,552.2546</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h Change</span>
              <span className="text-sm font-bold tracking-tight" style={{ color: greenColor }}>+19.28%</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>24h Vol</span>
              <span className="text-sm font-bold tracking-tight">$391.41</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>Open Interest <span className={textMuted}>(</span><span style={{ color: greenColor }}>68%</span><span className={textMuted}>/</span><span style={{ color: redColor }}>32%</span><span className={textMuted}>)</span></span>
              <span className="text-sm font-bold tracking-tight">$173.56 M / $260.59 M</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-semibold ${textMuted} mb-1`}>Funding/1h</span>
              <span className="text-sm font-bold tracking-tight" style={{ color: greenColor }}>~0.0024% <span style={{ color: redColor }}>-0.0253%</span></span>
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
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_250px] gap-6 items-start">
            
            {/* Chart Area */}
            <div className={`${cardBg} border ${borderColor} rounded-[16px] p-4 flex flex-col h-[550px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
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
            <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col h-[550px] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
              <div className="p-4 pb-2 text-sm font-semibold border-b border-transparent">
                Market Activity
              </div>
              
              <div className="flex-1 overflow-hidden">
                <table className="w-full text-[11px] text-right">
                  <thead className={`sticky top-0 ${cardBg} z-10`}>
                    <tr className={`${textMuted}`}>
                      <th className="font-normal py-2 px-3 text-left">Price (USD)</th>
                      <th className="font-normal py-2 px-3">Size (BTC)</th>
                      <th className="font-normal py-2 px-3">Time</th>
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
                        <td className="py-2 px-3 text-left flex items-center gap-1 font-medium" style={{ color: row.d === 'up' ? greenColor : redColor }}>
                          {row.d === 'up' ? 
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg> : 
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
                          }
                          {row.p}
                        </td>
                        <td className="py-2 px-3 font-medium">{row.s}</td>
                        <td className={`py-2 px-3 ${textMuted}`}>{row.t}</td>
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
            <div className={`flex items-center px-3 pt-4 border-b ${borderColor}`}>
              {['Orders', 'Positions', 'Assets', 'Open Peer Orders'].map((tab) => (
                <div 
                  key={tab}
                  className={`px-3 pb-3 text-sm cursor-pointer relative ${activeOrderTab === tab ? 'text-white font-medium' : textMuted}`}
                  onClick={() => setActiveOrderTab(tab as any)}
                >
                  {tab}
                  {activeOrderTab === tab && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
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
                      <td className="py-3 px-4 font-bold tracking-tight">BTC-USD</td>
                      <td className={`py-3 px-4 font-bold tracking-tight ${textMuted}`}>Limit</td>
                      <td className="py-3 px-4 text-[#00c076] font-bold tracking-tight">Buy</td>
                      <td className="py-3 px-4 font-bold tracking-tight">0.2541 BTC</td>
                      <td className="py-3 px-4 font-bold tracking-tight">$69,500.00</td>
                      <td className="py-3 px-4 font-bold tracking-tight"><span className="text-[#3b82f6] font-bold tracking-tight">Open</span></td>
                      <td className={`py-3 px-4 font-bold tracking-tight flex justify-between items-center ${textMuted}`}>May 20, 16:02</td>
                    </tr>
                    <tr className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                      <td className="py-3 px-4 font-bold tracking-tight">ETH-USD</td>
                      <td className={`py-3 px-4 font-bold tracking-tight ${textMuted}`}>Limit</td>
                      <td className="py-3 px-4 text-[#ff5353] font-bold tracking-tight">Sell</td>
                      <td className="py-3 px-4 font-bold tracking-tight">2.0000 ETH</td>
                      <td className="py-3 px-4 font-bold tracking-tight">$3,400.00</td>
                      <td className="py-3 px-4 font-bold tracking-tight"><span className="text-[#f59e0b] font-bold tracking-tight">Partially Filled</span></td>
                      <td className={`py-3 px-4 font-bold tracking-tight flex justify-between items-center ${textMuted}`}>May 20, 15:48</td>
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
                              <div className="flex items-center gap-1 font-bold tracking-tight">
                                {row.name}
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="#3b82f6" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                              </div>
                              <span className={`text-[10px] ${textMuted}`}>{row.stats}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold tracking-tight">${row.p}</td>
                        <td className="py-3 px-4 text-right font-bold tracking-tight">{row.a}</td>
                        <td className="py-3 px-4 text-[#3b82f6] font-bold tracking-tight">{row.pay}</td>
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
                   className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ${tradeSide === 'Long' ? 'bg-[#10B981] left-1' : 'bg-red-500 left-[calc(50%+2px)]'}`}
                 ></div>
              </div>
            </div>

            {/* Trade Mode Tabs */}
            <div className={`flex items-center px-1 pt-2 border-b ${borderColor} mb-4`}>
              {['Market', 'Limit', 'Trigger'].map((tab) => (
                <div 
                  key={tab}
                  className={`px-3 pb-3 text-sm cursor-pointer relative transition-colors ${activeTradeMode === tab ? 'text-white font-medium' : textMuted + ' hover:text-white'}`}
                  onClick={() => setActiveTradeMode(tab as any)}
                >
                  {tab}
                  {activeTradeMode === tab && (
                    <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              {activeTradeMode === 'Market' && (
                <>
                  {/* Pay Input Section (Label removed but height restored and sizing locked) */}
                  <div className={`shrink-0 w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-slate-100'} border ${borderColor} rounded-[16px] p-5 py-6 mb-4 focus-within:border-[#00A8E8]/50 transition-colors group flex items-center justify-between gap-2 min-h-[96px]`}>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[28px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0" 
                    />
                    
                    {/* TOKEN SELECTOR */}
                    <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-[#1e2330] hover:bg-[#2a3040]' : 'bg-white hover:bg-slate-50'} shadow-sm transition-colors rounded-full px-4 py-2 cursor-pointer shrink-0`}>
                      <div className="w-6 h-6 bg-[#2775ca] rounded-full flex items-center justify-center">
                         <span className="text-white text-xs font-bold">$</span>
                      </div>
                      <span className="text-sm font-bold tracking-tight">USDC</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </div>

                  {/* Balance Info */}
                  <div className="flex justify-between items-end mb-5">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={textMuted}>You Can</span>
                      <span className={textMuted}>Available <span className={`${textMain} font-bold tracking-tight`}>0.00</span></span>
                    </div>
                    <span className="text-sm font-bold tracking-tight">$1,000.00</span>
                  </div>

                  {/* Pos.Size Slider */}
                  <div className="mb-6 px-1">
                    <div className="flex justify-between text-[11px] font-semibold mb-3">
                      <span className={textMuted}>Pos.Size</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative h-1.5 bg-slate-200 dark:bg-[#1e2330] rounded-full">
                        {/* Markers */}
                        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[100%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        
                        <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10" style={{ width: `${posSize}%` }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_10px_rgba(0,168,232,0.5)] border-2 border-white dark:border-[#0b0e14] z-20 pointer-events-none" style={{ left: `${posSize}%` }}></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={posSize} 
                          onChange={(e) => setPosSize(Number(e.target.value))} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0 p-0"
                        />
                      </div>
                      <span className="text-[13px] font-bold tracking-tight w-14 text-right">{posSize.toFixed(2)} ×</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-[#00A8E8] hover:opacity-90 text-white font-bold py-3.5 rounded-[12px] transition-opacity mb-6 text-sm shadow-[0_0_15px_rgba(0,168,232,0.3)]">
                    Connect Wallet
                  </button>

                  {/* Info Section */}
                  <div className="flex flex-col gap-3 text-[11px] pb-2 font-semibold">
                    <div className="flex justify-between">
                      <span className={textMuted}>Open Fee</span>
                      <span className={`${textMain}`}>US$0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Collateral in</span>
                      <span className={`${textMain}`}>USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Leverage</span>
                      <span className={`${textMain}`}>-</span>
                    </div>
                  </div>
                </>
              )}

              {activeTradeMode === 'Limit' && (
                <>
                  {/* Pay Input Section */}
                  <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-slate-100'} border ${borderColor} rounded-[16px] p-4 mb-3 focus-within:border-[#00A8E8]/50 transition-colors group flex flex-col gap-2`}>
                    <div className="flex justify-end items-center px-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[28px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${textMain} placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0`} 
                      />
                      <div className={`flex items-center gap-2 ${theme === 'dark' ? 'bg-[#1e2330] hover:bg-[#2a3040]' : 'bg-white hover:bg-slate-50'} shadow-sm transition-colors rounded-full px-4 py-2 cursor-pointer shrink-0`}>
                        <div className="w-6 h-6 bg-[#2775ca] rounded-full flex items-center justify-center">
                           <span className="text-white text-xs font-bold">$</span>
                        </div>
                        <span className="text-sm font-bold tracking-tight">USDC.e</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>

                  {/* Price Input Section */}
                  <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-slate-100'} border ${borderColor} rounded-[16px] p-4 mb-5 focus-within:border-[#00A8E8]/50 transition-colors group flex flex-col gap-2`}>
                    <div className="flex justify-between items-center px-1">
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Price</span>
                      <span className={`text-[12px] font-semibold ${textMuted}`}>Mark: $59,820.4800</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-1">
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={priceAmount}
                        onChange={(e) => setPriceAmount(e.target.value)}
                        className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[28px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${textMain} placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0`} 
                      />
                      <span className="text-[13px] font-bold tracking-tight pr-1">USD</span>
                    </div>
                  </div>

                  {/* Pos.Size Slider */}
                  <div className="mb-6 px-1">
                    <div className="flex justify-between text-[11px] font-semibold mb-3">
                      <span className={textMuted}>Pos.Size</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative h-1.5 bg-slate-200 dark:bg-[#1e2330] rounded-full">
                        {/* Markers */}
                        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        <div className="absolute left-[100%] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-[#2a3040]"></div>
                        
                        <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10" style={{ width: `${posSize}%` }}></div>
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_10px_rgba(0,168,232,0.5)] border-2 border-white dark:border-[#0b0e14] z-20 pointer-events-none" style={{ left: `${posSize}%` }}></div>
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={posSize} 
                          onChange={(e) => setPosSize(Number(e.target.value))} 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 m-0 p-0"
                        />
                      </div>
                      <span className="text-[13px] font-bold tracking-tight w-14 text-right">{posSize.toFixed(2)} ×</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-[#00A8E8] hover:opacity-90 text-white font-bold py-3.5 rounded-[12px] transition-opacity mb-6 text-sm shadow-[0_0_15px_rgba(0,168,232,0.3)]">
                    Connect Wallet
                  </button>

                  {/* Info Section */}
                  <div className="flex flex-col gap-3 text-[11px] font-semibold pb-2 px-1">
                    <div className="flex justify-between">
                      <span className={textMuted}>Open Fee</span>
                      <span className={`${textMain}`}>-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Collateral In</span>
                      <span className={`${textMain}`}>USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Leverage</span>
                      <span className={`${textMain}`}>-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Entry Price</span>
                      <span className={`${textMain}`}>-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Liq. Price</span>
                      <span className={`${textMain}`}>-</span>
                    </div>
                  </div>
                </>
              )}

              {activeTradeMode === 'Trigger' && (
                /* EMPTY STATE FOR TRIGGER */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  <p className={`text-sm ${textMuted}`}>Not available in {activeTradeMode} mode.</p>
                  <p className={`text-xs ${textMuted} mt-1`}>Switch to Market or Limit to trade.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Info Card (Trade with confidence) - mt-auto pushes it to the bottom baseline! */}
          <div className={`mt-auto bg-gradient-to-br ${theme === 'dark' ? 'from-[#00283a] to-[#001017] border-[#003d5c]' : 'from-[#e6f7ff] to-white border-[#b3e6ff]'} border rounded-[16px] p-5 flex items-center justify-between shadow-lg`}>
            <div className="flex flex-col max-w-[200px]">
              <span className={`font-bold mb-2 text-sm ${theme === 'dark' ? 'text-white' : 'text-[#005c80]'}`}>Trade with confidence</span>
              <span className={`text-xs ${textMuted} leading-relaxed`}>Low fees, deep liquidity, and best execution.</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#00A8E8] to-[#007ba8] rounded-[12px] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,168,232,0.4)]">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
