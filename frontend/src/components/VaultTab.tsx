/* Credit this code to Viqtorhvayx on GitHub */
// Code credited and implemented, including this specific token replacement and API update, by Viqtorhvayx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PriceChart } from './PriceChart';
import { useWallet } from '../context/WalletContext';
import { ShieldCheck, LockKey, Warning, CalendarBlank, ChartLineUp, CaretUp, CaretDown, Percent, ArrowsClockwise, CircleNotch } from '@phosphor-icons/react';
import { CustomVaultIcon } from './CustomVaultIcon';
import { ChevronDown } from 'lucide-react';

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
  const [usdcLogoUrlSmall, setUsdcLogoUrlSmall] = useState<string | null>(null);
  const [sauceLogoUrlSmall, setSauceLogoUrlSmall] = useState<string | null>(null);
  const [packLogoUrlSmall, setPackLogoUrlSmall] = useState<string | null>(null);
  const [wbtcLogoUrlSmall, setWbtcLogoUrlSmall] = useState<string | null>(null);
  const [wethLogoUrlSmall, setWethLogoUrlSmall] = useState<string | null>(null);
  const [bonzoLogoUrlSmall, setBonzoLogoUrlSmall] = useState<string | null>(null);
  const [jamLogoUrlSmall, setJamLogoUrlSmall] = useState<string | null>(null);
  const [isLogosLoading, setIsLogosLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showNewVault, setShowNewVault] = useState<boolean>(false);
  const [portfolioValue, setPortfolioValue] = useState<number>(18642.75);
  const [animatedPortfolioValue, setAnimatedPortfolioValue] = useState<number>(18642.75);

  const { balance } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const TOKENS = ['HBAR', 'USDT', 'USDC', 'SAUCE', 'PACK', 'WBTC', 'WETH', 'BONZO', 'JAM'];
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

  useEffect(() => {
    if (animatedPortfolioValue < portfolioValue) {
      const step = (portfolioValue - animatedPortfolioValue) / 20;
      const interval = setInterval(() => {
        setAnimatedPortfolioValue(prev => {
          if (prev + step >= portfolioValue) {
            clearInterval(interval);
            return portfolioValue;
          }
          return prev + step;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [portfolioValue, animatedPortfolioValue]);

  React.useEffect(() => {
    const fetchLogos = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=hedera-hashgraph,tether,usd-coin,saucerswap,hashpack,wrapped-bitcoin,weth,bonzo-finance,tune-fm");
        
        if (res.ok) {
          const data = await res.json();
          data.forEach((coin: any) => {
            if (coin.id === 'hedera-hashgraph' && coin.image) setHbarLogoUrlSmall(coin.image);
            else if (coin.id === 'tether' && coin.image) setUsdtLogoUrlSmall(coin.image);
            else if (coin.id === 'usd-coin' && coin.image) setUsdcLogoUrlSmall(coin.image);
            else if (coin.id === 'saucerswap' && coin.image) setSauceLogoUrlSmall(coin.image);
            else if (coin.id === 'hashpack' && coin.image) setPackLogoUrlSmall(coin.image);
            else if (coin.id === 'wrapped-bitcoin' && coin.image) setWbtcLogoUrlSmall(coin.image);
            else if (coin.id === 'weth' && coin.image) setWethLogoUrlSmall(coin.image);
            else if (coin.id === 'bonzo-finance' && coin.image) setBonzoLogoUrlSmall(coin.image);
            else if (coin.id === 'tune-fm' && coin.image) setJamLogoUrlSmall(coin.image);
          });
        }
      } catch (err) {
        console.error("CoinGecko Logo Error:", err);
      } finally {
        setIsLogosLoading(false);
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
          <div className="bg-white dark:bg-[#0F141A] border border-[#00A8E8]/50 rounded-[16px] p-6 lg:p-8 flex flex-col relative overflow-hidden h-full">
          
          {/* Header Row */}
          <div className="flex justify-between items-start lg:items-center mb-6">
            <div className="flex items-center gap-4 mt-[-6px] lg:mt-[-12px]">
              <CustomVaultIcon className="w-12 h-12 text-black dark:text-white" />
              <div className="flex flex-col mt-2 lg:mt-0">
                <h3 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white mb-0.5 leading-none">Vault</h3>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-white/60">Time-locked savings</span>
              </div>
            </div>
            
            <div className="flex flex-col items-start px-3 py-1.5 w-fit rounded-[12px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none mt-[-6px] lg:mt-[-12px]">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-none mb-1">Secured by</span>
              <div className="flex items-center gap-1.5">
                {hbarLogoUrlSmall ? (
                  <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none bg-slate-900 dark:bg-white" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-[8px] font-black shrink-0 shadow-sm dark:shadow-none">H</div>
                )}
                <span className="text-[12px] font-semibold text-gray-900 dark:text-white leading-none">Hedera</span>
              </div>
            </div>
          </div>

          {/* Deposit Input Area */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Deposit Amount</label>
            <div className="flex items-center justify-between w-full h-[96px] px-5 bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/10 rounded-[12px] transition-all duration-200 hover:border-slate-300 dark:hover:border-white/20 focus-within:border-[#00A8E8] focus-within:ring-4 focus-within:ring-[#00A8E8]/10">
              
              {/* Left Side: Input & USD Value */}
              <div className="flex flex-col justify-center h-full flex-1">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[36px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-1" 
                />
                <span className="text-[12px] font-bold text-slate-400 dark:text-white/40 ml-1">$0.00</span>
              </div>

              {/* Right Side: Token Selector & Percentages */}
              <div className="flex flex-col items-end justify-center h-full shrink-0">
                
                <div className="relative mb-[12px]" ref={dropdownRef}>
                  {/* Token Selector Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between gap-1 px-3 py-1.5 w-[96px] rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  >
                    {activeToken === 'HBAR' && !isLogosLoading && hbarLogoUrlSmall ? (
                      <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'USDT' && !isLogosLoading && usdtLogoUrlSmall ? (
                      <img src={usdtLogoUrlSmall} alt="USDT Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'USDC' && !isLogosLoading && usdcLogoUrlSmall ? (
                      <img src={usdcLogoUrlSmall} alt="USDC Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'SAUCE' && !isLogosLoading && sauceLogoUrlSmall ? (
                      <img src={sauceLogoUrlSmall} alt="SAUCE Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'PACK' && !isLogosLoading && packLogoUrlSmall ? (
                      <img src={packLogoUrlSmall} alt="PACK Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'WBTC' && !isLogosLoading && wbtcLogoUrlSmall ? (
                      <img src={wbtcLogoUrlSmall} alt="WBTC Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'WETH' && !isLogosLoading && wethLogoUrlSmall ? (
                      <img src={wethLogoUrlSmall} alt="WETH Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'BONZO' && !isLogosLoading && bonzoLogoUrlSmall ? (
                      <img src={bonzoLogoUrlSmall} alt="BONZO Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : activeToken === 'JAM' && !isLogosLoading && jamLogoUrlSmall ? (
                      <img src={jamLogoUrlSmall} alt="JAM Logo" className="w-4 h-4 rounded-full object-cover shrink-0 shadow-sm dark:shadow-none" />
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-[#1F2937] text-slate-900 dark:text-white flex items-center justify-center text-[10px] font-black shrink-0">{activeToken.charAt(0)}</span>
                    )}
                    <span className="text-[12px] font-bold text-gray-900 dark:text-white leading-none">{activeToken}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-500 dark:text-white/60 ml-0.5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </div>

                  {/* Token Dropdown Menu */}
                  <div 
                    className={`absolute top-full right-0 mt-2 w-[220px] bg-white dark:bg-[#0F141A] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-xl shadow-lg dark:shadow-[0_0_10px_rgba(0,168,232,0.1)] z-50 transition-all duration-150 ease-out origin-top-right ${isDropdownOpen ? 'translate-y-0 scale-100 opacity-100 pointer-events-auto' : 'translate-y-1 scale-95 opacity-0 pointer-events-none'}`}
                  >
                    <div className="flex flex-col gap-0.5 max-h-[280px] overflow-y-auto p-1.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full">
                      {TOKENS.map(token => (
                        <div 
                          key={token}
                          onClick={() => { setActiveToken(token); setIsDropdownOpen(false); }}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 group outline-none focus:outline-none focus:ring-0 ${activeToken === token ? 'bg-[#00A8E8]/10 dark:bg-[#00A8E8]/20' : 'hover:bg-slate-50 dark:hover:bg-[#00A8E8]/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            {token === 'HBAR' && !isLogosLoading && hbarLogoUrlSmall ? (
                              <img src={hbarLogoUrlSmall} alt="HBAR Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'USDT' && !isLogosLoading && usdtLogoUrlSmall ? (
                              <img src={usdtLogoUrlSmall} alt="USDT Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'USDC' && !isLogosLoading && usdcLogoUrlSmall ? (
                              <img src={usdcLogoUrlSmall} alt="USDC Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'SAUCE' && !isLogosLoading && sauceLogoUrlSmall ? (
                              <img src={sauceLogoUrlSmall} alt="SAUCE Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'PACK' && !isLogosLoading && packLogoUrlSmall ? (
                              <img src={packLogoUrlSmall} alt="PACK Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'WBTC' && !isLogosLoading && wbtcLogoUrlSmall ? (
                              <img src={wbtcLogoUrlSmall} alt="WBTC Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'WETH' && !isLogosLoading && wethLogoUrlSmall ? (
                              <img src={wethLogoUrlSmall} alt="WETH Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'BONZO' && !isLogosLoading && bonzoLogoUrlSmall ? (
                              <img src={bonzoLogoUrlSmall} alt="BONZO Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : token === 'JAM' && !isLogosLoading && jamLogoUrlSmall ? (
                              <img src={jamLogoUrlSmall} alt="JAM Logo" className="w-6 h-6 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#1F2937] text-slate-900 dark:text-white flex items-center justify-center text-[12px] font-black shrink-0">{token.charAt(0)}</span>
                            )}
                            <span className={`text-[13px] font-bold ${activeToken === token ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white group-hover:text-[#00A8E8] dark:group-hover:text-[#00A8E8]'}`}>{token}</span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`text-[12px] font-semibold ${activeToken === token ? 'text-[#00A8E8]/80' : 'text-slate-600 dark:text-white/70 group-hover:text-[#00A8E8]/80 dark:group-hover:text-[#00A8E8]/80'}`}>
                              {token === 'HBAR' ? (balance || "0.00") : "0.00"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shortcut Buttons */}
                <div className="flex items-center justify-between w-[96px]">
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === '25%' ? null : '25%')}
                    className={`text-[11px] font-bold px-2 py-1 rounded-[6px] transition-colors duration-200 ${selectedPercent === '25%' ? 'bg-[#00A8E8] text-white' : 'text-[#00A8E8] hover:bg-[#00A8E8]/10'}`}>25%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === '50%' ? null : '50%')}
                    className={`text-[11px] font-bold px-2 py-1 rounded-[6px] transition-colors duration-200 ${selectedPercent === '50%' ? 'bg-[#00A8E8] text-white' : 'text-[#00A8E8] hover:bg-[#00A8E8]/10'}`}>50%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === 'MAX' ? null : 'MAX')}
                    className={`text-[11px] font-bold px-2 py-1 rounded-[6px] transition-colors duration-200 ${selectedPercent === 'MAX' ? 'bg-[#00A8E8] text-white' : 'text-[#00A8E8] hover:bg-[#00A8E8]/10'}`}>MAX</button>
                </div>
              </div>

            </div>
          </div>

          {/* Lock Period Selector */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Lock for (days)</label>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
              {[7, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => setDisplayLockDays(days)}
                  className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-bold transition-all duration-200 border ${displayLockDays === days ? 'bg-[#00A8E8] border-[#00A8E8] text-white shadow-sm shadow-inner' : 'bg-white dark:bg-[#0B0F14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:border-[#00A8E8]/50 hover:text-[#00A8E8] hover:shadow-md'}`}
                >
                  {days} Days
                </button>
              ))}
              <div className="flex-1">
                <div className={`flex items-center px-3 h-10 bg-white dark:bg-[#0B0F14] border rounded-[8px] transition-all duration-200 ${![7,30,60].includes(displayLockDays) ? 'border-[#00A8E8] shadow-sm shadow-inner' : 'border-slate-200 dark:border-white/10 focus-within:border-[#00A8E8]/50 hover:shadow-md'}`}>
                  <input 
                    type="number"
                    placeholder="Custom"
                    className="bg-transparent outline-none border-none text-[13px] font-bold w-full text-center text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/50 p-0 m-0 leading-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) setDisplayLockDays(val);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Estimated APY Block */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Estimated APY</label>
            <div className="flex items-center justify-between w-full pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">7 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">1.20%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">30 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">3.30%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">60 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">5.40%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">Custom</span>
                <span className="text-[14px] font-bold text-slate-400 dark:text-white/40">--</span>
              </div>
            </div>
          </div>

          {/* Warning Text */}
          <div className="flex items-start gap-2 mb-6 bg-red-50 dark:bg-red-500/10 p-3 rounded-[12px] border border-red-100 dark:border-red-500/20">
            <Warning size={16} weight="regular" className="text-red-500 mt-[1px] shrink-0 animate-pulse-once" />
            <span className="text-[12px] font-medium text-red-600 dark:text-red-400 leading-snug">Withdrawing before maturity incurs a 5% fee and forfeits pending yield.</span>
          </div>

          {/* Summary Row */}
          <div className="flex flex-col gap-3 w-full mb-6 pt-2">
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Lock Period</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{displayLockDays} Days</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Maturity Date</span>
              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{formattedMaturityDate}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[12px] font-semibold text-slate-500 dark:text-white/50">Estimated Earnings</span>
              <span className="text-[13px] font-bold text-[#10B981]">+4.50 {activeToken}</span>
            </div>
          </div>

          {/* Deposit / Withdraw Buttons */}
          <div className="mt-auto pt-4 w-full">
            {hasDeposited ? (
              <div className="flex items-center gap-4 w-full animate-fade-in-up">
                <button 
                  className="flex-1 h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white"
                >
                  Deposit
                </button>
                <button 
                  className="flex-1 h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 active:scale-[0.98] tracking-wide bg-[#00A8E8] hover:bg-[#0090C7] text-white shadow-sm hover:shadow-md hover:brightness-105"
                >
                  Withdraw
                </button>
              </div>
            ) : (
              <div className="relative w-full">
                {isSuccess && <div className="absolute inset-0 rounded-[8px] bg-[#16C784]/20 animate-pulse-ring z-0 pointer-events-none"></div>}
                <button 
                  disabled={isProcessing || isSuccess}
                  onClick={() => {
                    if (Number(depositAmount) > 0) {
                      setIsProcessing(true);
                      setTimeout(() => {
                        setIsProcessing(false);
                        setIsSuccess(true);
                        setTimeout(() => {
                          setHasDeposited(true);
                          setShowNewVault(true);
                          const amount = parseFloat(depositAmount) || 0;
                          setPortfolioValue(prev => prev + amount);
                          setTimeout(() => setIsSuccess(false), 2000);
                        }, 1500);
                      }, 1500);
                    }
                  }}
                  className={`relative z-10 w-full h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-300 tracking-wide overflow-hidden shadow-sm hover:brightness-105 hover:shadow-md ${!isProcessing && !isSuccess ? 'active:scale-[0.98]' : ''} ${isSuccess ? 'bg-[#16C784] text-white border border-[#16C784]' : 'bg-[#00A8E8] hover:bg-[#0090C7] text-white border border-[#00A8E8]'}`}
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <CircleNotch size={18} className="animate-spin" weight="bold" />
                      <span>Processing...</span>
                    </div>
                  ) : isSuccess ? (
                    <div className="flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M5 13l4 4L19 7" strokeDasharray="24" strokeDashoffset="24" className="animate-draw" />
                      </svg>
                      <span>Deposited Successfully</span>
                    </div>
                  ) : (
                    <span>Deposit to Vault</span>
                  )}
                </button>
              </div>
            )}
          </div>

          </div>
        </div>
      </div>

      {/* ACTIVE VAULTS MODULE */}
      <div className="w-full mb-8">
        <h3 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white mb-4">Your Active Vaults</h3>
        <div className="bg-white dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Amount Locked</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">APY</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Accrued Yield</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Unlocks On</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {/* Dynamic New Vault Row */}
                {showNewVault && (
                  <tr className="animate-fade-in-up hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        {activeToken === 'HBAR' && hbarLogoUrlSmall ? <img src={hbarLogoUrlSmall} alt="HBAR" className="w-8 h-8 rounded-full" /> :
                         activeToken === 'USDT' && usdtLogoUrlSmall ? <img src={usdtLogoUrlSmall} alt="USDT" className="w-8 h-8 rounded-full" /> :
                         activeToken === 'USDC' && usdcLogoUrlSmall ? <img src={usdcLogoUrlSmall} alt="USDC" className="w-8 h-8 rounded-full" /> :
                         activeToken === 'SAUCE' && sauceLogoUrlSmall ? <img src={sauceLogoUrlSmall} alt="SAUCE" className="w-8 h-8 rounded-full" /> :
                         activeToken === 'PACK' && packLogoUrlSmall ? <img src={packLogoUrlSmall} alt="PACK" className="w-8 h-8 rounded-full" /> :
                         <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[12px] font-black">{activeToken.charAt(0)}</div>}
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-bold text-slate-900 dark:text-white">{Number(depositAmount).toLocaleString('en-US')} {activeToken}</span>
                        <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">${(parseFloat(depositAmount) * 0.089).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-bold text-[#10B981]">{[7,30,60].includes(displayLockDays) ? (displayLockDays === 7 ? '1.20%' : displayLockDays === 30 ? '3.30%' : '5.40%') : '--'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[14px] font-bold text-[#10B981]">0.00 {activeToken}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80">{formattedMaturityDate}</span>
                    </td>
                    <td className="px-6 py-5 min-w-[140px]">
                      <div className="flex flex-col gap-1.5 w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">0%</span>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40">{displayLockDays} days left</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-[12px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-[8px] transition-colors hover:shadow-sm">
                        Emergency Unlock
                      </button>
                    </td>
                  </tr>
                )}
                {/* Vault Row 1 */}
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {hbarLogoUrlSmall ? (
                        <img src={hbarLogoUrlSmall} alt="HBAR" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[12px] font-black">H</div>
                      )}
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">HBAR</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">5,000 HBAR</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$445.00</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-bold text-[#10B981]">1.20%</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-bold text-[#10B981]">+12.5 HBAR</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80">Oct 25, 2024</span>
                  </td>
                  <td className="px-6 py-5 min-w-[140px]">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">15%</span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40">6 days left</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '15%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-[12px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-[8px] transition-colors">
                      Emergency Unlock
                    </button>
                  </td>
                </tr>

                {/* Vault Row 2 */}
                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      {usdcLogoUrlSmall ? (
                        <img src={usdcLogoUrlSmall} alt="USDC" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[12px] font-black">U</div>
                      )}
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">USDC</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-slate-900 dark:text-white">1,250 USDC</span>
                      <span className="text-[12px] font-medium text-slate-500 dark:text-white/50">$1,250.00</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-bold text-[#10B981]">5.40%</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[14px] font-bold text-[#10B981]">+3.2 USDC</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-white/80">Nov 12, 2024</span>
                  </td>
                  <td className="px-6 py-5 min-w-[140px]">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[11px] font-bold text-slate-500 dark:text-white/50">45%</span>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-white/40">33 days left</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="text-[12px] font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-[8px] transition-colors">
                      Emergency Unlock
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
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
              <span className="text-[32px] font-bold text-slate-900 dark:text-white tracking-tight drop-shadow-sm">${animatedPortfolioValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              
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
