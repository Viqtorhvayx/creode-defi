/* Credit this code to Viqtorhvayx on GitHub */
// Code credited and implemented, including this specific token replacement and API update, by Viqtorhvayx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { TOKEN_MAPPINGS, SaucerSwapToken } from '../utils/tokenMapping';
import { createPortal } from 'react-dom';
import { PriceChart } from './PriceChart';
import { useWallet } from '../context/WalletContext';
import { ShieldCheck, LockKey, Warning, CalendarBlank, ChartLineUp, CaretUp, CaretDown, Percent, ArrowsClockwise, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { CustomVaultIcon } from './CustomVaultIcon';
import { ChevronDown, X, Info } from 'lucide-react';
import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { useWalletClient } from 'wagmi';
import vaultArtifact from '../context/abis.json';

// EVM token addresses on Hedera Testnet (address(0) = native HBAR)
const TOKEN_EVM_ADDRESSES: Record<string, string> = {
  HBAR:  '0x0000000000000000000000000000000000000000',
  USDC:  '0x000000000000000000000000000000000006f89a',
  USDT:  '0x0000000000000000000000000000000000019c4c',
  SAUCE: '0x00000000000000000000000000000000000b2ad5',
  PACK:  '0x0000000000000000000000000000000000492a28',
  JAM:   '0x0000000000000000000000000000000000138334',
  WETH:  '0x00000000000000000000000000000000000D235E',
  WBTC:  '0x00000000000000000000000000000000001008C6',
  BONZO: '0x0000000000000000000000000000000016450E2',
};
const TOKEN_DECIMALS: Record<string, number> = {
  HBAR: 8, USDC: 6, USDT: 6, SAUCE: 6, PACK: 6, JAM: 6, WETH: 8, WBTC: 8, BONZO: 6,
};
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

interface VaultTabProps {
  theme: 'light' | 'dark';
}


const getBaseRates = (token: string) => {
  const t = token.toUpperCase();
  if (['USDT', 'USDC'].includes(t)) return { d7: 4.0, d30: 6.5, d60: 9.0 };
  if (['SAUCE', 'PACK', 'BONZO', 'JAM'].includes(t)) return { d7: 8.0, d30: 14.0, d60: 22.0 };
  // Default to Blue-Chip
  return { d7: 3.5, d30: 5.5, d60: 8.0 };
};

const calculateAPY = (token: string, days: number): string => {
  if (!days || days <= 0) return '--';
  const rates = getBaseRates(token);
  
  if (days === 7) return rates.d7.toFixed(2) + '%';
  if (days === 30) return rates.d30.toFixed(2) + '%';
  if (days === 60) return rates.d60.toFixed(2) + '%';
  
  let rate = 0;
  if (days < 7) {
    rate = (rates.d7 / 7) * days;
  } else if (days < 30) {
    rate = rates.d7 + ((rates.d30 - rates.d7) * (days - 7)) / (30 - 7);
  } else if (days < 60) {
    rate = rates.d30 + ((rates.d60 - rates.d30) * (days - 30)) / (60 - 30);
  } else {
    rate = rates.d60 + ((rates.d60 - rates.d30) * (days - 60)) / (60 - 30);
  }
  
  return rate.toFixed(2) + '%';
};

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  const [selectedPercent, setSelectedPercent] = useState<string | null>(null);
  const [isSetSelected, setIsSetSelected] = useState<boolean>(false);
  const [lockDaysInput, setLockDaysInput] = useState<string>('30');
  const [displayLockDays, setDisplayLockDays] = useState<number>(30);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [hasDeposited, setHasDeposited] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showNewVault, setShowNewVault] = useState<boolean>(false);


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

  const { balance, isConnected } = useWallet();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const TOKENS = ['HBAR', 'USDT', 'USDC', 'SAUCE', 'PACK', 'WBTC', 'WETH', 'BONZO', 'JAM'];
  const [activeToken, setActiveToken] = useState('HBAR');
  const [tokenPriceUsd, setTokenPriceUsd] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const fetchPrice = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_SAUCERSWAP_API_KEY || '';
        const headers: Record<string, string> = apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {};
        
        const res = await fetch('https://api.saucerswap.finance/tokens', { headers });
        
        if (!res.ok) {
          // Fallback to mock prices if unauthorized (SaucerSwap API requires key)
          const mockPrices: Record<string, number> = {
            'HBAR': 0.05,
            'USDC': 1.00,
            'USDT': 1.00,
            'SAUCE': 0.03,
            'DOVU': 0.001,
            'PACK': 0.0001,
            'WETH': 3000.00,
            'WBTC': 60000.00,
            'JAM': 0.002,
            'BONZO': 0.0005
          };
          setTokenPriceUsd(mockPrices[activeToken] || 0);
          return;
        }
        
        const data = await res.json();
        
        if (Array.isArray(data)) {
          const tokenId = TOKEN_MAPPINGS[activeToken] || TOKEN_MAPPINGS['HBAR'];
          const tokenData = data.find((t: SaucerSwapToken) => t.id === tokenId || t.symbol === activeToken);
          
          if (tokenData && tokenData.priceUsd) {
            setTokenPriceUsd(Number(tokenData.priceUsd));
          }
        }
      } catch (err) {
        console.error("Failed to fetch token price", err);
      }
    };

    fetchPrice();
    interval = setInterval(fetchPrice, 15000); // 15 seconds polling

    return () => clearInterval(interval);
  }, [activeToken]);

  const fiatDisplayValue = (Number(depositAmount || 0) * tokenPriceUsd).toFixed(2);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempCustomDays, setTempCustomDays] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  const { data: walletClient } = useWalletClient();

  const handleDeposit = async () => {
    if (Number(depositAmount) <= 0) return;
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first.');
      return;
    }

    const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
    if (!vaultAddress) {
      alert('Vault contract address not configured.');
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const vault = new Contract(vaultAddress, (vaultArtifact as any).CreodeVault, signer);

      const tokenEvm = TOKEN_EVM_ADDRESSES[activeToken] || TOKEN_EVM_ADDRESSES['HBAR'];
      const decimals = TOKEN_DECIMALS[activeToken] ?? 8;
      const amountParsed = parseUnits(depositAmount, decimals);
      const durationDays = displayLockDays;

      let tx;

      if (activeToken === 'HBAR') {
        tx = await vault.deposit(tokenEvm, 0, durationDays, { value: amountParsed });
      } else {
        const tokenContract = new Contract(tokenEvm, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(vaultAddress, amountParsed);
        await approveTx.wait();
        tx = await vault.deposit(tokenEvm, amountParsed, durationDays);
      }

      await tx.wait();

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setHasDeposited(true);
        setIsSuccess(false);
        setDepositAmount('');
        setShowNewVault(true);
      }, 1500);

    } catch (err) {
      setIsProcessing(false);
      const e = err as any;
      console.error('[Vault] Deposit failed:', e);
      alert('Deposit failed: ' + (e?.reason || e?.message || 'Unknown error'));
    }
  };

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
            <div className="flex items-center justify-between w-full h-[96px] px-5 bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/10 rounded-[12px] transition-all">
              
              {/* Left Side: Input & USD Value */}
              <div className="flex flex-col justify-center h-full flex-1">
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-transparent outline-none focus:outline-none focus:ring-0 border-none text-[36px] font-bold w-full text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-white/20 leading-none m-0 p-0 mb-1" 
                />
                <span className="text-[12px] font-bold text-slate-400 dark:text-white/40 ml-1">${fiatDisplayValue}</span>
              </div>

              {/* Right Side: Token Selector & Percentages */}
              <div className="flex flex-col items-end justify-center h-full shrink-0">
                
                <div className="relative mb-[12px]" ref={dropdownRef}>
                  {/* Token Selector Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center justify-between gap-1 px-3 py-1.5 w-[96px] rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-md cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
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
                    className={`absolute top-full right-0 mt-2 w-[220px] border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl rounded-xl z-50 transition-all duration-200 ease-in-out origin-top-right ${isDropdownOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'}`}
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
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '25%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-[#00A8E8] dark:text-[#00A8E8] hover:text-[#00A8E8]/80 dark:hover:text-[#00A8E8]/80'}`}>25%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === '50%' ? null : '50%')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '50%' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-[#00A8E8] dark:text-[#00A8E8] hover:text-[#00A8E8]/80 dark:hover:text-[#00A8E8]/80'}`}>50%</button>
                  <button 
                    onClick={() => setSelectedPercent(prev => prev === 'MAX' ? null : 'MAX')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === 'MAX' ? 'text-[#00A8E8] dark:text-[#00A8E8]' : 'text-[#00A8E8] dark:text-[#00A8E8] hover:text-[#00A8E8]/80 dark:hover:text-[#00A8E8]/80'}`}>MAX</button>
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
                  className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-bold transition-all duration-150 ease-out border hover:shadow-md active:shadow-inner active:duration-100 ${displayLockDays === days ? 'bg-[#00A8E8] border-[#00A8E8] text-white shadow-sm' : 'bg-white dark:bg-[#0B0F14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:border-[#00A8E8]/50 hover:text-[#00A8E8]'}`}
                >
                  {days} Days
                </button>
              ))}
              <div className="flex-1 flex">
                <button
                  onClick={() => {
                    setTempCustomDays(![7, 30, 60].includes(displayLockDays) ? displayLockDays.toString() : '');
                    setIsCustomModalOpen(true);
                  }}
                  className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-bold transition-all duration-150 ease-out border hover:shadow-md active:shadow-inner active:duration-100 ${![7, 30, 60].includes(displayLockDays) ? 'bg-[#00A8E8] border-[#00A8E8] text-white shadow-sm' : 'bg-white dark:bg-[#0B0F14] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:border-[#00A8E8]/50 hover:text-[#00A8E8]'}`}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>

          {/* Estimated APY Block */}
          <div className="flex flex-col w-full mb-6">
            <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80 mb-2">Estimated APY</label>
            <div className="flex items-center justify-between w-full pb-5 border-b border-slate-100 dark:border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">7 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 7)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">30 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 30)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">60 Days</span>
                <span className="text-[14px] font-bold text-[#10B981]">{calculateAPY(activeToken, 60)}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-semibold text-slate-600 dark:text-white/50 mb-1">Custom</span>
                <span className={`text-[14px] font-bold ${![7, 30, 60].includes(displayLockDays) ? 'text-[#10B981]' : 'text-slate-400 dark:text-white/40'}`}>
                  {![7, 30, 60].includes(displayLockDays) ? calculateAPY(activeToken, displayLockDays) : '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Warning Text */}
          <div className="flex items-start gap-2 mb-6 bg-red-50 dark:bg-red-500/10 p-3 rounded-[12px] border border-red-100 dark:border-red-500/20">
            <Warning size={16} weight="regular" className="text-red-500 mt-[1px] shrink-0 animate-pulse-once" />
            <span className="text-[12px] font-medium text-red-600 dark:text-red-400 leading-snug">Early withdrawal incurs a time-decay penalty of up to 2% on principal. Accrued yield is still paid out in full.</span>
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
            <button 
              onClick={handleDeposit}
              disabled={isProcessing || isSuccess}
              className={`w-full h-12 rounded-[8px] text-[15px] font-bold flex items-center justify-center transition-all duration-100 ease-in active:scale-[0.98] tracking-wide shadow-sm relative ${
                isSuccess 
                  ? 'bg-emerald-500 text-white pointer-events-none' 
                  : isProcessing 
                    ? 'bg-[#00A8E8]/80 text-white cursor-not-allowed' 
                    : 'bg-[#00A8E8] hover:bg-[#0090C7] hover:brightness-105 hover:shadow-md text-white'
              }`}
            >
              {isSuccess && (
                <div className="absolute inset-0 rounded-[8px] bg-emerald-500 animate-ping-once pointer-events-none"></div>
              )}
              
              {isProcessing ? (
                <div className="flex items-center gap-2 z-10">
                  <CircleNotch size={18} weight="bold" className="animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : isSuccess ? (
                <div className="flex items-center gap-2 z-10">
                  <CheckCircle size={18} weight="bold" />
                  <span>Deposited Successfully</span>
                </div>
              ) : (
                <span className="z-10">Deposit to Vault</span>
              )}
            </button>
          </div>

          </div>
        </div>
      </div>

      {/* ACTIVE VAULTS MODULE */}
      <div className="w-full mb-8">
        <h3 className="text-[18px] font-bold tracking-tight text-slate-900 dark:text-white mb-4">Your Active Vaults</h3>
        <div className="bg-white dark:bg-[#0B0F14] border border-slate-100 dark:border-white/5 rounded-[16px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-transparent">
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Asset</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Amount Locked</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">APY</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Accrued Yield</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Unlocks On</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Progress</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Status</th>
                  <th className="px-6 py-4 text-[12px] font-medium text-slate-500 dark:text-white/50 text-center tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {/* Newly Deposited Vault (Animated) */}
                {showNewVault && (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center justify-center gap-3">
                        {activeToken === 'HBAR' && hbarLogoUrlSmall ? (
                          <img src={hbarLogoUrlSmall} alt="HBAR" className="w-7 h-7 rounded-full" />
                        ) : activeToken === 'USDT' && usdtLogoUrlSmall ? (
                          <img src={usdtLogoUrlSmall} alt="USDT" className="w-7 h-7 rounded-full" />
                        ) : activeToken === 'USDC' && usdcLogoUrlSmall ? (
                          <img src={usdcLogoUrlSmall} alt="USDC" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">{activeToken.charAt(0)}</div>
                        )}
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">{activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[13px] font-medium text-slate-900 dark:text-white">{depositAmount || '0'} {activeToken}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">{calculateAPY(activeToken, displayLockDays)}</span>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-[#10B981]">+0.00 {activeToken}</span>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">{formattedMaturityDate}</span>
                    </td>
                    <td className="px-6 py-5 align-middle">
                      <div className="flex items-center justify-center gap-3 w-full">
                        <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">0%</span>
                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00A8E8] rounded-full transition-all duration-1000 ease-out" style={{ width: '0%' }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-middle text-center">
                      <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                        Unlock
                      </button>
                    </td>
                  </tr>
                )}

                {/* Hardcoded Row 1 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      {hbarLogoUrlSmall ? (
                        <img src={hbarLogoUrlSmall} alt="HBAR" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">H</div>
                      )}
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">HBAR</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">1,000.00 HBAR</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">8.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+45.32 HBAR</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">15th, Aug, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">65%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 2 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      {usdcLogoUrlSmall ? (
                        <img src={usdcLogoUrlSmall} alt="USDC" className="w-7 h-7 rounded-full" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">U</div>
                      )}
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">USDC</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">500.00 USDC</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">6.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+15.25 USDC</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">22nd, Jul, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">38%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '38%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 3 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#00A8E8]/10 text-[#00A8E8] flex items-center justify-center text-[12px] font-black">
                        D
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">DOVU</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">2,000.00 DOVU</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">12.00%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+120.75 DOVU</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">05th, Sep, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">42%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '42%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
                    </button>
                  </td>
                </tr>

                {/* Hardcoded Row 4 */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center text-[12px] font-black">
                        W
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">wETH</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">0.7500 wETH</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">7.50%</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-[#10B981]">+0.0421 wETH</span>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">30th, Jul, 2026</span>
                  </td>
                  <td className="px-6 py-5 align-middle">
                    <div className="flex items-center justify-center gap-3 w-full">
                      <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">55%</span>
                      <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: '55%' }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-[#00A8E8]/30 bg-[#00A8E8]/5">
                        <span className="text-[12px] font-medium text-[#00A8E8]">Locked</span>
                      </div>
                  </td>
                  <td className="px-6 py-5 align-middle text-center">
                    <button className="w-[120px] h-[34px] text-[12px] font-medium text-red-500 border border-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center mx-auto">
                      Unlock
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

      {/* Custom Duration Modal */}
      {isMounted && isCustomModalOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
          <div className="bg-white dark:bg-[#0F141A] rounded-[16px] border border-slate-200 dark:border-white/10 p-6 sm:p-8 w-full max-w-sm relative shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col items-center text-center">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsCustomModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white/80 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-[#00A8E8]/10 flex items-center justify-center mb-5 text-[#00A8E8]">
              <CalendarBlank size={32} weight="bold" />
            </div>

            <h3 className="text-[20px] font-bold text-slate-900 dark:text-white mb-2">Set Custom Duration</h3>
            <p className="text-[14px] text-slate-500 dark:text-white/60 mb-6">Enter the number of days you want to lock your HBAR.</p>

            {/* Input Box */}
            <div className="w-full flex items-center bg-white dark:bg-[#0B0F14] border border-slate-200 dark:border-white/10 rounded-[12px] px-4 py-3 mb-4 focus-within:border-[#00A8E8] transition-colors">
              <input 
                type="number"
                placeholder="Enter number of days"
                value={tempCustomDays}
                onChange={(e) => setTempCustomDays(e.target.value)}
                className="bg-transparent outline-none border-none text-[15px] font-medium w-full text-left text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-[14px] font-semibold text-slate-500 dark:text-white/50 ml-2">Days</span>
            </div>

            {/* Helper Text */}
            <div className="flex items-start gap-2 w-full mb-8 text-left">
              <Info size={14} className="text-slate-400 dark:text-white/40 shrink-0 mt-0.5" />
              <p className="text-[12px] text-slate-500 dark:text-white/50 leading-tight">APY varies based on number of days and tokens chosen.</p>
            </div>

            {/* Action Button */}
            <button 
              onClick={() => {
                const val = parseInt(tempCustomDays);
                if (!isNaN(val) && val > 0) {
                  setDisplayLockDays(val);
                  setIsCustomModalOpen(false);
                }
              }}
              className="w-full py-3.5 bg-[#00A8E8] hover:bg-[#0092C8] text-white text-[15px] font-bold rounded-[8px] transition-colors shadow-sm"
            >
              Set
            </button>
          </div>
        </div>,
        document.body
      )}
      
    </div>
  );
};
