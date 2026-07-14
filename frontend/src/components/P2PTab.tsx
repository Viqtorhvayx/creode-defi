import React, { useState } from 'react';
import { P2PCandleChart } from './P2PCandleChart';
import { ChevronDown } from 'lucide-react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeTradeMode, setActiveTradeMode] = useState<'Market' | 'Limit' | 'Trigger'>('Market');
  const [activeChartTab, setActiveChartTab] = useState<'Market Overview' | 'Order Book'>('Market Overview');
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-6">
        
        {/* === LEFT & MIDDLE WRAPPER === */}
        <div className="lg:col-span-7 flex flex-col gap-6 w-full">
          
          {/* Top Row: Market Chart Module */}
          <div className="w-full">
            <div className={`${cardBg} border ${borderColor} rounded-[16px] p-6 flex flex-col h-[620px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)]`}>
              
              {/* Chart Tabs (Market Overview / Order Book) */}
              <div className={`flex items-center gap-6 border-b ${borderColor} mb-6`}>
                {['Market Overview', 'Order Book'].map((tab) => (
                  <div 
                    key={tab}
                    className={`pb-3 text-[14px] cursor-pointer relative transition-colors ${activeChartTab === tab ? 'text-[#00A8E8] font-bold' : textMuted + ' font-semibold hover:' + textMain}`}
                    onClick={() => setActiveChartTab(tab as any)}
                  >
                    {tab}
                    {activeChartTab === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                    )}
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 cursor-pointer group">
                    <span className="text-xl font-bold tracking-tight group-hover:text-[#00A8E8] transition-colors">HBAR / USDC</span>
                    <ChevronDown className={`w-5 h-5 ${textMuted} group-hover:text-[#00A8E8] transition-colors`} />
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-bold tracking-tight">0.08149</span>
                    <span className="text-sm font-bold" style={{ color: greenColor }}>+2.48%</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`flex items-center rounded-full border ${borderColor} p-1 shadow-sm`}>
                    <div className={`px-4 py-1.5 text-xs font-bold rounded-full ${theme === 'dark' ? 'bg-white text-black shadow-md' : 'bg-black text-white shadow-md'}`}>24H</div>
                    <div className={`px-4 py-1.5 text-xs font-bold ${textMuted} hover:${textMain} cursor-pointer transition-colors`}>7D</div>
                    <div className={`px-4 py-1.5 text-xs font-bold ${textMuted} hover:${textMain} cursor-pointer transition-colors`}>1M</div>
                    <div className={`px-4 py-1.5 text-xs font-bold ${textMuted} hover:${textMain} cursor-pointer transition-colors`}>1Y</div>
                  </div>
                  <div className={`w-[34px] h-[34px] flex items-center justify-center rounded-full border ${borderColor} cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 shadow-sm transition-colors`}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? 'white' : 'black'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="3" width="2" height="18"></rect><rect x="15" y="3" width="2" height="18"></rect><rect x="5" y="8" width="6" height="4" rx="1"></rect><rect x="13" y="12" width="6" height="4" rx="1"></rect></svg>
                  </div>
                </div>
              </div>
              
              {/* Chart Graphic Area */}
              <div className="flex-1 w-full relative overflow-hidden flex flex-col mb-8">
                <P2PCandleChart theme={theme} />
              </div>

              {/* Footer Stats Row */}
              <div className="grid grid-cols-4 gap-4 mt-auto">
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H High</span>
                  <span className="text-[15px] font-bold tracking-tight">0.08290</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Low</span>
                  <span className="text-[15px] font-bold tracking-tight">0.07821</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Volume</span>
                  <span className="text-[15px] font-bold tracking-tight">12.45M USDC</span>
                </div>
                <div className="flex flex-col">
                  <span className={`text-[12px] font-semibold ${textMuted} mb-1`}>24H Change</span>
                  <span className="text-[15px] font-bold tracking-tight" style={{ color: greenColor }}>+2.48%</span>
                </div>
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
        </div>        {/* === RIGHT WRAPPER: Order Input Panel === */}
        <div className="lg:col-span-5 flex flex-col gap-6 w-full h-full">
          
          <div className="w-full h-full">
            <div className={`${cardBg} border ${borderColor} rounded-[16px] flex flex-col shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] overflow-hidden h-[620px]`}>
              
              {/* Buy / Sell Toggle */}
              <div className="px-6 pt-6 pb-2">
                <div className={`flex ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-black/5'} border p-1 rounded-full relative w-full h-[48px] items-center font-bold text-[14px]`}>
                   <div 
                     className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Long' ? 'text-white' : textMuted + ' hover:text-white'}`}
                     onClick={() => setTradeSide('Long')}
                   >
                     Buy
                   </div>
                   <div 
                     className={`flex-1 text-center z-10 cursor-pointer h-full flex items-center justify-center transition-colors ${tradeSide === 'Short' ? 'text-white' : textMuted + ' hover:text-white'}`}
                     onClick={() => setTradeSide('Short')}
                   >
                     Sell
                   </div>
                   <div 
                     className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm transition-all duration-300 ${tradeSide === 'Long' ? 'bg-[#00c076] left-1' : 'bg-[#ff5353] left-[calc(50%+2px)]'}`}
                   ></div>
                </div>
              </div>

              {/* Market / Limit Tabs */}
              <div className={`flex items-center px-4 pt-2 border-b ${borderColor} mb-4`}>
                {['Market', 'Limit'].map((tab) => (
                  <div 
                    key={tab}
                    className={`pb-3 mr-6 text-[14px] cursor-pointer relative transition-colors ${activeTradeMode === tab ? 'text-[#00A8E8] font-bold' : textMuted + ' font-semibold hover:' + textMain}`}
                    onClick={() => setActiveTradeMode(tab as any)}
                  >
                    {tab}
                    {activeTradeMode === tab && (
                      <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#00A8E8] rounded-t-full shadow-[0_-2px_12px_rgba(0,168,232,0.6)] z-10" />
                    )}
                  </div>
                ))}
              </div>

              <div className="px-4 pb-4 flex flex-col flex-1 h-full">
                {/* Info Box */}
                <div className="flex items-start gap-3 bg-[#e6faee] dark:bg-[#00c076]/10 p-3 rounded-[8px] mb-5 border border-[#00c076]/20">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Market Order</span>
                    <span className="text-[11px] font-medium text-slate-600 dark:text-white/70 leading-tight">Your order will be executed instantly at the best available price.</span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <span className={`text-[12px] font-semibold ${textMuted}`}>Amount (You pay)</span>
                </div>

                {/* Amount Input */}
                <div className={`w-full ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white'} border ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'} rounded-[12px] py-4 px-4 mb-3 focus-within:border-[#00A8E8] transition-colors group`}>
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="text" 
                      placeholder="0.00" 
                      value="1,500.00"
                      readOnly
                      className={`bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[24px] font-bold w-full text-left [appearance:textfield] ${textMain} placeholder-slate-300 leading-none m-0 p-0`} 
                    />
                    
                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 min-w-[90px] rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors shrink-0">
                      <div className="w-[18px] h-[18px] bg-[#2775ca] rounded-full flex items-center justify-center shrink-0">
                         <span className="text-white text-[10px] font-bold">$</span>
                      </div>
                      <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">USDC</span>
                      <ChevronDown className={`w-[14px] h-[14px] ${textMuted} ml-0.5`} />
                    </div>
                  </div>
                  <div className={`text-[11px] font-semibold ${textMuted} mt-1.5 px-0.5`}>≈ $1,500.00 USD</div>
                </div>

                {/* Balance */}
                <div className="flex justify-between items-center mb-6 px-1">
                  <span className={`text-[12px] font-semibold ${textMuted}`}>Available: <span className="text-[#00A8E8] font-bold">5,420 USDC</span></span>
                  <span className="text-[12px] font-bold tracking-tight">$123.75</span>
                </div>

                {/* Slider */}
                <div className="mb-8 px-1 mt-6 relative">
                  <div className="relative h-1.5 bg-slate-200 dark:bg-[#1e2330] rounded-full flex items-center">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={posSize}
                      onChange={(e) => setPosSize(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer m-0 p-0"
                    />
                    {/* Markers */}
                    <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                    <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                    <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                    <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                    <div className="absolute left-[100%] top-1/2 -translate-y-1/2 w-[3px] h-[8px] bg-slate-300 dark:bg-[#2a3040] pointer-events-none"></div>
                    
                    {/* Active Track */}
                    <div className="absolute left-0 top-0 bottom-0 bg-[#00A8E8] rounded-full z-10 pointer-events-none" style={{ width: `${posSize}%` }}></div>
                    
                    {/* Marker Label */}
                    <div className="absolute bottom-[12px] -translate-x-1/2 bg-[#00A8E8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] pointer-events-none z-20" style={{ left: `${posSize}%` }}>{posSize}%</div>
                    
                    {/* Thumb */}
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#00A8E8] rounded-full shadow-[0_0_10px_rgba(0,168,232,0.5)] border-[3px] border-white dark:border-[#0b0e14] z-20 pointer-events-none" style={{ left: `${posSize}%` }}></div>
                  </div>
                  <div className={`flex justify-between mt-3 text-[10px] font-bold ${textMuted}`}>
                    <span>0%</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="flex flex-col gap-3 text-[12px] font-semibold pb-4 px-1 mt-auto">
                  <div className="flex justify-between">
                    <span className={textMuted}>You will receive (Est.)</span>
                    <span className="text-[#00c076] font-bold">1,841.48 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={textMuted}>Estimated Price</span>
                    <span className={`${textMain}`}>0.08149 USDT</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className={textMuted}>Slippage Tolerance</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <span className={`${textMain}`}>0.50%</span>
                  </div>
                </div>

                {/* CTA Button */}
                <button className="w-full bg-[#00c076] hover:bg-[#00ad6a] text-white font-bold py-3.5 rounded-[8px] transition-colors text-[14px] shadow-sm">
                  Place Market Order
                </button>

              </div>
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
