/* Credit this code to me on github not antigravity 
 * CREODE DApp - Lend Tab
 */
import React from 'react';

export const LendTab = () => {
  return (
    <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Left: Supply Interface */}
      <div className="p-8 bg-white/5 dark:bg-black/20 backdrop-blur-2xl rounded-[2rem] border-none shadow-2xl flex flex-col gap-6">
        <div>
          <h3 className="text-xl font-bold text-black/80 dark:text-white/80 mb-2">Supply Assets</h3>
          <p className="text-sm text-black/40 dark:text-white/40">Provide liquidity to the protocol and earn points.</p>
        </div>

        <div className="relative w-full group">
          <input 
            type="number"
            placeholder="0.00"
            className="w-full h-20 bg-black/5 dark:bg-white/5 border border-transparent rounded-2xl px-6 text-3xl font-black text-black dark:text-white focus:outline-none focus:border-[#00A8E8]/30 focus:bg-transparent transition-all duration-300"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 bg-white dark:bg-[#1A1A1A] p-2 pl-5 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
            <button className="text-xs font-black text-[#00A8E8] uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">Max</button>
            <div className="w-px h-5 bg-black/10 dark:bg-white/10"></div>
            <span className="text-base font-black text-black/80 dark:text-white/80 pr-2">HBAR</span>
          </div>
        </div>

        <button className="w-full py-5 bg-[#00A8E8] text-white rounded-2xl text-lg font-black uppercase tracking-[0.1em] shadow-[0_0_30px_rgba(0,168,232,0.3)] hover:shadow-[0_0_40px_rgba(0,168,232,0.6)] hover:-translate-y-1 transition-all duration-300">
          Supply HBAR
        </button>
      </div>

      {/* Right: Points Engine */}
      <div className="p-8 bg-gradient-to-br from-[#00A8E8]/10 to-transparent backdrop-blur-2xl rounded-[2rem] border border-[#00A8E8]/20 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A8E8]/20 blur-[100px] rounded-full"></div>
        
        <h4 className="text-xs font-bold text-[#00A8E8] uppercase tracking-[0.3em] mb-4 relative z-10">Creod Points Engine</h4>
        <div className="text-7xl font-black text-black dark:text-white tracking-tighter drop-shadow-[0_0_15px_rgba(0,168,232,0.3)] mb-2 relative z-10">
          1,452
        </div>
        <p className="text-lg font-bold text-black/40 dark:text-white/40 mb-6 relative z-10">PTS Earned</p>
        
        <div className="p-4 bg-black/5 dark:bg-white/5 rounded-xl backdrop-blur-sm relative z-10 w-full">
          <p className="text-sm text-black/60 dark:text-white/60 leading-relaxed">
            Points are accumulated daily based on your active HBAR supply. These points will be converted into exclusive protocol rewards in future phases.
          </p>
        </div>
      </div>

    </div>
  );
};
