import React, { useState } from 'react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [activeTradeMode, setActiveTradeMode] = useState<'Market' | 'Limit' | 'Trigger'>('Market');
  const [activeOrderTab, setActiveOrderTab] = useState<'Orders' | 'Positions' | 'Assets'>('Orders');
  const [sliderValue, setSliderValue] = useState(0);
  const [takeProfit, setTakeProfit] = useState(false);

  // Common colors
  const bgColor = theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#121620]' : 'bg-slate-50';
  const borderColor = theme === 'dark' ? 'border-[#1e2330]' : 'border-slate-200';
  const textMuted = theme === 'dark' ? 'text-[#808a9d]' : 'text-slate-500';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const greenColor = '#00c076';
  const redColor = '#ff5353';
  const primaryBlue = '#00a8e8';

  return (
    <div className={`w-full flex flex-col gap-4 font-sans ${textMain}`}>
      
      {/* TOP TRADING BAR */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-2xl p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f7931a] flex items-center justify-center text-white font-bold">₿</div>
            <div className="flex items-center gap-1 cursor-pointer">
              <span className="text-xl font-bold">BTC-USD</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#1e2330]"></div>

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

      {/* MAIN GRID */}
      {/* Structure: 3 columns. 
          Left: Chart + Orders Table
          Middle: Market Activity + Open Peer Orders
          Right: Trade Panel + Side Info Card
      */}
      <div className="grid grid-cols-[1fr_320px_350px] gap-4 items-start">
        
        {/* === LEFT COLUMN === */}
        <div className="flex flex-col gap-4 min-w-0">
          
          {/* Chart Area */}
          <div className={`${cardBg} border ${borderColor} rounded-2xl p-4 flex flex-col h-[550px]`}>
            {/* Toolbar */}
            <div className={`flex items-center justify-between pb-3 border-b ${borderColor} mb-3`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>1m</span>
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>5m</span>
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>15m</span>
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>1h</span>
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>4h</span>
                <span className={`text-sm cursor-pointer ${textMuted} hover:${textMain}`}>D</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
                
                <div className={`w-[1px] h-4 bg-[#1e2330] mx-1`}></div>
                
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
            <div className="flex-1 w-full bg-[#121620] relative rounded-lg overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 p-2 text-xs">
                <span className="text-[#808a9d]">Crypto BTC/USD</span>
                <span className="text-[#808a9d]">•</span>
                <span className="text-white">PYTH</span>
                <span style={{color: redColor}}>O 69965.52</span>
                <span style={{color: redColor}}>H 69981.03</span>
                <span style={{color: redColor}}>L 69831.50</span>
                <span style={{color: redColor}}>C 69907.09</span>
                <span style={{color: redColor}}>-58.23 (-0.09%)</span>
              </div>
              
              <div className="flex-1 w-full relative">
                 {/* Right Axis */}
                 <div className="absolute right-0 top-0 bottom-0 w-[80px] border-l border-[#1e2330] flex flex-col justify-between py-10 pr-2 items-end text-[10px] text-[#808a9d]">
                    <span>60000.0000</span>
                    <span>59800.0000</span>
                    <span>59600.0000</span>
                    <span>59400.0000</span>
                    <span className="bg-[#ff5353] text-white px-1 py-[2px] rounded w-full text-right my-1">59007.0000</span>
                    <span>59200.0000</span>
                    <span>59000.0000</span>
                    <span>58800.0000</span>
                    <span>58600.0000</span>
                    <span>58400.0000</span>
                 </div>
                 
                 {/* Bottom Axis */}
                 <div className="absolute left-0 right-[80px] bottom-0 h-[24px] border-t border-[#1e2330] flex items-center justify-between px-10 text-[10px] text-[#808a9d]">
                    <span>12:00</span>
                    <span>15:00</span>
                    <span>18:00</span>
                    <span>21:00</span>
                    <span>20</span>
                    <span>03:00</span>
                    <span>06:00</span>
                    <span>09</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 </div>
                 
                 {/* Simulated Candlesticks */}
                 <div className="absolute left-[50px] right-[100px] top-[40px] bottom-[50px] flex items-end opacity-70">
                    <svg width="100%" height="100%" preserveAspectRatio="none">
                      <polyline points="0,300 20,250 40,280 60,150 80,180 100,50 120,60 140,80 160,30 180,90 200,120 220,100 240,150 260,180 280,200 300,160 320,180" fill="none" stroke={greenColor} strokeWidth="2" />
                      <polyline points="320,180 340,220 360,200 380,250 400,280 420,210 440,250 460,290 480,270 500,240 520,320 540,280" fill="none" stroke={redColor} strokeWidth="2" />
                    </svg>
                 </div>
              </div>
            </div>
          </div>

          {/* Lower Left: Tabs Panel (Orders, Positions, Assets) */}
          <div className={`${cardBg} border ${borderColor} rounded-2xl flex flex-col h-[300px] overflow-hidden`}>
            {/* Tabs */}
            <div className={`flex items-center gap-6 px-6 pt-4 border-b ${borderColor}`}>
              {['Orders', 'Positions', 'Assets'].map((tab) => (
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
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
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
                <tbody className="divide-y divide-[#1e2330]">
                  {/* Row 1 */}
                  <tr className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-medium">BTC-USD</td>
                    <td className="py-3 px-4 text-[#808a9d]">Limit</td>
                    <td className="py-3 px-4 text-[#00c076] font-medium">Buy</td>
                    <td className="py-3 px-4 font-medium">0.2541 BTC</td>
                    <td className="py-3 px-4 font-medium">$69,500.00</td>
                    <td className="py-3 px-4"><span className="text-[#3b82f6] font-medium">Open</span></td>
                    <td className="py-3 px-4 flex justify-between items-center text-[#808a9d]">May 20, 16:02 <span className="opacity-0 group-hover:opacity-100 cursor-pointer">⋮</span></td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-medium">ETH-USD</td>
                    <td className="py-3 px-4 text-[#808a9d]">Limit</td>
                    <td className="py-3 px-4 text-[#ff5353] font-medium">Sell</td>
                    <td className="py-3 px-4 font-medium">2.0000 ETH</td>
                    <td className="py-3 px-4 font-medium">$3,400.00</td>
                    <td className="py-3 px-4"><span className="text-[#f59e0b] font-medium">Partially Filled</span></td>
                    <td className="py-3 px-4 flex justify-between items-center text-[#808a9d]">May 20, 15:48 <span className="opacity-0 group-hover:opacity-100 cursor-pointer">⋮</span></td>
                  </tr>
                  {/* Row 3 */}
                  <tr className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-medium">SOL-USD</td>
                    <td className="py-3 px-4 text-[#808a9d]">Limit</td>
                    <td className="py-3 px-4 text-[#00c076] font-medium">Buy</td>
                    <td className="py-3 px-4 font-medium">10.00 SOL</td>
                    <td className="py-3 px-4 font-medium">$160.00</td>
                    <td className="py-3 px-4"><span className="text-[#00c076] font-medium">Filled</span></td>
                    <td className="py-3 px-4 flex justify-between items-center text-[#808a9d]">May 20, 15:30 <span className="opacity-0 group-hover:opacity-100 cursor-pointer">⋮</span></td>
                  </tr>
                  {/* Row 4 */}
                  <tr className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-medium">BTC-USD</td>
                    <td className="py-3 px-4 text-[#808a9d]">Trigger</td>
                    <td className="py-3 px-4 text-[#ff5353] font-medium">Sell</td>
                    <td className="py-3 px-4 font-medium">0.1250 BTC</td>
                    <td className="py-3 px-4 font-medium">$68,000.00</td>
                    <td className="py-3 px-4"><span className="text-[#3b82f6] font-medium">Open</span></td>
                    <td className="py-3 px-4 flex justify-between items-center text-[#808a9d]">May 20, 15:10 <span className="opacity-0 group-hover:opacity-100 cursor-pointer">⋮</span></td>
                  </tr>
                  {/* Row 5 */}
                  <tr className="hover:bg-white/5 transition-colors group">
                    <td className="py-3 px-4 font-medium">ETH-USD</td>
                    <td className="py-3 px-4 text-[#808a9d]">Limit</td>
                    <td className="py-3 px-4 text-[#00c076] font-medium">Buy</td>
                    <td className="py-3 px-4 font-medium">1.2500 ETH</td>
                    <td className="py-3 px-4 font-medium">$3,200.00</td>
                    <td className="py-3 px-4"><span className="text-[#808a9d] font-medium">Cancelled</span></td>
                    <td className="py-3 px-4 flex justify-between items-center text-[#808a9d]">May 20, 14:55 <span className="opacity-0 group-hover:opacity-100 cursor-pointer">⋮</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className={`py-3 flex justify-center items-center text-xs text-[#3b82f6] cursor-pointer hover:text-white transition-colors border-t ${borderColor}`}>
              Show More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
        </div>

        {/* === MIDDLE COLUMN === */}
        <div className="flex flex-col gap-4">
          
          {/* Market Activity Panel */}
          <div className={`${cardBg} border ${borderColor} rounded-2xl flex flex-col h-[550px] overflow-hidden`}>
            <div className="p-4 pb-2 text-sm font-semibold">
              Market Activity
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
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
                    { p: "66,316.8903", s: "488.34K", t: "15:59", d: "down" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 cursor-pointer">
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

          {/* Lower Middle: Open Peer Orders */}
          <div className={`${cardBg} border ${borderColor} rounded-2xl flex flex-col h-[300px] overflow-hidden`}>
            
            <div className="flex items-center justify-between p-4 pb-2">
              <span className="text-sm font-semibold">Open Peer Orders</span>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 text-xs ${textMuted} bg-[#0b0e14] px-2 py-1 rounded cursor-pointer`}>
                  All Pairs <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div className={`flex items-center gap-1 text-xs ${textMuted} bg-[#0b0e14] px-2 py-1 rounded cursor-pointer`}>
                  All <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={textMuted}>
                    <th className="font-normal py-2 px-3">User</th>
                    <th className="font-normal py-2 px-3 text-right">Price (USD)</th>
                    <th className="font-normal py-2 px-3 text-right">Available</th>
                    <th className="font-normal py-2 px-3">Payment</th>
                    <th className="font-normal py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2330]">
                  {[
                    { initial: 'A', name: 'AlphaTrader', bg: 'bg-[#3b82f6]', stats: '98% | 312 trades', p: '70,552.25', a: '0.8452 BTC', pay: 'USDC', action: 'Buy' },
                    { initial: 'B', name: 'BlockWave', bg: 'bg-[#8b5cf6]', stats: '95% | 156 trades', p: '70,550.99', a: '1.2310 BTC', pay: 'USDT', action: 'Buy' },
                    { initial: 'C', name: 'CryptoKnight', bg: 'bg-[#10b981]', stats: '97% | 278 trades', p: '70,548.88', a: '0.5321 BTC', pay: 'USDC', action: 'Buy' },
                    { initial: 'D', name: 'DeFiMaster', bg: 'bg-[#f59e0b]', stats: '96% | 189 trades', p: '70,546.12', a: '0.9213 BTC', pay: 'USDT', action: 'Sell' },
                    { initial: 'E', name: 'HederaLover', bg: 'bg-[#a855f7]', stats: '94% | 134 trades', p: '70,545.01', a: '1.0010 BTC', pay: 'USDC', action: 'Buy' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-right font-medium">${row.p}</td>
                      <td className="py-2 px-3 text-right font-medium">{row.a}</td>
                      <td className="py-2 px-3 text-[#3b82f6] font-medium">{row.pay}</td>
                      <td className="py-2 px-3 text-right">
                        <button className={`text-[10px] font-bold px-3 py-1.5 rounded bg-transparent border ${row.action === 'Buy' ? 'border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10' : 'border-[#ff5353] text-[#ff5353] hover:bg-[#ff5353]/10'} transition-colors`}>
                          {row.action}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className={`py-3 flex justify-center items-center text-xs text-[#3b82f6] cursor-pointer hover:text-white transition-colors border-t ${borderColor}`}>
              View More Orders <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

        </div>

        {/* === RIGHT COLUMN === */}
        <div className="flex flex-col gap-4">
          
          {/* TRADE PANEL (MOST IMPORTANT) */}
          <div className={`${cardBg} border ${borderColor} rounded-2xl flex flex-col`}>
            
            {/* Header: Slippage */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-[#1e2330]">
              <span className={`text-xs ${textMuted}`}>Slippage 0.3%</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cursor-pointer hover:stroke-white"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </div>

            {/* Long / Short Tabs */}
            <div className="p-4 pb-2">
              <div className="flex bg-[#0b0e14] rounded-xl p-1 relative w-full h-11 items-center font-semibold text-sm">
                 <div className="flex-1 text-center text-black z-10 cursor-pointer h-full flex items-center justify-center">Long</div>
                 <div className={`flex-1 text-center ${textMuted} hover:text-white z-10 cursor-pointer h-full flex items-center justify-center`}>Short</div>
                 <div className="absolute left-1 top-1 bottom-1 w-[calc(50%-4px)] bg-[#86efac] rounded-lg shadow-sm transition-all"></div>
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
                  {/* Pay Input Section (WIDE INPUT BOX AS REQUESTED) */}
                  <div className="w-full bg-[#0b0e14] border border-[#1e2330] rounded-xl p-3 mb-4 focus-within:border-[#3b82f6] transition-colors group flex flex-col">
                    <div className="flex items-center gap-1 mb-1">
                      <span className={`text-xs ${textMuted}`}>Pay</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      {/* VERY WIDE INPUT FIELD */}
                      <input 
                        type="text" 
                        value="0.0" 
                        readOnly
                        className="bg-transparent text-white text-2xl font-semibold outline-none w-[70%] min-w-0" 
                      />
                      
                      {/* TOKEN SELECTOR */}
                      <div className="flex items-center gap-2 bg-[#1e2330] hover:bg-[#2a3040] transition-colors rounded-full px-3 py-1.5 cursor-pointer shrink-0">
                        <div className="w-5 h-5 bg-[#2775ca] rounded-full flex items-center justify-center">
                           <span className="text-white text-[10px] font-bold">$</span>
                        </div>
                        <span className="text-sm font-medium">USDC</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </div>
                    </div>
                  </div>

                  {/* Balance Info */}
                  <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className={textMuted}>You Can</span>
                      <span className={textMuted}>Available <span className="text-white">0.00</span></span>
                    </div>
                    <span className="text-sm font-semibold">$1,000.00</span>
                  </div>

                  {/* Slider */}
                  <div className="mb-6 px-1">
                    <div className="relative w-full h-1 bg-[#1e2330] rounded-full flex items-center">
                      <div className="absolute left-0 h-1 bg-[#3b82f6] rounded-full" style={{ width: '15%' }}></div>
                      <div className="absolute left-[15%] w-3 h-3 bg-[#3b82f6] rounded-full shadow-lg transform -translate-x-1/2 cursor-pointer"></div>
                      
                      {/* Tick Marks */}
                      <div className="absolute w-full flex justify-between px-[2px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1e2330]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1e2330]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1e2330]"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1e2330]"></div>
                      </div>
                    </div>
                    <div className={`flex justify-between w-full text-[10px] ${textMuted} mt-3 px-[2px]`}>
                       <span className="opacity-0">0%</span>
                       <span>25%</span>
                       <span>50%</span>
                       <span>75%</span>
                       <span>100%</span>
                    </div>
                  </div>

                  {/* Take Profit Toggle */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`flex items-center gap-1 text-sm ${textMuted} cursor-pointer hover:text-white transition-colors`}>
                      Take Profit / Stop Loss
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    {/* Toggle Switch */}
                    <div 
                      className={`w-9 h-5 rounded-full p-[2px] cursor-pointer transition-colors ${takeProfit ? 'bg-[#3b82f6]' : 'bg-[#1e2330]'}`}
                      onClick={() => setTakeProfit(!takeProfit)}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${takeProfit ? 'translate-x-4' : 'translate-x-0'}`}></div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button className="w-full bg-gradient-to-r from-[#4f46e5] to-[#9333ea] hover:opacity-90 text-white font-bold py-3.5 rounded-xl transition-opacity mb-6 text-sm shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                    Connect Wallet
                  </button>

                  {/* Info Section */}
                  <div className="flex flex-col gap-3 text-xs">
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
                    <div className="flex justify-between">
                      <span className={textMuted}>Liq. Price</span>
                      <span className="font-medium">-</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Est. Liquidation Price</span>
                      <span className="font-medium">-</span>
                    </div>
                  </div>
                </>
              ) : (
                /* EMPTY STATE FOR LIMIT / TRIGGER */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e2330" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  <p className={`text-sm ${textMuted}`}>Not available in {activeTradeMode} mode.</p>
                  <p className={`text-xs ${textMuted} mt-1`}>Switch to Market to trade.</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info Block for Long BTC */}
          {activeTradeMode === 'Market' && (
            <div className={`${cardBg} border ${borderColor} rounded-2xl p-4 flex flex-col gap-3 text-xs`}>
              <span className="font-semibold text-sm mb-1">Long BTC</span>
              <div className="flex justify-between">
                <span className={textMuted}>Entry Price</span>
                <span className="font-medium">$69,245.6704</span>
              </div>
              <div className="flex justify-between">
                <span className={textMuted}>Mark Price</span>
                <span className="font-medium">$70,552.2546</span>
              </div>
              <div className="flex justify-between">
                <span className={textMuted}>Est. Liq. Price</span>
                <span className="font-medium">$68,382.4501</span>
              </div>
            </div>
          )}

          {/* Side Info Card (Trade with confidence) */}
          <div className="bg-gradient-to-br from-[#1e1b2e] to-[#12101a] border border-[#2d2442] rounded-2xl p-5 flex items-center justify-between shadow-lg">
            <div className="flex flex-col max-w-[200px]">
              <span className="font-bold mb-2 text-sm text-white">Trade with confidence</span>
              <span className={`text-xs text-[#a59eb8] leading-relaxed`}>Low fees, deep liquidity, and best execution.</span>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
