import React, { useState } from 'react';
import { PriceChart } from './PriceChart';
import { 
  CaretDown, 
  Info, 
  ArrowsDownUp,
  Faders,
  CheckCircle,
  MagnifyingGlass,
  Star,
  ArrowLeft,
  Plus,
  ShieldCheck,
  DotsThree
} from '@phosphor-icons/react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
  const [tradeType, setTradeType] = useState<'Long' | 'Short'>('Long');
  const [orderMode, setOrderMode] = useState<'Market' | 'Limit' | 'Trigger'>('Market');
  const [bottomTab, setBottomTab] = useState<'Orders' | 'Positions' | 'Assets'>('Orders');
  const [sliderValue, setSliderValue] = useState(0);

  const cardStyle = "bg-[#0B0E14] rounded-2xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-white/5";

  const peerOrders = [
    { id: 1, user: 'AlphaTrader', avatar: 'A', bgColor: 'bg-[#00A8E8]', verified: true, stats: '98% | 312 trades', price: '$70,552.25', available: '0.8452 BTC', payment: ['USDC'], action: 'Buy' },
    { id: 2, user: 'BlockWave', avatar: 'B', bgColor: 'bg-[#8B5CF6]', verified: true, stats: '95% | 156 trades', price: '$70,550.99', available: '1.2310 BTC', payment: ['USDT'], action: 'Buy' },
    { id: 3, user: 'CryptoKnight', avatar: 'C', bgColor: 'bg-[#10B981]', verified: true, stats: '97% | 278 trades', price: '$70,548.88', available: '0.5321 BTC', payment: ['USDC'], action: 'Buy' },
    { id: 4, user: 'DeFiMaster', avatar: 'D', bgColor: 'bg-[#F59E0B]', verified: true, stats: '96% | 189 trades', price: '$70,546.12', available: '0.9213 BTC', payment: ['USDT'], action: 'Sell' },
    { id: 5, user: 'HederaLover', avatar: 'H', bgColor: 'bg-[#8B5CF6]', verified: true, stats: '94% | 134 trades', price: '$70,545.01', available: '1.0010 BTC', payment: ['USDC'], action: 'Buy' },
  ];

  const recentTrades = [
    { price: '$70,552.2546', size: '214.34K', time: '16:02', dir: 'up' },
    { price: '$70,550.9912', size: '440.09K', time: '16:02', dir: 'up' },
    { price: '$66,316.8903', size: '488.34K', time: '15:59', dir: 'down' },
    { price: '$70,663.2215', size: '160.56K', time: '15:58', dir: 'down' },
    { price: '$70,672.1923', size: '504.21K', time: '15:58', dir: 'down' },
    { price: '$70,671.5985', size: '906.09K', time: '15:57', dir: 'down' },
    { price: '$69,148.5503', size: '724.99K', time: '15:56', dir: 'down' },
    { price: '$66,600.2311', size: '691.14K', time: '15:54', dir: 'up' },
    { price: '$70,765.4978', size: '279.83K', time: '15:54', dir: 'down' },
    { price: '$69,167.3710', size: '695.45K', time: '15:53', dir: 'up' },
    { price: '$63,291.2986', size: '188.04K', time: '15:53', dir: 'down' },
  ];

  return (
    <div className="w-full h-full flex flex-col text-white pb-10 bg-[#06080A] min-h-screen pt-4 px-2">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center gap-3 mb-6">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1A1E24] hover:bg-[#2A2E34] transition-colors rounded-full text-sm font-semibold text-white/80">
          <ArrowLeft size={16} weight="bold" />
          Back
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] transition-colors rounded-full text-sm font-bold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Plus size={16} weight="bold" />
          Add Asset Pair
        </button>
      </div>

      {/* Header Stats Strip */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-8 min-w-max">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity pr-4">
            <span className="text-[24px] font-bold text-[#F7931A]">₿</span>
            <h1 className="text-[22px] font-bold tracking-tight text-white">BTC-USD</h1>
            <CaretDown size={18} weight="bold" className="text-white/50" />
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-white/40 mb-0.5">Mark Price</span>
            <span className="text-[16px] font-bold text-white">$70,552.2546</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-white/40 mb-0.5">24h Change</span>
            <span className="text-[14px] font-bold text-[#16C784]">+19.28%</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-white/40 mb-0.5">24h Vol</span>
            <span className="text-[14px] font-bold text-white">$391.41</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-white/40 mb-0.5">Open Interest <span className="text-white/60">68%/32%</span></span>
            <span className="text-[14px] font-bold text-white">$173.56 M / $260.59 M</span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-white/40 mb-0.5">Funding / 1h</span>
            <span className="text-[14px] font-bold text-white"><span className="text-[#16C784]">~0.0024%</span> <span className="text-[#EA3943]">~-0.0253%</span></span>
          </div>
        </div>
        
        <div className="pl-6 flex shrink-0">
          <Star size={24} weight="regular" className="text-white/30 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      {/* Main Grid: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_320px] gap-4 mb-4 h-[600px]">
        
        {/* Col 1: Chart */}
        <div className={cardStyle + " p-0 overflow-hidden flex flex-col"}>
          <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[#0B0E14]">
            <div className="flex items-center gap-3 text-[12px] font-semibold text-white/50">
              <span className="text-white cursor-pointer hover:opacity-80">1m</span>
              <span className="cursor-pointer hover:text-white">5m</span>
              <span className="cursor-pointer hover:text-white">15m</span>
              <span className="cursor-pointer hover:text-white">1h</span>
              <span className="cursor-pointer hover:text-white">4h</span>
              <span className="cursor-pointer hover:text-white">D</span>
              <CaretDown size={12} weight="bold" />
            </div>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-white/70 cursor-pointer hover:text-white">
              <Faders size={14} /> Indicators
            </div>
          </div>
          <div className="flex-1 relative">
            <PriceChart theme={theme} />
          </div>
        </div>

        {/* Col 2: Market Activity */}
        <div className={cardStyle + " flex flex-col"}>
          <h3 className="text-[13px] font-semibold text-white/80 mb-4">Market Activity</h3>
          <div className="flex justify-between text-[11px] font-semibold text-white/40 mb-3 px-1">
            <span>Price (USD)</span>
            <span>Size (BTC)</span>
            <span>Time</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
            {recentTrades.map((trade, i) => (
              <div key={i} className="flex justify-between items-center text-[12px] font-medium font-mono">
                <span className={trade.dir === 'up' ? 'text-[#16C784]' : 'text-[#EA3943]'}>
                  {trade.price} {trade.dir === 'up' ? '↑' : '↓'}
                </span>
                <span className="text-white">{trade.size}</span>
                <span className="text-white/40">{trade.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Order Panel */}
        <div className={cardStyle + " flex flex-col"}>
          <div className="flex justify-between items-center mb-5">
            <span className="text-[12px] font-semibold text-white/50">Slippage 0.3%</span>
            <ArrowsDownUp size={14} className="text-white/50 cursor-pointer hover:text-white" />
          </div>

          <div className="flex bg-[#12161E] rounded-xl p-1 mb-5">
            <button 
              onClick={() => setTradeType('Long')}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
                tradeType === 'Long' ? 'bg-[#16C784] text-black shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Long
            </button>
            <button 
              onClick={() => setTradeType('Short')}
              className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all ${
                tradeType === 'Short' ? 'bg-[#EA3943] text-white shadow-sm' : 'text-white/50 hover:text-white'
              }`}
            >
              Short
            </button>
          </div>

          <div className="flex gap-4 border-b border-white/5 mb-6">
            {['Market', 'Limit', 'Trigger'].map(tab => (
              <button 
                key={tab}
                onClick={() => setOrderMode(tab as any)}
                className={`pb-3 text-[13px] font-semibold relative ${
                  orderMode === tab ? 'text-white' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {tab}
                {orderMode === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6366F1] rounded-t-full"></div>}
              </button>
            ))}
          </div>

          {/* Pay Input Block */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 mb-2 pl-1">
              <span className="text-[13px] font-medium text-white/60">Pay</span>
              <Info size={14} className="text-white/40" />
            </div>
            <div className="relative bg-[#1A1E24] rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-white/10 transition-colors focus-within:border-[#6366F1]/50">
              <input 
                type="text" 
                placeholder="0.0" 
                className="bg-transparent text-[24px] font-medium text-white outline-none w-full placeholder:text-white/20"
              />
              <div className="flex items-center gap-2 bg-[#2A2E34] rounded-full pl-2 pr-3 py-1.5 ml-3 shrink-0 cursor-pointer hover:bg-[#32363C] transition-colors">
                <div className="w-5 h-5 bg-[#2775CA] rounded-full flex items-center justify-center text-white text-[10px] font-bold">U</div>
                <span className="text-[13px] font-bold">USDC</span>
                <CaretDown size={12} weight="bold" className="text-white/60" />
              </div>
            </div>
          </div>

          <div className="flex flex-col mb-8 px-1">
            <span className="text-[12px] text-white/40 font-medium mb-1">You Can</span>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-white/40 font-medium">Available 0.00</span>
              <span className="text-[13px] font-bold text-white">$1,000.00</span>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-8 px-1">
            <div className="relative w-full h-1 bg-white/10 rounded-full mb-3 cursor-pointer">
              <div className="absolute left-0 top-0 h-full bg-[#6366F1] rounded-full" style={{width: `${sliderValue}%`}}></div>
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#6366F1] rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{left: `${sliderValue}%`, transform: 'translate(-50%, -50%)'}}></div>
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-white/30">
              <span className="cursor-pointer hover:text-white" onClick={() => setSliderValue(25)}>25%</span>
              <span className="cursor-pointer hover:text-white" onClick={() => setSliderValue(50)}>50%</span>
              <span className="cursor-pointer hover:text-white" onClick={() => setSliderValue(75)}>75%</span>
              <span className="cursor-pointer hover:text-white" onClick={() => setSliderValue(100)}>100%</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <span className="text-[12px] font-semibold text-white/60 flex items-center gap-1">Take Profit / Stop Loss <CaretDown size={12}/></span>
            <div className="w-8 h-4 bg-white/10 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-0.5 w-3 h-3 bg-white/40 rounded-full"></div>
            </div>
          </div>

          <button className="w-full py-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white font-bold rounded-xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all">
            Connect Wallet
          </button>

          <div className="mt-auto space-y-2 text-[12px] font-medium text-white/40 px-1">
            <div className="flex justify-between"><span className="border-b border-dashed border-white/20 pb-0.5">Open Fee</span><span className="text-white/80">US$0</span></div>
            <div className="flex justify-between"><span className="border-b border-dashed border-white/20 pb-0.5">Collateral In</span><span className="text-white/80">USDC</span></div>
            <div className="flex justify-between"><span className="border-b border-dashed border-white/20 pb-0.5">Leverage</span><span className="text-white/80">-</span></div>
            <div className="flex justify-between"><span className="border-b border-dashed border-white/20 pb-0.5">Liq. Price</span><span className="text-white/80">-</span></div>
            <div className="flex justify-between"><span className="border-b border-dashed border-white/20 pb-0.5">Est. Liquidation Price</span><span className="text-white/80">-</span></div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: 3 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px_320px] gap-4">
        
        {/* Bottom Col 1: Orders / Positions */}
        <div className={cardStyle + " flex flex-col p-0"}>
          <div className="flex gap-6 border-b border-white/5 px-4 pt-2">
            {['Orders', 'Positions', 'Assets'].map(tab => (
              <button 
                key={tab}
                onClick={() => setBottomTab(tab as any)}
                className={`pb-3 text-[13px] font-semibold relative ${
                  bottomTab === tab ? 'text-[#6366F1]' : 'text-white/40 hover:text-white'
                }`}
              >
                {tab}
                {bottomTab === tab && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#6366F1] rounded-t-full"></div>}
              </button>
            ))}
          </div>
          <div className="p-4 w-full overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-semibold text-white/30 border-b border-white/5">
                  <th className="pb-3 w-[15%]">Pair</th>
                  <th className="pb-3 w-[15%]">Type</th>
                  <th className="pb-3 w-[15%]">Side</th>
                  <th className="pb-3 w-[15%]">Amount</th>
                  <th className="pb-3 w-[15%]">Price</th>
                  <th className="pb-3 w-[15%]">Status</th>
                  <th className="pb-3 w-[10%] whitespace-nowrap">Created</th>
                </tr>
              </thead>
              <tbody className="text-[12px] font-medium text-white/80">
                <tr className="border-b border-white/5">
                  <td className="py-4 font-bold text-white">BTC-USD</td>
                  <td className="py-4">Limit</td>
                  <td className="py-4"><span className="text-[#16C784]">Buy</span></td>
                  <td className="py-4">0.2541 BTC</td>
                  <td className="py-4">$69,500.00</td>
                  <td className="py-4"><span className="text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded text-[10px]">Open</span></td>
                  <td className="py-4 text-white/40 flex items-center justify-between">May 20, 16:02 <DotsThree size={16} className="cursor-pointer" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 font-bold text-white">ETH-USD</td>
                  <td className="py-4">Limit</td>
                  <td className="py-4"><span className="text-[#EA3943]">Sell</span></td>
                  <td className="py-4">2.0000 ETH</td>
                  <td className="py-4">$3,400.00</td>
                  <td className="py-4"><span className="text-[#F59E0B] border border-[#F59E0B]/30 px-2 py-0.5 rounded text-[10px]">Partially Filled</span></td>
                  <td className="py-4 text-white/40 flex items-center justify-between">May 20, 15:48 <DotsThree size={16} className="cursor-pointer" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 font-bold text-white">SOL-USD</td>
                  <td className="py-4">Limit</td>
                  <td className="py-4"><span className="text-[#16C784]">Buy</span></td>
                  <td className="py-4">10.00 SOL</td>
                  <td className="py-4">$160.00</td>
                  <td className="py-4"><span className="text-[#16C784] border border-[#16C784]/30 px-2 py-0.5 rounded text-[10px]">Filled</span></td>
                  <td className="py-4 text-white/40 flex items-center justify-between">May 20, 15:30 <DotsThree size={16} className="cursor-pointer" /></td>
                </tr>
                <tr className="border-b border-white/5">
                  <td className="py-4 font-bold text-white">BTC-USD</td>
                  <td className="py-4">Trigger</td>
                  <td className="py-4"><span className="text-[#EA3943]">Sell</span></td>
                  <td className="py-4">0.1250 BTC</td>
                  <td className="py-4">$68,000.00</td>
                  <td className="py-4"><span className="text-[#3B82F6] border border-[#3B82F6]/30 px-2 py-0.5 rounded text-[10px]">Open</span></td>
                  <td className="py-4 text-white/40 flex items-center justify-between">May 20, 15:10 <DotsThree size={16} className="cursor-pointer" /></td>
                </tr>
                <tr>
                  <td className="py-4 font-bold text-white">ETH-USD</td>
                  <td className="py-4">Limit</td>
                  <td className="py-4"><span className="text-[#16C784]">Buy</span></td>
                  <td className="py-4">1.2500 ETH</td>
                  <td className="py-4">$3,200.00</td>
                  <td className="py-4"><span className="text-white/40 border border-white/20 px-2 py-0.5 rounded text-[10px]">Cancelled</span></td>
                  <td className="py-4 text-white/40 flex items-center justify-between">May 20, 14:55 <DotsThree size={16} className="cursor-pointer" /></td>
                </tr>
              </tbody>
            </table>
            <div className="mt-2 pt-4 flex justify-center border-t border-white/5">
              <button className="flex items-center gap-1.5 text-[#6366F1] text-[12px] font-bold hover:opacity-80 transition-opacity">
                Show More
                <CaretDown size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Col 2: Open Peer Orders */}
        <div className={cardStyle + " flex flex-col p-0"}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-[13px] font-semibold text-white/90">Open Peer Orders</h3>
            <div className="flex gap-3">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-white/60 cursor-pointer hover:text-white">All Pairs <CaretDown size={12}/></span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-white/60 cursor-pointer hover:text-white">All <CaretDown size={12}/></span>
            </div>
          </div>
          <div className="p-4 w-full overflow-x-auto flex-1 flex flex-col">
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="text-[11px] font-semibold text-white/30 border-b border-white/5">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Price (USD)</th>
                  <th className="pb-3">Available</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody className="text-[11px] font-medium text-white/80">
                {peerOrders.map(order => (
                  <tr key={order.id} className="border-b border-white/5 last:border-0 group">
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${order.bgColor} text-white shrink-0`}>{order.avatar}</div>
                        <div>
                          <div className="flex items-center gap-1 text-[12px] font-bold text-white">{order.user} <CheckCircle size={12} weight="fill" className="text-[#3B82F6]" /></div>
                          <div className="text-[10px] text-white/40">{order.stats}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[12px]">{order.price}</td>
                    <td className="py-3 text-[12px]">{order.available}</td>
                    <td className="py-3 text-[#3B82F6] font-bold">{order.payment[0]}</td>
                    <td className="py-3 text-right">
                      <button className={`px-3 py-1 rounded text-[11px] font-bold border ${order.action === 'Buy' ? 'text-white border-[#3B82F6]/50 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20' : 'text-[#EA3943] border-[#EA3943]/30 bg-[#EA3943]/10 hover:bg-[#EA3943]/20'}`}>
                        {order.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-auto pt-2 flex justify-center">
              <button className="flex items-center gap-1.5 text-[#6366F1] text-[12px] font-bold hover:opacity-80 transition-opacity">
                View More Orders
                <CaretDown size={14} weight="bold" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Col 3: Info Cards */}
        <div className="flex flex-col gap-4">
          <div className={cardStyle + " flex flex-col"}>
            <h3 className="text-[13px] font-bold text-white mb-4">Long BTC</h3>
            <div className="space-y-3 text-[12px] font-medium text-white/40">
              <div className="flex justify-between"><span>Entry Price</span><span className="text-white font-mono">$69,245.6704</span></div>
              <div className="flex justify-between"><span>Mark Price</span><span className="text-white font-mono">$70,552.2546</span></div>
              <div className="flex justify-between"><span>Est. Liq. Price</span><span className="text-white font-mono">$68,382.4501</span></div>
            </div>
          </div>
          
          <div className={cardStyle + " bg-gradient-to-br from-[#1E1B4B]/80 to-[#0F141A] border-[#3730A3]/30 flex items-center justify-between p-6 flex-1"}>
            <div className="pr-4">
              <h3 className="text-[15px] font-bold text-white mb-2">Trade with confidence</h3>
              <p className="text-[12px] text-white/50 leading-relaxed max-w-[160px]">
                Low fees, deep liquidity, and best execution.
              </p>
            </div>
            <div className="w-12 h-12 bg-[#6366F1]/20 rounded-2xl flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <ShieldCheck size={28} weight="fill" className="text-[#818CF8]" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
