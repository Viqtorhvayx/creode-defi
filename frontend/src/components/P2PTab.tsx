import React, { useState } from 'react';
import { 
  CaretDown, 
  Info, 
  ArrowsDownUp,
  Faders,
  CheckCircle,
  MagnifyingGlass
} from '@phosphor-icons/react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [tradeType, setTradeType] = useState<'Buy' | 'Sell'>('Buy');
  const [bottomTab, setBottomTab] = useState<'Orders' | 'Positions' | 'Assets'>('Orders');

  const cardStyle = "bg-white dark:bg-[#1A1A24] rounded-2xl p-6 border border-[#EAECEF] dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] dark:shadow-none";

  const peerOrders = [
    { id: 1, user: 'AlphaTrader', avatar: 'A', bgColor: 'bg-[#3B82F6]', verified: true, stats: '98% | 312 trades', price: '0.07856', usdPrice: '$0.07856', available: '2,500 HBAR', usdAvailable: '$196.40', payment: ['USDC'], action: 'Buy' },
    { id: 2, user: 'BlockWave', avatar: 'B', bgColor: 'bg-[#8B5CF6]', verified: true, stats: '95% | 156 trades', price: '0.07860', usdPrice: '$0.07860', available: '1,800 HBAR', usdAvailable: '$141.20', payment: ['USDT'], action: 'Buy' },
    { id: 3, user: 'CryptoKnight', avatar: 'C', bgColor: 'bg-[#10B981]', verified: true, stats: '97% | 278 trades', price: '0.07848', usdPrice: '$0.07848', available: '3,200 HBAR', usdAvailable: '$250.34', payment: ['USDC'], action: 'Buy' },
    { id: 4, user: 'DeFiMaster', avatar: 'D', bgColor: 'bg-[#F59E0B]', verified: true, stats: '96% | 189 trades', price: '0.07862', usdPrice: '$0.07862', available: '2,000 HBAR', usdAvailable: '$156.24', payment: ['USDT'], action: 'Sell' },
    { id: 5, user: 'HederaLover', avatar: 'E', bgColor: 'bg-[#6366F1]', verified: true, stats: '94% | 134 trades', price: '0.07846', usdPrice: '$0.07846', available: '1,500 HBAR', usdAvailable: '$117.69', payment: ['USDC'], action: 'Buy' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-[#0F172A] dark:text-white pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pl-1">
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <h1 className="text-2xl font-bold tracking-tight">HBAR/USDT</h1>
          <CaretDown size={20} weight="bold" className="text-slate-500" />
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_260px_1fr] gap-6 mb-6">
        
        {/* 1. Left Panel: Order Creation */}
        <div className={cardStyle}>
          {/* Buy / Sell Toggle */}
          <div className="flex items-center bg-slate-50 dark:bg-white/5 rounded-lg p-1.5 mb-6 border border-slate-100 dark:border-transparent">
            <button 
              onClick={() => setTradeType('Buy')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                tradeType === 'Buy' 
                  ? 'bg-[#16C784] text-white shadow-sm' 
                  : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Buy
            </button>
            <button 
              onClick={() => setTradeType('Sell')}
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${
                tradeType === 'Sell' 
                  ? 'bg-[#EA3943] text-white shadow-sm' 
                  : 'text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-6">
            {/* Trading Mode */}
            <div>
              <label className="text-[13px] font-semibold text-slate-600 dark:text-white/60 mb-2 block">Trading Mode</label>
              <div className="flex items-center justify-between border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-3 cursor-pointer hover:border-[#3B82F6] transition-colors">
                <span className="text-sm font-semibold">Custom Price</span>
                <CaretDown size={16} className="text-slate-400" />
              </div>
            </div>

            {/* Order Value */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-[13px] font-semibold text-slate-600 dark:text-white/60">Order Value (USDT)</label>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="flex items-center border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-3 focus-within:border-[#3B82F6] transition-colors">
                <input 
                  type="text" 
                  defaultValue="100" 
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2 pl-3 border-l border-[#EAECEF] dark:border-white/10">
                  <div className="w-5 h-5 rounded-full bg-[#26A17B] flex items-center justify-center text-white text-[10px] font-bold">T</div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white/90">USDT</span>
                </div>
              </div>
              <div className="text-[12px] text-slate-500 dark:text-white/50 mt-2 font-medium">
                Available: 1,250.75 USDT
              </div>
            </div>

            {/* Target Price */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <label className="text-[13px] font-semibold text-slate-600 dark:text-white/60">Target Price (USDT)</label>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="flex items-center border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-3 focus-within:border-[#3B82F6] transition-colors bg-slate-50/50 dark:bg-white/5">
                <input 
                  type="text" 
                  defaultValue="0.07849" 
                  className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2 pl-3 border-l border-[#EAECEF] dark:border-white/10">
                  <div className="w-5 h-5 rounded-full bg-[#26A17B] flex items-center justify-center text-white text-[10px] font-bold opacity-80">T</div>
                  <span className="text-sm font-bold text-slate-500 dark:text-white/60">USDT</span>
                </div>
              </div>
              <div className="text-[12px] text-slate-500 dark:text-white/50 mt-2 font-medium">
                ≈ $0.07849 per HBAR
              </div>
            </div>

            {/* Order Capacity */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-5">
                <label className="text-[13px] font-semibold text-slate-600 dark:text-white/60">Order Capacity</label>
                <Info size={14} className="text-slate-400" />
              </div>
              <div className="relative h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mb-8">
                <div className="absolute left-0 top-0 h-full w-[25%] bg-[#3B82F6] rounded-full"></div>
                <div className="absolute left-[25%] top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-[#3B82F6] rounded-full ring-4 ring-white dark:ring-[#1A1A24] cursor-pointer shadow-sm"></div>
                
                {/* Markers */}
                <div className="absolute left-0 top-4 text-[11px] text-[#3B82F6] font-semibold -translate-x-1/2">0%</div>
                <div className="absolute left-[25%] top-4 text-[11px] text-slate-400 font-medium -translate-x-1/2">25%</div>
                <div className="absolute left-[50%] top-4 text-[11px] text-slate-400 font-medium -translate-x-1/2">50%</div>
                <div className="absolute left-[75%] top-4 text-[11px] text-slate-400 font-medium -translate-x-1/2">75%</div>
                <div className="absolute left-[100%] top-4 text-[11px] text-slate-400 font-medium -translate-x-1/2">100%</div>
              </div>
            </div>

            <button className={`w-full py-3.5 rounded-xl text-[15px] font-bold text-white shadow-sm hover:opacity-90 transition-opacity mt-2 ${
              tradeType === 'Buy' ? 'bg-[#16C784]' : 'bg-[#EA3943]'
            }`}>
              Place P2P Order
            </button>
          </div>
        </div>

        {/* 2. Middle Panel: Order Book */}
        <div className={`${cardStyle} flex flex-col`}>
          <div className="flex justify-between text-[12px] font-semibold text-slate-500 dark:text-white/50 mb-5 px-1">
            <span>Price (USDT)</span>
            <span>Qty (HBAR)</span>
          </div>

          {/* Sells */}
          <div className="flex flex-col gap-3 mb-5">
            {[
              ['0.07858', '6.569K'],
              ['0.07857', '1.773K'],
              ['0.07856', '1.725K'],
              ['0.07855', '5.840K'],
              ['0.07854', '4.663K'],
              ['0.07853', '9.231K'],
              ['0.07852', '36.30K'],
            ].map(([price, qty], i) => (
              <div key={i} className="flex justify-between text-[13px] font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-[#EA3943]">{price}</span>
                <span className="text-slate-700 dark:text-white/80">{qty}</span>
              </div>
            ))}
          </div>

          {/* Current Price */}
          <div className="py-3.5 border-y border-[#EAECEF] dark:border-white/10 flex items-center justify-between mb-5">
            <div>
              <div className="text-[22px] font-bold leading-tight text-slate-900 dark:text-white">0.07849</div>
              <div className="text-[12px] font-medium text-slate-500 dark:text-white/50 mt-0.5">≈ $0.078 USD</div>
            </div>
            <ArrowsDownUp size={18} className="text-slate-400" />
          </div>

          {/* Buys */}
          <div className="flex flex-col gap-3 mb-auto">
            {[
              ['0.07848', '57.26K'],
              ['0.07847', '12.84K'],
              ['0.07846', '8.91K'],
              ['0.07845', '7.12K'],
              ['0.07844', '3.45K'],
              ['0.07843', '2.11K'],
              ['0.07842', '1.02K'],
            ].map(([price, qty], i) => (
              <div key={i} className="flex justify-between text-[13px] font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 px-1 py-0.5 rounded transition-colors">
                <span className="text-[#16C784]">{price}</span>
                <span className="text-slate-700 dark:text-white/80">{qty}</span>
              </div>
            ))}
          </div>

          {/* Sentiment Bar */}
          <div className="mt-5 pt-5 border-t border-[#EAECEF] dark:border-white/10">
            <div className="flex justify-between text-[11px] font-bold mb-2 px-1">
              <span className="text-[#16C784] flex items-center gap-1.5"><div className="border border-[#16C784] px-1 rounded-[4px] text-[9px] leading-tight py-[1px]">B</div> 56%</span>
              <span className="text-[#EA3943] flex items-center gap-1.5">44% <div className="border border-[#EA3943] px-1 rounded-[4px] text-[9px] leading-tight py-[1px]">S</div></span>
            </div>
            <div className="h-1.5 w-full flex rounded-full overflow-hidden">
              <div className="h-full bg-[#16C784] w-[56%]"></div>
              <div className="h-full bg-[#EA3943] w-[44%]"></div>
            </div>
          </div>
        </div>

        {/* 3. Right Panel: Open Peer Orders */}
        <div className={cardStyle}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Open Peer Orders</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white dark:bg-transparent border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none">
                <span className="text-[13px] font-semibold text-slate-700 dark:text-white/90">All Pairs</span>
                <CaretDown size={14} className="text-slate-500" />
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-transparent border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors shadow-sm dark:shadow-none">
                <Faders size={14} className="text-slate-500" />
                <span className="text-[13px] font-semibold text-slate-700 dark:text-white/90">All</span>
                <CaretDown size={14} className="text-slate-500" />
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[12px] text-slate-500 dark:text-white/50 border-b border-[#EAECEF] dark:border-white/10">
                  <th className="pb-4 font-semibold pr-4 whitespace-nowrap">User</th>
                  <th className="pb-4 font-semibold px-4 whitespace-nowrap">Price (USDT)</th>
                  <th className="pb-4 font-semibold px-4 whitespace-nowrap">Available (HBAR)</th>
                  <th className="pb-4 font-semibold px-4 whitespace-nowrap">Payment</th>
                  <th className="pb-4 font-semibold pl-4 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {peerOrders.map((order, idx) => (
                  <tr key={order.id} className="border-b border-[#EAECEF] dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[15px] ${order.bgColor} shrink-0 shadow-sm`}>
                          {order.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[14px] font-bold text-slate-900 dark:text-white">{order.user}</span>
                            {order.verified && <CheckCircle size={15} weight="fill" className="text-[#3B82F6]" />}
                          </div>
                          <div className="text-[12px] text-slate-500 dark:text-white/50 font-medium">{order.stats}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[14px] font-bold text-slate-900 dark:text-white mb-0.5">{order.price}</div>
                      <div className="text-[12px] text-slate-500 dark:text-white/50 font-medium">{order.usdPrice}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-[14px] font-bold text-slate-900 dark:text-white mb-0.5">{order.available}</div>
                      <div className="text-[12px] text-slate-500 dark:text-white/50 font-medium">{order.usdAvailable}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1.5">
                        {order.payment.map((pay, i) => (
                          <div key={i} className="text-[11px] font-bold px-2 py-1 bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80 rounded flex items-center justify-center">
                            {pay}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button className={`px-5 py-2 rounded-lg text-[13px] font-bold transition-all shadow-sm group-hover:shadow ${
                        order.action === 'Buy' 
                          ? 'text-[#3B82F6] border border-[#3B82F6] hover:bg-[#3B82F6] hover:text-white' 
                          : 'text-[#EA3943] border border-[#EA3943] hover:bg-[#EA3943] hover:text-white'
                      }`}>
                        {order.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 pt-2 flex justify-center">
            <button className="flex items-center gap-1.5 text-[#3B82F6] text-[13px] font-bold hover:opacity-80 transition-opacity">
              View More Orders
              <CaretDown size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section */}
      <div className={cardStyle}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAECEF] dark:border-white/10 pb-[18px]">
          <div className="flex gap-8 px-2">
            {['Orders', 'Positions', 'Assets'].map(tab => (
              <button 
                key={tab}
                onClick={() => setBottomTab(tab as any)}
                className={`text-[14px] font-bold pb-[18px] -mb-[18px] relative transition-colors ${
                  bottomTab === tab 
                    ? 'text-[#3B82F6]' 
                    : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
                {bottomTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#3B82F6] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-6 pr-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-[18px] h-[18px] rounded-[4px] border border-slate-300 dark:border-white/20 flex items-center justify-center group-hover:border-[#3B82F6] transition-colors bg-white dark:bg-transparent shadow-sm dark:shadow-none">
                {/* Empty checkbox */}
              </div>
              <span className="text-[13px] font-semibold text-slate-600 dark:text-white/70 select-none">Show only my orders</span>
            </label>
            <div className="flex items-center justify-between border border-[#EAECEF] dark:border-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors min-w-[130px] bg-white dark:bg-transparent shadow-sm dark:shadow-none">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-white/90">All Markets</span>
              <CaretDown size={14} className="text-slate-500" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-[72px] h-[72px] bg-blue-50 dark:bg-[#3B82F6]/10 rounded-full flex items-center justify-center mb-5 text-[#3B82F6]">
            <MagnifyingGlass size={36} weight="duotone" />
          </div>
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-1.5">No Orders Yet</h3>
          <p className="text-[13px] font-medium text-slate-500 dark:text-white/50 mb-6">You haven't placed any P2P orders.</p>
          <button className="px-6 py-2.5 bg-[#3B82F6] text-white text-[14px] font-bold rounded-lg shadow-sm hover:bg-[#2563EB] transition-colors">
            Create Your First Order
          </button>
        </div>
      </div>
    </div>
  );
};
