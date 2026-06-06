/* Credit this code to Viqtorhvayx on GitHub */
// Code credited and implemented, including this specific UI component uniform styling and design alignment, by Viqtorhvayx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PriceChart } from './PriceChart';
import { useWallet } from '../context/WalletContext';
import { ShieldCheck, LockKey, Warning, CalendarBlank, ChartLineUp, CaretUp, Percent, ArrowsClockwise } from '@phosphor-icons/react';
import { CustomVaultIcon } from './CustomVaultIcon';

interface VaultTabProps {
  theme: 'light' | 'dark';
}

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  const [selectedPercent, setSelectedPercent] = useState<string | null>(null);
  const [isSetSelected, setIsSetSelected] = useState<boolean>(false);
  const [lockDaysInput, setLockDaysInput] = useState<string>('30');
  const [displayLockDays, setDisplayLockDays] = useState<number>(30);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [hasDeposited, setHasDeposited] = useState<boolean>(false);
  const [hbarLogoUrlSmall, setHbarLogoUrlSmall] = useState<string | null>(null);
  const [usdtLogoUrlSmall, setUsdtLogoUrlSmall] = useState<string | null>(null);

  const { balance } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const TOKENS = ['HBAR', 'USDT', 'USDC', 'SAUCE', 'PACK', 'WBTC', 'WETH', 'BONZO', 'DOVU'];
  const [activeToken, setActiveToken] = useState('HBAR');

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchLogos = async () => {
      try {
        const [hbarRes, usdtRes] = await Promise.all([
          fetch("https://api.coingecko.com/api/v3/coins/hedera-hashgraph"),
          fetch("https://api.coingecko.com/api/v3/coins/tether")
        ]);
        
        if (hbarRes.ok) {
          const hbarData = await hbarRes.json();
          if (hbarData?.image?.small) setHbarLogoUrlSmall(hbarData.image.small);
        }
        
        if (usdtRes.ok) {
          const usdtData = await usdtRes.json();
          if (usdtData?.image?.small) setUsdtLogoUrlSmall(usdtData.image.small);
        }
      } catch (err) {
        console.error("CoinGecko Logo Error:", err);
      }
    };
    fetchLogos();
  }, []);

  const maturityDate = new Date();
  maturityDate.setDate(maturityDate.getDate() + displayLockDays);
  const formattedMaturityDate = maturityDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

  return (
    <div className="w-full mx-auto flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Removed Top Header as requested */}

      {/* ROW 1: Chart & Vault Lock Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-6">
        
        {/* LEFT COLUMN: Chart Card */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white dark:bg-[#0F141A] border border-slate-100 dark:border-white/5 rounded-[16px] shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.5),0_0_15px_rgba(37,99,235,0.05)] flex flex-col w-full h-full p-6">
            <PriceChart theme={theme} />
          </div>
        </div>

        {/* RIGHT COLUMN: Vault Lock Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white dark:bg-[#0F141A] border border-[#00A8E8]/50 rounded-[16px] p-8 flex flex-col relative overflow-hidden h-full">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <CustomVaultIcon className="w-12 h-12 text-black dark:text-white" />
              <div className="flex flex-col">
                <h3 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5 leading-none">Vault</h3>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">Time-locked savings</span>
              </div>
            </div>
            
            <div className="flex flex-col items-start px-3 py-2 w-fit rounded-[14px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-none">Secured by</span>
              <div className="flex items-center gap-2 mt-1.5">
                {hbarLogoUrlSmall ? (
                  <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none bg-slate-900 dark:bg-white" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm dark:shadow-none">H</div>
                )}
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-none">Hedera</span>
              </div>
            </div>
          </div>

          {/* Huge APY */}
          <div className="flex flex-col mb-8">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[48px] leading-none font-bold text-[#00A8E8] dark:text-[#00A8E8] dark:drop-shadow-[0_0_25px_rgba(0,168,232,0.4)]">0.30%</span>
              <span className="text-[20px] font-bold text-[#00A8E8] dark:text-[#00A8E8] dark:drop-shadow-[0_0_15px_rgba(0,168,232,0.3)]">APY</span>
            </div>
            <span className="text-[13px] font-medium text-[#00A8E8] dark:text-[#00A8E8]">Earns every 21 days</span>
          </div>

          {/* Deposit Input Area */}
          {/* Deposit Input Area */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-bold text-slate-900 dark:text-white/80 mb-2">Deposit {activeToken}</label>
            <div className="flex items-center justify-between w-full h-[104px] px-5 bg-slate-50 dark:bg-[#0B0F14] border border-slate-200 dark:border-white/5 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-[16px] transition-all">
              
              <div className="flex flex-col justify-center h-full flex-1">
                <input 
                  type="number" 
                  placeholder="0" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[32px] font-bold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 leading-none m-0 p-0 mb-3" 
                />
                <span className={`text-[12px] font-medium ml-0.5 transition-colors ${selectedPercent ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/40'}`}>$0</span>
              </div>

              {/* Right Side: Logo & Embedded Utilities */}
              <div className="flex flex-col items-end justify-center h-full shrink-0">
                
                <div className="relative mb-[14px]" ref={dropdownRef}>
                  {/* Token Selector Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    {activeToken === 'HBAR' && hbarLogoUrlSmall ? (
                      <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none bg-slate-900 dark:bg-white" />
                    ) : activeToken === 'USDT' && usdtLogoUrlSmall ? (
                      <img src={usdtLogoUrlSmall} alt="USDT Logo" className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none bg-slate-900 dark:bg-white" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm dark:shadow-none">{activeToken.charAt(0)}</span>
                    )}
                    <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{activeToken}</span>
                    <svg className={`w-3.5 h-3.5 text-slate-500 dark:text-white/60 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </div>

                  {/* Token Dropdown Menu */}
                  <div 
                    className={`absolute top-full right-0 mt-2 w-[220px] bg-black/5 dark:bg-white/5 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-xl shadow-sm dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] z-50 transition-all duration-200 ease-in-out origin-top-right ${isDropdownOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
                  >
                    <div className="flex flex-col max-h-[280px] overflow-y-auto p-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
                      {TOKENS.map(token => (
                        <div 
                          key={token}
                          onClick={() => { setActiveToken(token); setIsDropdownOpen(false); }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 group ${activeToken === token ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20' : 'hover:bg-[#00A8E8]/5 dark:hover:bg-[#00A8E8]/10'}`}
                        >
                          <div className="flex items-center gap-3">
                            {token === 'HBAR' && hbarLogoUrlSmall ? (
                              <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm bg-slate-900 dark:bg-white" />
                            ) : token === 'USDT' && usdtLogoUrlSmall ? (
                              <img src={usdtLogoUrlSmall} alt="USDT Logo" className="w-7 h-7 rounded-full object-cover shrink-0 shadow-sm bg-slate-900 dark:bg-white" />
                            ) : (
                              <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white flex items-center justify-center text-[12px] font-black shrink-0 border border-slate-200 dark:border-white/10 shadow-sm">{token.charAt(0)}</span>
                            )}
                            <span className={`text-[14px] font-bold ${activeToken === token ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white group-hover:text-[#00A8E8] dark:group-hover:text-[#00A8E8]'}`}>{token}</span>
                          </div>
                          
                          {/* Token Balance logic fetch hook goes here */}
                          <div className="flex flex-col items-end">
                            <span className={`text-[13px] font-semibold ${activeToken === token ? 'text-[#00A8E8]/80' : 'text-slate-600 dark:text-white/70 group-hover:text-[#00A8E8]/80 dark:group-hover:text-[#00A8E8]/80'}`}>
                              {token === 'HBAR' ? (balance || "0.00") : "0.00"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shortcut Buttons */}
                <div className="flex items-center gap-3 pr-2">
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === '25%' ? null : '25%')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '25%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>25%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === '50%' ? null : '50%')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '50%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>50%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === 'MAX' ? null : 'MAX')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === 'MAX' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-slate-400 dark:text-white/50 hover:text-[#00A8E8] dark:hover:text-[#00A8E8]'}`}>MAX</button>
                </div>
              </div>

            </div>
          </div>

          {/* Lock For Input Area */}
          <div className="flex flex-col w-full mb-4">
            <label className="text-[13px] font-bold text-slate-900 dark:text-white/80 mb-2">Lock for (days)</label>
            <div className="flex items-center justify-between w-full">
              <div className="w-[100px] py-2 px-4 bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/5 dark:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-full transition-all duration-200 focus-within:border-[#00A8E8]/60 focus-within:ring-2 focus-within:ring-[#00A8E8]/20">
                <input 
                  type="number" 
                  value={lockDaysInput}
                  onChange={(e) => {
                    setLockDaysInput(e.target.value);
                    setIsSetSelected(false);
                  }}
                  className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[16px] font-bold w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white" />
              </div>
              <button 
                onClick={() => {
                  setDisplayLockDays(Number(lockDaysInput) || 0);
                  setIsSetSelected(true);
                }}
                className={`text-[12px] font-bold px-4 py-2 rounded-full transition-colors ${isSetSelected ? 'text-white bg-[#00A8E8]' : 'text-[#00A8E8] bg-[#00A8E8]/15 hover:bg-[#00A8E8]/25'}`}>
                Set
              </button>
            </div>
          </div>

          {/* Warning Text */}
          <div className="flex items-start gap-2 mb-8">
            <Warning size={16} className="text-red-500 dark:text-red-400/80 mt-[1px] shrink-0" />
            <span className="text-[12px] font-medium text-red-500 dark:text-red-400/80 leading-snug">Withdrawing before maturity incurs a 5% fee and forfeits pending yield.</span>
          </div>

          {/* Info Row */}
          <div className="flex items-center justify-between w-full mb-8 pt-6 border-t border-slate-100 dark:border-white/5">
            
            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                <LockKey size={14} />
                <span className="text-[11px] font-semibold">Lock Period</span>
              </div>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{displayLockDays} Days</span>
            </div>
            
            <div className="w-px h-8 bg-slate-200 dark:bg-[#1A2332]"></div>
            
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                <CalendarBlank size={14} />
                <span className="text-[11px] font-semibold">Maturity Date</span>
              </div>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{formattedMaturityDate}</span>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-[#1A2332]"></div>

            <div className="flex flex-col items-start gap-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40 whitespace-nowrap">
                <ChartLineUp size={14} className="shrink-0" />
                <span className="text-[11px] font-semibold">Estimated Earnings</span>
              </div>
              <span className="text-[13px] font-bold text-emerald-500 dark:text-[#00E88A]">+4.50 {activeToken}</span>
            </div>

          </div>

          {/* Deposit / Withdraw Buttons */}
          {hasDeposited ? (
            <div className="flex items-center gap-4 w-full">
              <button 
                className="flex-1 h-14 rounded-[12px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-[#00A8E8]/15 hover:bg-[#00A8E8]/25 text-[#00A8E8] hover:shadow-[0_0_20px_#00A8E8] dark:hover:shadow-[0_0_25px_#00A8E8] active:bg-[#00A8E8] dark:active:bg-[#00A8E8] active:text-white dark:active:text-white active:shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:active:shadow-[0_0_20px_rgba(0,168,232,0.3)]"
              >
                Deposit
              </button>
              <button 
                className="flex-1 h-14 rounded-[12px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-[#00A8E8]/15 hover:bg-[#00A8E8]/25 text-[#00A8E8] hover:shadow-[0_0_20px_#00A8E8] dark:hover:shadow-[0_0_25px_#00A8E8] active:bg-[#00A8E8] dark:active:bg-[#00A8E8] active:text-white dark:active:text-white active:shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:active:shadow-[0_0_20px_rgba(0,168,232,0.3)]"
              >
                Withdraw
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (Number(depositAmount) > 0) {
                  setHasDeposited(true);
                }
              }}
              className="w-full h-14 bg-[#00A8E8] dark:bg-[#00A8E8] hover:bg-[#0090C7] dark:hover:bg-[#0090C7] text-white rounded-[12px] text-[15px] font-bold flex items-center justify-center shadow-[0_4px_14px_rgba(0,168,232,0.25)] dark:shadow-[0_0_20px_rgba(0,168,232,0.3)] hover:shadow-[0_0_30px_#00A8E8] dark:hover:shadow-[0_0_40px_#00A8E8] transition-all duration-300 active:scale-[0.98] tracking-wide"
            >
              Deposit to Vault
            </button>
          )}

          {/* Footer Subtext */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            <ShieldCheck size={14} className="text-slate-400 dark:text-white/40" />
            <span className="text-[11px] font-medium text-slate-400 dark:text-white/40">Your funds are locked and secured on Hedera</span>
          </div>

          </div>
        </div>
      </div>

      {/* ROW 2: Empty Space & Total Portfolio Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-8">
        
        {/* LEFT COLUMN: Features Card */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-[16px] px-6 py-4 flex flex-col w-full h-full shadow-sm dark:shadow-none">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
              
              {/* Feature 1 */}
              <div className="flex flex-col items-start w-full h-full">
                <div className="w-9 h-9 rounded-full bg-transparent border border-[#00A8E8]/30 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,168,232,0.05)] shrink-0">
                  <ShieldCheck size={16} className="text-[#00A8E8]" weight="regular" />
                </div>
                <div className="flex flex-col relative w-full flex-1">
                  <h4 className="text-[12px] lg:text-[13px] font-bold text-slate-900 dark:text-white mb-0.5 whitespace-nowrap tracking-tight">Secure</h4>
                  <div className="flex-1 min-h-[40px]">
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug pr-4">Built on Hedera with enterprise-grade security.</p>
                  </div>
                  {/* Text Separator */}
                  <div className="hidden md:block absolute right-[-12px] top-0 h-12 w-px bg-black/10 dark:bg-white/5"></div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-start w-full h-full">
                <div className="w-9 h-9 rounded-full bg-transparent border border-[#00A8E8]/30 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,168,232,0.05)] shrink-0">
                  <LockKey size={16} className="text-[#00A8E8]" weight="regular" />
                </div>
                <div className="flex flex-col relative w-full flex-1">
                  <h4 className="text-[12px] lg:text-[13px] font-bold text-slate-900 dark:text-white mb-0.5 whitespace-nowrap tracking-tight">Time-Locked</h4>
                  <div className="flex-1 min-h-[40px]">
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug pr-4">Funds are safely locked for maximum yield</p>
                  </div>
                  {/* Text Separator */}
                  <div className="hidden md:block absolute right-[-12px] top-0 h-12 w-px bg-black/10 dark:bg-white/5"></div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-start w-full h-full">
                <div className="w-9 h-9 rounded-full bg-transparent border border-[#00A8E8]/30 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,168,232,0.05)] shrink-0">
                  <Percent size={16} className="text-[#00A8E8]" weight="regular" />
                </div>
                <div className="flex flex-col relative w-full flex-1">
                  <h4 className="text-[12px] lg:text-[13px] font-bold text-slate-900 dark:text-white mb-0.5 whitespace-nowrap tracking-tight">Stable Yield</h4>
                  <div className="flex-1 min-h-[40px]">
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug pr-4">Earn 0.30% APY every 21 days, consistently.</p>
                  </div>
                  {/* Text Separator */}
                  <div className="hidden md:block absolute right-[-12px] top-0 h-12 w-px bg-black/10 dark:bg-white/5"></div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex flex-col items-start w-full h-full">
                <div className="w-9 h-9 rounded-full bg-transparent border border-[#00A8E8]/30 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(0,168,232,0.05)] shrink-0">
                  <ArrowsClockwise size={16} className="text-[#00A8E8]" weight="regular" />
                </div>
                <div className="flex flex-col relative w-full flex-1">
                  <h4 className="text-[12px] lg:text-[13px] font-bold text-slate-900 dark:text-white mb-0.5 whitespace-nowrap tracking-tight">Auto-Compounding</h4>
                  <div className="flex-1 min-h-[40px]">
                    <p className="text-[11px] text-slate-500 dark:text-white/50 leading-snug pr-4">Earnings are added to your balance after each cycle.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Total Portfolio Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-white dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-[16px] px-6 py-5 flex flex-col w-full shadow-sm dark:shadow-none h-full relative overflow-hidden">
            {/* Subtle background glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00A8E8]/5 dark:bg-[#00A8E8]/10 blur-2xl rounded-full"></div>

            <div className="flex flex-col h-full z-10">
              <span className="text-[14px] font-medium text-slate-500 dark:text-white/60 mb-0.5">Total Portfolio</span>
              <span className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">$18,642.75</span>
              
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col items-start w-full">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CaretUp size={14} weight="fill" className="text-emerald-500 dark:text-[#00E88A]" />
                  <span className="text-[15px] font-bold text-emerald-500 dark:text-[#00E88A]">3.24%</span>
                </div>
                <span className="text-[13px] font-medium text-slate-500 dark:text-white/50">24h Change</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
