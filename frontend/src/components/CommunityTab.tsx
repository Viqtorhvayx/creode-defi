import React from 'react';
import { 
  ArrowRight, 
  Info, 
  Users, 
  CheckCircle, 
  XCircle, 
  ShieldCheck,
  Question,
  CaretDown,
  FileText
} from '@phosphor-icons/react';

interface CommunityTabProps {
  theme: 'light' | 'dark';
}

export function CommunityTab({ theme }: CommunityTabProps) {
  return (
    <div className="flex flex-col gap-8 pb-8 animate-fade-in">
      
      {/* 1. ACTIVE POLLS SECTION */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">Active Polls</h2>
              <Info size={16} className="text-slate-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-500 dark:text-white/60">
              Vote on upcoming strategies and features.
            </p>
          </div>
          <button className={`flex items-center gap-1 text-[13px] font-semibold transition-colors mt-1 ${theme === 'dark' ? 'text-[#00A8E8] hover:text-[#008AC0]' : 'text-[#00A8E8] hover:text-[#008AC0]'}`}>
            View all polls <ArrowRight size={14} weight="bold" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Poll Card 1 */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug max-w-[180px]">
                Which pair should we optimize next?
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Ends in 2d 14h
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-grow mb-8">
              {/* Option A */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold">$</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">HBAR / USDC</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">42%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-blue-500" style={{ width: '42%' }}></div>
                </div>
              </div>
              
              {/* Option B */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-[10px] font-bold">T</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">HBAR / USDT</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">33%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-teal-500" style={{ width: '33%' }}></div>
                </div>
              </div>

              {/* Option C */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[8px] font-bold leading-none">SAUCE</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">HBAR / SAUCE</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">25%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-red-500" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>

            <div className={`flex justify-between items-center pt-5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/60">
                <Users size={16} />
                <span className="text-[13px] font-medium">1,248 votes</span>
              </div>
              <button className={`px-5 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 hover:border-[#00A8E8] text-[#00A8E8]' : 'border-slate-200 hover:border-[#00A8E8] text-[#00A8E8]'}`}>
                Vote Now
              </button>
            </div>
          </div>

          {/* Poll Card 2 */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug max-w-[180px]">
                What feature should we build next?
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Ends in 5d 8h
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-grow mb-8">
              {/* Option A */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-[12px] font-bold">
                       <FileText size={12} weight="fill" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Advanced Analytics Dashboard</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">48%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-purple-500" style={{ width: '48%' }}></div>
                </div>
              </div>
              
              {/* Option B */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-bold">
                      📱
                    </div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Mobile App</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">29%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-orange-500" style={{ width: '29%' }}></div>
                </div>
              </div>

              {/* Option C */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                      ⟷
                    </div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Cross-chain Strategies</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">23%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-teal-600" style={{ width: '23%' }}></div>
                </div>
              </div>
            </div>

            <div className={`flex justify-between items-center pt-5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/60">
                <Users size={16} />
                <span className="text-[13px] font-medium">987 votes</span>
              </div>
              <button className={`px-5 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 hover:border-[#00A8E8] text-[#00A8E8]' : 'border-slate-200 hover:border-[#00A8E8] text-[#00A8E8]'}`}>
                Vote Now
              </button>
            </div>
          </div>

          {/* Poll Card 3 */}
          <div className={`flex flex-col p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug max-w-[180px]">
                Preferred rebalancing frequency?
              </h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                Ends in 1d 20h
              </span>
            </div>

            <div className="flex flex-col gap-4 flex-grow mb-8">
              {/* Option A */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">A</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Aggressive (1-2 days)</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">38%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-blue-600" style={{ width: '38%' }}></div>
                </div>
              </div>
              
              {/* Option B */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">B</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Balanced (3-5 days)</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">41%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: '41%' }}></div>
                </div>
              </div>

              {/* Option C */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">C</div>
                    <span className="text-[13px] font-semibold text-slate-900 dark:text-white">Conservative (7+ days)</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-900 dark:text-white">21%</span>
                </div>
                <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className="h-full rounded-full bg-amber-500" style={{ width: '21%' }}></div>
                </div>
              </div>
            </div>

            <div className={`flex justify-between items-center pt-5 border-t ${theme === 'dark' ? 'border-white/5' : 'border-slate-100'}`}>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/60">
                <Users size={16} />
                <span className="text-[13px] font-medium">654 votes</span>
              </div>
              <button className={`px-5 py-2 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 hover:border-[#00A8E8] text-[#00A8E8]' : 'border-slate-200 hover:border-[#00A8E8] text-[#00A8E8]'}`}>
                Vote Now
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 2. LOWER PANELS (Submit Proposal + Past Decisions) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Left Panel: Submit a Proposal */}
        <div className={`flex flex-col p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">Submit a Proposal</h2>
                <Info size={16} className="text-slate-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-white/60">
                Have an idea to improve Yield Hub? Share your proposal with the community.
              </p>
            </div>
            
            {/* Soft decorative icon block in top right matching the reference */}
            <div className={`w-[60px] h-[60px] rounded-[12px] flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-[#00A8E8]/10 text-[#00A8E8]' : 'bg-blue-50 text-blue-400'}`}>
               <FileText size={28} weight="fill" className="opacity-80"/>
            </div>
          </div>

          <div className="flex flex-col flex-grow">
            {/* Textarea */}
            <div className={`relative mb-4 rounded-[10px] border focus-within:border-[#00A8E8] focus-within:ring-1 focus-within:ring-[#00A8E8] transition-all ${theme === 'dark' ? 'border-white/10 bg-[#0B0F14]' : 'border-slate-200 bg-white'}`}>
              <textarea 
                className="w-full h-[120px] p-4 bg-transparent resize-none text-[14px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                placeholder="Describe your strategy or feature idea..."
              ></textarea>
              <div className="absolute bottom-3 right-4 text-[12px] font-medium text-slate-400">
                0 / 500
              </div>
            </div>

            {/* Input Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className={`rounded-[10px] border focus-within:border-[#00A8E8] focus-within:ring-1 focus-within:ring-[#00A8E8] transition-all px-4 py-2.5 ${theme === 'dark' ? 'border-white/10 bg-[#0B0F14]' : 'border-slate-200 bg-white'}`}>
                <input 
                  type="text" 
                  placeholder="Add supporting links (optional)"
                  className="w-full bg-transparent text-[13px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <div className={`rounded-[10px] border flex justify-between items-center px-4 py-2.5 cursor-pointer ${theme === 'dark' ? 'border-white/10 bg-[#0B0F14]' : 'border-slate-200 bg-white'}`}>
                <span className="text-[13px] text-slate-400">Select Category</span>
                <CaretDown size={14} className="text-slate-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-auto">
            <button className="flex items-center gap-1.5 text-[13px] font-medium text-[#00A8E8] hover:text-[#008AC0] transition-colors">
              <ShieldCheck size={16} /> Community guidelines
            </button>
            <button className="px-6 py-2.5 rounded-[10px] bg-[#00A8E8] hover:bg-[#0096D1] text-white text-[14px] font-bold transition-colors">
              Submit Proposal
            </button>
          </div>
        </div>

        {/* Right Panel: Past Decisions */}
        <div className={`flex flex-col p-6 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
           <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-white">Past Decisions</h2>
                <Info size={16} className="text-slate-400" />
              </div>
              <p className="text-[13px] font-medium text-slate-500 dark:text-white/60">
                See how the community has shaped Yield Hub.
              </p>
            </div>
            <button className={`flex items-center gap-1 text-[12px] font-semibold transition-colors mt-1 ${theme === 'dark' ? 'text-[#00A8E8] hover:text-[#008AC0]' : 'text-[#00A8E8] hover:text-[#008AC0]'}`}>
              View all decisions <ArrowRight size={12} weight="bold" />
            </button>
          </div>

          <div className="flex flex-col gap-5 flex-grow">
            
            {/* Item 1 */}
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center text-[12px] font-bold shrink-0">T</div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00A8E8] transition-colors">Add HBAR/USDT Balanced Strategy</h4>
                <div className="text-[12px] text-slate-500 dark:text-white/50">May 18, 2024 • 1,523 votes</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                  <CheckCircle size={14} weight="fill" /> Approved
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">78% in favor</div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-[12px] font-bold shrink-0">$</div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00A8E8] transition-colors">Lower rebalancing fees to 0.3%</h4>
                <div className="text-[12px] text-slate-500 dark:text-white/50">May 5, 2024 • 1,102 votes</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                  <CheckCircle size={14} weight="fill" /> Approved
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">72% in favor</div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-[12px] shrink-0">
                <FileText size={14} weight="fill" />
              </div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00A8E8] transition-colors">Integrate Advanced Analytics Dashboard</h4>
                <div className="text-[12px] text-slate-500 dark:text-white/50">Apr 28, 2024 • 1,843 votes</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                  <CheckCircle size={14} weight="fill" /> Approved
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">81% in favor</div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-[12px] shrink-0">
                📱
              </div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00A8E8] transition-colors">Build Mobile App (Phase 1)</h4>
                <div className="text-[12px] text-slate-500 dark:text-white/50">Apr 15, 2024 • 932 votes</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-red-500">
                  <XCircle size={14} weight="fill" /> Declined
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">35% in favor</div>
              </div>
            </div>

            {/* Item 5 */}
            <div className="flex items-center gap-4 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-[12px] shrink-0">
                C
              </div>
              <div className="flex flex-col flex-grow">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white line-clamp-1 group-hover:text-[#00A8E8] transition-colors">Support Cross-chain Strategies</h4>
                <div className="text-[12px] text-slate-500 dark:text-white/50">Apr 1, 2024 • 1,256 votes</div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-center gap-1 text-[12px] font-bold text-emerald-600">
                  <CheckCircle size={14} weight="fill" /> Approved
                </div>
                <div className="text-[11px] font-medium text-slate-400 mt-0.5">67% in favor</div>
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* 3. FOOTER BANNER */}
      <div className={`flex flex-col sm:flex-row justify-between items-center p-6 mt-4 rounded-[16px] border ${theme === 'dark' ? 'bg-[#0F141A] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4 mb-4 sm:mb-0">
          <div className="w-12 h-12 rounded-full bg-[#00A8E8] text-white flex items-center justify-center shrink-0">
            <Users size={24} weight="fill" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-0.5">
              Together, we build better yields.
            </h3>
            <p className="text-[13px] font-medium text-slate-500 dark:text-white/60">
              Your participation helps us create the most effective and community-driven yield strategies.
            </p>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold border transition-colors ${theme === 'dark' ? 'border-white/10 hover:border-white/20 bg-[#0B0F14] text-white' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'}`}>
          How it works <Question size={16} />
        </button>
      </div>

    </div>
  );
}
