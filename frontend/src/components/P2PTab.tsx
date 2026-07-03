import React from 'react';
import { 
  CaretDown, 
  Star,
  ArrowLeft,
  Plus
} from '@phosphor-icons/react';

interface P2PTabProps {
  theme: 'light' | 'dark';
}

export const P2PTab: React.FC<P2PTabProps> = ({ theme }) => {
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
      
      {/* Content intentionally scraped as requested */}
    </div>
  );
};
