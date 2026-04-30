"use client";

import React from 'react';

/**
 * @title Footer
 * @author Viqtorhvayx
 * @dev Refined floating Footer with brand-aligned status colors and enhanced vertical presence.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-transparent border-none flex items-center justify-between px-8 py-12 mt-20 select-none">
      {/* Left: Copyright */}
      <div className="flex items-center">
        <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">
          CREODE © 2026
        </span>
      </div>

      {/* Center: Status Pills */}
      <div className="hidden md:flex items-center space-x-3">
        {/* Network Pill */}
        <div className="flex items-center space-x-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A8E8] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00A8E8] shadow-[0_0_8px_#00A8E8]"></span>
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Network: <span className="text-[#00A8E8]">Hedera Testnet</span>
          </span>
        </div>

        {/* Relay Pill */}
        <div className="flex items-center space-x-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          <div className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
          </div>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
            Relay: <span className="text-[#00A8E8]">Connected</span>
          </span>
        </div>
      </div>

      {/* Right: Icon Links */}
      <div className="flex items-center space-x-6">
        {/* X (Twitter) */}
        <a href="https://x.com/creode" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-all duration-300 transform hover:scale-110">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* GitHub */}
        <a href="https://github.com/Viqtorhvayx" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-all duration-300 transform hover:scale-110">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
          </svg>
        </a>

        {/* Discord / Chat */}
        <a href="#" className="text-gray-500 hover:text-white transition-all duration-300 transform hover:scale-110">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </a>

        {/* Documentation */}
        <a href="#" className="text-gray-500 hover:text-white transition-all duration-300 transform hover:scale-110">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </a>
      </div>
    </footer>
  );
};
