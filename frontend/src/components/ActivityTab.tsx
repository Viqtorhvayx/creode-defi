import React, { useState } from 'react';
import { 
  Sparkle, 
  MagnifyingGlass, 
  CaretDown, 
  CaretUp,
  CopySimple,
  ArrowSquareOut,
  Check,
  Hourglass,
  X,
  CaretLeft,
  CaretRight
} from '@phosphor-icons/react';

interface ActivityTabProps {
  theme: 'light' | 'dark';
}

export const ActivityTab: React.FC<ActivityTabProps> = ({ theme }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(2);

  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/60' : 'text-slate-500';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-[#EAECEF]';
  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';

  return (
    <div className={`w-full max-w-[1200px] mx-auto flex flex-col gap-6 ${textMain} px-4 font-['Inter']`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight mb-1 leading-none">
          Activity Log
        </h1>
      </div>

      {/* CODE Points Banner */}
      <div className={`w-full ${theme === 'dark' ? 'bg-[#00A8E8]/10' : 'bg-[#f0f9ff]'} border ${theme === 'dark' ? 'border-[#00A8E8]/20' : 'border-[#00A8E8]/20'} rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <Sparkle weight="fill" className={`${textMain} shrink-0`} size={20} />
          <span className={`text-[14px] font-medium ${textMain}`}>
            Earn CODE points for every protocol interaction. Points will be incentivized in future updates.
          </span>
        </div>
        <div className={`text-[14px] font-medium shrink-0 ${textMain}`}>
          Your Total: <span className="text-[#00A8E8] font-bold text-[16px]">1,450 CODE</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="w-full flex flex-wrap items-center justify-end gap-3 text-[13px] font-medium">
        <div className={`relative flex items-center ${cardBg} border ${borderColor} rounded-lg px-3 py-2.5 w-full sm:w-[240px]`}>
          <MagnifyingGlass className={`${textMuted} mr-2 shrink-0`} size={16} />
          <input 
            type="text" 
            placeholder="Search by Tx ID or Token..." 
            className={`bg-transparent outline-none border-none w-full placeholder:text-slate-400 ${textMain}`}
          />
        </div>
        <button className={`flex items-center gap-2 ${cardBg} border ${borderColor} rounded-lg px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
          All Products <CaretDown size={14} weight="bold" />
        </button>
        <button className={`flex items-center gap-2 ${cardBg} border ${borderColor} rounded-lg px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
          Status: All <CaretDown size={14} weight="bold" />
        </button>
      </div>

      {/* Main Table Card */}
      <div className={`w-full ${cardBg} border ${borderColor} rounded-[14px] shadow-sm overflow-hidden mb-8`}>
        
        {/* Table Header */}
        <div className={`hidden md:grid grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 border-b ${borderColor} text-[13px] font-semibold ${textMuted}`}>
          <div>Date / Time</div>
          <div>Type</div>
          <div>Asset / Strategy</div>
          <div>Amount</div>
          <div>Reward</div>
          <div>Status</div>
        </div>

        {/* Rows */}
        <div className="flex flex-col">
          
          {/* Row 1 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[14px]`}>
            <div className={textMuted}>Jun 23, 10:15</div>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#00A8E8]/10 text-[#00A8E8]' : 'bg-[#e0f4fc] text-[#00A8E8]'}`}>
                Deposit
              </span>
            </div>
            <div className="font-medium">DOVU/HBAR Farm</div>
            <div className="font-semibold">5,000 HBAR</div>
            <div className="text-[#00A8E8] font-bold">+50 CODE</div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>
                Success <Check size={12} weight="bold" />
              </span>
              <CaretDown size={16} className={`${textMuted} cursor-pointer hover:text-slate-800 dark:hover:text-white`} />
            </div>
          </div>

          {/* Row 2 (EXPANDED) */}
          <div className={`m-3 border border-[#00A8E8] rounded-[14px] overflow-hidden ${theme === 'dark' ? 'bg-[#00A8E8]/5' : 'bg-[#f8fcff]'}`}>
            <div 
              className={`grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-3 md:px-5 py-4 items-center cursor-pointer text-[14px]`}
              onClick={() => setExpandedRow(expandedRow === 2 ? null : 2)}
            >
              <div className={textMuted}>Jun 22, 14:30</div>
              <div>
                <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                  P2P Trade
                </span>
              </div>
              <div className="font-medium">HBAR / USDT</div>
              <div className="font-semibold">-150 USDT</div>
              <div className="text-[#00A8E8] font-bold">+15 CODE</div>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>
                  Success <Check size={12} weight="bold" />
                </span>
                <CaretUp size={16} className={`${textMuted} cursor-pointer hover:text-slate-800 dark:hover:text-white`} />
              </div>
            </div>

            {expandedRow === 2 && (
              <div className={`mx-3 md:mx-5 mb-4 p-4 rounded-xl border ${borderColor} ${theme === 'dark' ? 'bg-[#0b0e14]' : 'bg-[#F8FAFC]'}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-col gap-3 text-[13px]">
                    <div className="flex items-center gap-6">
                      <span className={textMuted}>Transaction ID:</span>
                      <div className="flex items-center gap-2 font-medium">
                        <span>0.0.987654@1687431600.000000001</span>
                        <CopySimple size={14} className={`${textMuted} cursor-pointer hover:text-[#00A8E8]`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={textMuted}>Network Fee:&nbsp;&nbsp;</span>
                      <span className="font-medium">0.00234 HBAR ($0.00016)</span>
                    </div>
                  </div>
                  
                  <button className={`shrink-0 flex items-center gap-2 px-4 py-2 border border-[#00A8E8] rounded-lg text-[#00A8E8] text-[13px] font-bold hover:bg-[#00A8E8]/5 transition-colors`}>
                    View on Hashscan <ArrowSquareOut size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Row 3 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[14px]`}>
            <div className={textMuted}>Jun 20, 09:12</div>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#00A8E8]/10 text-[#00A8E8]' : 'bg-[#e0f4fc] text-[#00A8E8]'}`}>
                Stake
              </span>
            </div>
            <div className="font-medium">HBAR -&gt; HBARx</div>
            <div className="font-semibold">1,200 HBAR</div>
            <div className="text-[#00A8E8] font-bold">+20 CODE</div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>
                Success <Check size={12} weight="bold" />
              </span>
              <CaretDown size={16} className={`${textMuted} cursor-pointer hover:text-slate-800 dark:hover:text-white`} />
            </div>
          </div>

          {/* Row 4 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center border-b ${borderColor} hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[14px]`}>
            <div className={textMuted}>Jun 18, 16:45</div>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                Withdrawal
              </span>
            </div>
            <div className="font-medium">90-Day Vault</div>
            <div className="font-semibold">2,500 USDC</div>
            <div className="text-slate-400 font-bold">+0 CODE</div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#fef3c7] text-[#d97706]'}`}>
                Pending <Hourglass size={12} weight="bold" />
              </span>
              <CaretDown size={16} className={`${textMuted} cursor-pointer hover:text-slate-800 dark:hover:text-white`} />
            </div>
          </div>

          {/* Row 5 */}
          <div className={`grid grid-cols-1 md:grid-cols-[1.5fr_1.2fr_1.5fr_1fr_1fr_1.5fr] gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-[14px]`}>
            <div className={textMuted}>Jun 15, 11:20</div>
            <div>
              <span className={`inline-flex px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#dcfce7] text-[#16C784]'}`}>
                Claim Yield
              </span>
            </div>
            <div className="font-medium">SAUCE/USDC Farm</div>
            <div className="text-[#16C784] font-semibold">+45.20 USDC</div>
            <div className="text-[#00A8E8] font-bold">+5 CODE</div>
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-bold ${theme === 'dark' ? 'bg-[#EA3943]/10 text-[#EA3943]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>
                Failed <X size={12} weight="bold" />
              </span>
              <CaretDown size={16} className={`${textMuted} cursor-pointer hover:text-slate-800 dark:hover:text-white`} />
            </div>
          </div>

        </div>
      </div>

      {/* Pagination */}
      <div className="w-full flex items-center justify-center gap-2 pb-8 text-[13px] font-semibold">
        <button className={`flex items-center gap-1 px-2 py-1 ${textMuted} hover:text-slate-800 dark:hover:text-white transition-colors`}>
          <CaretLeft size={14} weight="bold" /> Previous
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#00A8E8] text-white">
          1
        </button>
        <button className={`w-8 h-8 flex items-center justify-center rounded-md ${textMuted} hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}>
          2
        </button>
        <button className={`w-8 h-8 flex items-center justify-center rounded-md ${textMuted} hover:bg-slate-100 dark:hover:bg-white/5 transition-colors`}>
          3
        </button>
        <button className="flex items-center gap-1 px-2 py-1 text-[#00A8E8] hover:opacity-80 transition-opacity">
          Next <CaretRight size={14} weight="bold" />
        </button>
      </div>

    </div>
  );
};
