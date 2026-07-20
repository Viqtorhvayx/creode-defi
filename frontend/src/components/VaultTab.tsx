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
import { TokenLogo } from './TokenLogo';
import { CTA_BLUE, CTA_RED, CTA_GREEN_SOLID, TOKEN_PILL, seg } from '../lib/ui';
import { ChevronDown, X, Info } from 'lucide-react';
import { BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import { useWalletClient } from 'wagmi';
import vaultArtifact from '../context/abis.json';

// Assets: native HBAR (address(0)) + 8 HTS tokens. HTS tokens expose the ERC20
// interface at their EVM address, so the wallet signs a normal approval and the
// vault pulls via transferFrom. Native HBAR uses msg.value (no approval, no wrap).
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const TOKEN_EVM_ADDRESSES: Record<string, string> = {
  HBAR:  ZERO_ADDRESS, // native HBAR
  USDC:  '0x000000000000000000000000000000000092e8A7',
  USDT:  '0x000000000000000000000000000000000092E8a8',
  SAUCE: '0x000000000000000000000000000000000092e8A9',
  PACK:  '0x000000000000000000000000000000000092e8aB',
  JAM:   '0x000000000000000000000000000000000092E8aC',
  WETH:  '0x000000000000000000000000000000000092E8Ae',
  WBTC:  '0x000000000000000000000000000000000092e8b1',
  BONZO: '0x000000000000000000000000000000000092e8B3',
};
// Decimals of the values STORED on-chain / read back. Native HBAR principal is
// held in tinybar (8dp); the deposit *value* and wallet balance are 18dp (weibar)
// and handled explicitly where sent/read.
const TOKEN_DECIMALS: Record<string, number> = {
  HBAR: 8, USDC: 6, USDT: 6, SAUCE: 6, PACK: 6, JAM: 6, WETH: 8, WBTC: 8, BONZO: 6,
};
// Reverse lookup: lowercased EVM address -> symbol (address(0) => HBAR).
const SYMBOL_BY_ADDRESS: Record<string, string> = Object.entries(TOKEN_EVM_ADDRESSES).reduce(
  (acc, [sym, addr]) => { acc[addr.toLowerCase()] = sym; return acc; },
  {} as Record<string, string>
);
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address owner) external view returns (uint256)',
];
const VAULT_ABI = (vaultArtifact as any).CreodeVault;
const MAX_LOCK_DAYS = 365; // guard against nonsensical durations / APY extrapolation

// A single on-chain deposit row, normalised for display.
interface VaultRow {
  id: string;
  symbol: string;
  amount: string;       // human-readable principal
  apyPct: number;       // e.g. 6.5
  accruedYield: string; // human-readable
  maturityLabel: string;
  progressPct: number;
  matured: boolean;
}

// Client-side mirror of the contract's yield math (capped at the full term).
const computeAccruedYield = (
  principal: bigint,
  apyBps: bigint,
  startTs: bigint,
  maturityTs: bigint
): bigint => {
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const duration = maturityTs - startTs;
  if (duration <= 0n) return 0n;
  let elapsed = nowSec - startTs;
  if (elapsed < 0n) elapsed = 0n;
  if (elapsed > duration) elapsed = duration;
  return (principal * apyBps * elapsed) / (10000n * 31536000n);
};

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

// Numeric variant of calculateAPY (percent, e.g. 6.5). Returns 0 for invalid input.
const getApyPercent = (token: string, days: number): number => {
  const parsed = parseFloat(calculateAPY(token, days));
  return isNaN(parsed) ? 0 : parsed;
};

export const VaultTab: React.FC<VaultTabProps> = ({ theme }) => {
  const [selectedPercent, setSelectedPercent] = useState<string | null>(null);
  const [isSetSelected, setIsSetSelected] = useState<boolean>(false);
  const [lockDaysInput, setLockDaysInput] = useState<string>('30');
  const [displayLockDays, setDisplayLockDays] = useState<number>(30);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Live on-chain vault state.
  const [vaults, setVaults] = useState<VaultRow[]>([]);
  const [isLoadingVaults, setIsLoadingVaults] = useState<boolean>(false);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  // Live wallet balances for each supported token (keyed by symbol).
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  // Per-token minimum deposit (human units), read from the vault config.
  const [minDeposits, setMinDeposits] = useState<Record<string, number>>({});


  // Default to bundled real logos (public/tokens/*.png) so token icons always render.
  const [hbarLogoUrlSmall, setHbarLogoUrlSmall] = useState<string | null>('/tokens/hbar.png');
  const [usdtLogoUrlSmall, setUsdtLogoUrlSmall] = useState<string | null>('/tokens/usdt.png');
  const [usdcLogoUrlSmall, setUsdcLogoUrlSmall] = useState<string | null>('/tokens/usdc.png');
  const [sauceLogoUrlSmall, setSauceLogoUrlSmall] = useState<string | null>('/tokens/sauce.png');
  const [packLogoUrlSmall, setPackLogoUrlSmall] = useState<string | null>('/tokens/pack.png');
  const [wbtcLogoUrlSmall, setWbtcLogoUrlSmall] = useState<string | null>('/tokens/wbtc.png');
  const [wethLogoUrlSmall, setWethLogoUrlSmall] = useState<string | null>('/tokens/weth.png');
  const [bonzoLogoUrlSmall, setBonzoLogoUrlSmall] = useState<string | null>('/tokens/bonzo.png');
  const [jamLogoUrlSmall, setJamLogoUrlSmall] = useState<string | null>('/tokens/jam.png');
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
  // Env override wins; committed fallback keeps the live site working without
  // relying on a NEXT_PUBLIC_VAULT_ADDRESS being set in the host (e.g. Vercel).
  // Hard-coded to the deployed testnet vault so no stale host env var can
  // override it (a NEXT_PUBLIC_VAULT_ADDRESS override repeatedly pointed the
  // live site at the wrong contract). Change here on redeploy.
  const vaultAddress = '0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139';
  const rpcUrl = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';

  // Estimated earnings for the current deposit form (principal * APY * term/365).
  const estimatedEarnings =
    Number(depositAmount || 0) * (getApyPercent(activeToken, displayLockDays) / 100) * (displayLockDays / 365);

  // Fetch the connected user's live deposits from the vault (read-only RPC).
  const fetchVaults = React.useCallback(async () => {
    const userAddr = walletClient?.account?.address;
    if (!userAddr || !vaultAddress) {
      setVaults([]);
      return;
    }
    setIsLoadingVaults(true);
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const vault = new Contract(vaultAddress, VAULT_ABI, provider);
      const [ids, records] = await vault.getUserDeposits(userAddr);

      const nowSec = Math.floor(Date.now() / 1000);
      const rows: VaultRow[] = [];
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        if (r.withdrawn || r.principal === 0n) continue;

        const tokenAddr = String(r.token).toLowerCase();
        const symbol = SYMBOL_BY_ADDRESS[tokenAddr] || `${tokenAddr.slice(0, 6)}…`;
        const decimals = TOKEN_DECIMALS[symbol] ?? 18;

        const start = Number(r.startTimestamp);
        const maturity = Number(r.maturityTimestamp);
        const matured = nowSec >= maturity;
        const progressPct = maturity > start
          ? Math.min(100, Math.max(0, Math.round(((nowSec - start) / (maturity - start)) * 100)))
          : 0;

        const yieldRaw = computeAccruedYield(r.principal, r.apyBps, r.startTimestamp, r.maturityTimestamp);

        rows.push({
          id: String(ids[i]),
          symbol,
          amount: formatUnits(r.principal, decimals),
          apyPct: Number(r.apyBps) / 100,
          accruedYield: formatUnits(yieldRaw, decimals),
          maturityLabel: new Date(maturity * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          progressPct,
          matured,
        });
      }
      setVaults(rows);
    } catch (err) {
      console.error('[Vault] Failed to load deposits:', err);
      setVaults([]);
    } finally {
      setIsLoadingVaults(false);
    }
  }, [walletClient, vaultAddress, rpcUrl]);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  // Fetch the connected wallet's balance for every supported token.
  const fetchBalances = React.useCallback(async () => {
    const userAddr = walletClient?.account?.address;
    if (!userAddr) { setTokenBalances({}); return; }
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const entries = await Promise.all(
        TOKENS.map(async (sym) => {
          const addr = TOKEN_EVM_ADDRESSES[sym];
          try {
            if (sym === 'HBAR' || addr === ZERO_ADDRESS) {
              // Native HBAR balance is 18-decimal weibar at the EVM boundary.
              const raw = await provider.getBalance(userAddr);
              return [sym, formatUnits(raw, 18)] as const;
            }
            const erc20 = new Contract(addr, ERC20_ABI, provider);
            const raw = await erc20.balanceOf(userAddr);
            const dec = TOKEN_DECIMALS[sym] ?? 18;
            return [sym, formatUnits(raw, dec)] as const;
          } catch {
            return [sym, '0.00'] as const;
          }
        })
      );
      setTokenBalances(Object.fromEntries(entries));
    } catch (err) {
      console.error('[Vault] Failed to load balances:', err);
    }
  }, [walletClient, rpcUrl]);

  useEffect(() => {
    fetchBalances();
    const id = setInterval(fetchBalances, 20000); // keep balances fresh (e.g. after a faucet claim)
    return () => clearInterval(id);
  }, [fetchBalances]);

  // Read each token's minimum deposit from the vault config (human units).
  const fetchMins = React.useCallback(async () => {
    try {
      const provider = new JsonRpcProvider(rpcUrl);
      const vault = new Contract(vaultAddress, VAULT_ABI, provider);
      const entries = await Promise.all(
        TOKENS.map(async (sym) => {
          try {
            const cfg = await vault.tokenConfigs(TOKEN_EVM_ADDRESSES[sym]);
            const dec = TOKEN_DECIMALS[sym] ?? 6; // HBAR min is stored in tinybar (8dp)
            return [sym, Number(formatUnits(cfg.minDeposit, dec))] as const;
          } catch {
            return [sym, 0] as const;
          }
        })
      );
      setMinDeposits(Object.fromEntries(entries));
    } catch (err) {
      console.error('[Vault] Failed to load minimums:', err);
    }
  }, [rpcUrl, vaultAddress]);

  useEffect(() => { fetchMins(); }, [fetchMins]);

  // Human-friendly balance for a token (trimmed).
  const displayBalance = (sym: string): string => {
    const v = Number(tokenBalances[sym] ?? 0);
    if (!v) return '0.00';
    return v.toLocaleString(undefined, { maximumFractionDigits: v >= 1 ? 2 : 6 });
  };

  // 25% / 50% / MAX shortcut → fill the deposit input from the wallet balance.
  const applyPercent = (label: string) => {
    setSelectedPercent((prev) => (prev === label ? null : label));
    const bal = Number(tokenBalances[activeToken] ?? 0);
    if (!bal) return;
    const pct = label === 'MAX' ? 1 : label === '50%' ? 0.5 : 0.25;
    const dec = TOKEN_DECIMALS[activeToken] ?? 6;
    setDepositAmount((bal * pct).toFixed(Math.min(dec, 6)));
  };

  // Ensure the wallet is on Hedera Testnet (296); attempt an auto-switch otherwise.
  // Signing on the wrong chain hits addresses with no code → cryptic "missing revert data".
  const ensureHederaTestnet = async (provider: BrowserProvider): Promise<boolean> => {
    try {
      const net = await provider.getNetwork();
      if (Number(net.chainId) === 296) return true;
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]);
      return true;
    } catch {
      alert('Wrong network. Please switch your wallet to Hedera Testnet (chain ID 296) and try again.');
      return false;
    }
  };

  const handleDeposit = async () => {
    if (Number(depositAmount) <= 0) return;
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!vaultAddress) {
      alert('Vault contract address not configured.');
      return;
    }

    // Clear, friendly minimum check (the on-chain revert surfaces as cryptic
    // "missing revert data" on Hedera's gas estimator otherwise).
    const min = minDeposits[activeToken] ?? 0;
    if (min > 0 && Number(depositAmount) < min) {
      alert(`Minimum deposit for ${activeToken} is ${min} ${activeToken}. Please enter at least that amount.`);
      return;
    }

    const isHbar = activeToken === 'HBAR';
    const tokenEvm = TOKEN_EVM_ADDRESSES[activeToken] || '';
    if (!isHbar && !tokenEvm) {
      alert(`${activeToken} is not configured with a token address.`);
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(walletClient as any);
      if (!(await ensureHederaTestnet(provider))) { setIsProcessing(false); return; }
      const signer = await provider.getSigner();
      const vault = new Contract(vaultAddress, VAULT_ABI, signer);
      const durationDays = displayLockDays;

      let tx;
      if (isHbar) {
        // Native HBAR: send value (18-dec weibar at the tx boundary), no approval.
        const value = parseUnits(depositAmount, 18);
        tx = await vault.depositToVault(ZERO_ADDRESS, 0, durationDays, { value, gasLimit: 1200000 });
      } else {
        // HTS/ERC20: the wallet signs a normal approval, then deposit.
        // Explicit gas limits skip the wallet's estimateGas, which is unreliable
        // for HTS operations on Hedera (a failed estimate silently blocks the tx).
        const decimals = TOKEN_DECIMALS[activeToken] ?? 6;
        const amountParsed = parseUnits(depositAmount, decimals);
        const tokenContract = new Contract(tokenEvm, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(vaultAddress, amountParsed, { gasLimit: 1200000 });
        await approveTx.wait();
        tx = await vault.depositToVault(tokenEvm, amountParsed, durationDays, { gasLimit: 1200000 });
      }
      await tx.wait();

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setDepositAmount('');
        fetchVaults();
        fetchBalances();
      }, 1500);

    } catch (err) {
      setIsProcessing(false);
      const e = err as any;
      console.error('[Vault] Deposit failed:', e);
      alert('Deposit failed: ' + (e?.reason || e?.message || 'Unknown error'));
    }
  };

  // Exit a deposit: matured -> withdraw, otherwise -> unlock (early, with penalty).
  const handleExit = async (row: VaultRow) => {
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!vaultAddress) {
      alert('Vault contract address not configured.');
      return;
    }
    setRowBusyId(row.id);
    try {
      const provider = new BrowserProvider(walletClient as any);
      if (!(await ensureHederaTestnet(provider))) { setRowBusyId(null); return; }
      const signer = await provider.getSigner();
      const vault = new Contract(vaultAddress, VAULT_ABI, signer);
      // Explicit gas limit: HTS yield transfers make the wallet's estimateGas flaky.
      const tx = row.matured
        ? await vault.withdraw(row.id, { gasLimit: 1500000 })
        : await vault.unlock(row.id, { gasLimit: 1500000 });
      await tx.wait();
      await fetchVaults();
      await fetchBalances();
    } catch (err) {
      const e = err as any;
      console.error('[Vault] Exit failed:', e);
      alert('Exit failed: ' + (e?.reason || e?.message || 'Unknown error'));
    } finally {
      setRowBusyId(null);
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
                <TokenLogo sym="HBAR" size={16} />
                <span className="text-[12px] font-semibold text-gray-900 dark:text-white leading-none">Hedera</span>
              </div>
            </div>
          </div>

          {/* Deposit Input Area */}
          <div className="flex flex-col w-full mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-white/80">Deposit Amount</label>
              {(minDeposits[activeToken] ?? 0) > 0 && (
                <span className="text-[11px] font-medium text-slate-400 dark:text-white/40">
                  Min {minDeposits[activeToken]} {activeToken}
                </span>
              )}
            </div>
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
                <span className={`text-[12px] font-bold ml-1 transition-colors ${Number(depositAmount || 0) > 0 ? 'text-[#00A8E8]' : 'text-slate-400 dark:text-white/40'}`}>${fiatDisplayValue}</span>
              </div>

              {/* Right Side: Token Selector & Percentages */}
              <div className="flex flex-col items-end justify-center h-full shrink-0">
                
                <div className="relative mb-[12px]" ref={dropdownRef}>
                  {/* Token Selector Trigger */}
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={TOKEN_PILL}
                  >
                    <TokenLogo sym={activeToken} size={22} />
                    <span className="text-[13px] font-bold text-gray-900 dark:text-white leading-none">{activeToken}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-white/60 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
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
                            <TokenLogo sym={token} size={24} />
                            <span className={`text-[13px] font-bold ${activeToken === token ? 'text-[#00A8E8]' : 'text-slate-900 dark:text-white group-hover:text-[#00A8E8] dark:group-hover:text-[#00A8E8]'}`}>{token}</span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className={`text-[12px] font-semibold ${activeToken === token ? 'text-[#00A8E8]/80' : 'text-slate-600 dark:text-white/70 group-hover:text-[#00A8E8]/80 dark:group-hover:text-[#00A8E8]/80'}`}>
                              {displayBalance(token)}
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
                    onClick={() => applyPercent('25%')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '25%' ? 'text-[#00A8E8]' : 'text-slate-400 dark:text-white/40 hover:text-slate-500 dark:hover:text-white/60'}`}>25%</button>
                  <button
                    onClick={() => applyPercent('50%')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === '50%' ? 'text-[#00A8E8]' : 'text-slate-400 dark:text-white/40 hover:text-slate-500 dark:hover:text-white/60'}`}>50%</button>
                  <button
                    onClick={() => applyPercent('MAX')}
                    className={`text-[11px] font-bold transition-colors ${selectedPercent === 'MAX' ? 'text-[#00A8E8]' : 'text-slate-400 dark:text-white/40 hover:text-slate-500 dark:hover:text-white/60'}`}>MAX</button>
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
                  className={`flex-1 py-2.5 text-[13px] active:scale-[0.98] ${seg(displayLockDays === days)}`}
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
                  className={`flex-1 py-2.5 text-[13px] active:scale-[0.98] ${seg(![7, 30, 60].includes(displayLockDays))}`}
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
            <span className="text-[12px] font-medium text-red-500 dark:text-red-500 leading-snug">Early withdrawal incurs a time-decay penalty of up to 2% on principal. Accrued yield is still paid out in full.</span>
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
              <span className="text-[13px] font-bold text-[#10B981]">+{estimatedEarnings.toFixed(estimatedEarnings >= 1 ? 2 : 4)} {activeToken}</span>
            </div>
          </div>

          {/* Deposit / Withdraw Buttons */}
          <div className="mt-auto pt-4 w-full">
            <button 
              onClick={handleDeposit}
              disabled={isProcessing || isSuccess}
              className={`w-full h-12 text-[15px] flex items-center justify-center active:scale-[0.98] tracking-wide shadow-sm relative ${
                isSuccess
                  ? `${CTA_GREEN_SOLID} pointer-events-none`
                  : isProcessing
                    ? 'font-bold rounded-[12px] bg-[#00A8E8] text-white cursor-not-allowed'
                    : CTA_BLUE
              }`}
            >
              {isSuccess && (
                <div className="absolute inset-0 rounded-[12px] bg-[#10B981] animate-ping-once pointer-events-none"></div>
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
                {(() => {
                  const logoBySymbol: Record<string, string | null> = {
                    HBAR: hbarLogoUrlSmall, USDT: usdtLogoUrlSmall, USDC: usdcLogoUrlSmall,
                    SAUCE: sauceLogoUrlSmall, PACK: packLogoUrlSmall, WBTC: wbtcLogoUrlSmall,
                    WETH: wethLogoUrlSmall, BONZO: bonzoLogoUrlSmall, JAM: jamLogoUrlSmall,
                  };

                  if (!isConnected) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-[13px] text-slate-400 dark:text-white/40">
                          Connect your wallet to view your vaults.
                        </td>
                      </tr>
                    );
                  }
                  if (isLoadingVaults) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-6 py-10">
                          <div className="flex items-center justify-center gap-2 text-[13px] text-slate-400 dark:text-white/40">
                            <CircleNotch size={16} className="animate-spin" /> Loading your vaults…
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  if (vaults.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-[13px] text-slate-400 dark:text-white/40">
                          No active vaults yet. Deposit above to get started.
                        </td>
                      </tr>
                    );
                  }
                  return vaults.map((row) => {
                    const logo = logoBySymbol[row.symbol];
                    const busy = rowBusyId === row.id;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center justify-center gap-3">
                            {logo ? (
                              <img src={logo} alt={row.symbol} className="w-7 h-7 rounded-full" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1F2937] flex items-center justify-center text-[11px] font-black">{row.symbol.charAt(0)}</div>
                            )}
                            <span className="text-[13px] font-medium text-slate-900 dark:text-white">{row.symbol}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white">{Number(row.amount).toLocaleString(undefined, { maximumFractionDigits: 4 })} {row.symbol}</span>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <span className="text-[13px] font-medium text-slate-900 dark:text-white">{row.apyPct.toFixed(2)}%</span>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <span className="text-[13px] font-medium text-[#10B981]">+{Number(row.accruedYield).toLocaleString(undefined, { maximumFractionDigits: 4 })} {row.symbol}</span>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <span className="text-[13px] font-medium text-slate-700 dark:text-white/80">{row.maturityLabel}</span>
                        </td>
                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center justify-center gap-3 w-full">
                            <span className="text-[13px] font-medium text-slate-700 dark:text-white/80 w-8 text-right">{row.progressPct}%</span>
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#00A8E8] rounded-full" style={{ width: `${row.progressPct}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-full border ${row.matured ? "border-[#10B981]/30 bg-[#10B981]/5" : "border-[#00A8E8]/30 bg-[#00A8E8]/5"}`}>
                            <span className={`text-[12px] font-medium ${row.matured ? "text-[#10B981]" : "text-[#00A8E8]"}`}>{row.matured ? "Matured" : "Locked"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle text-center">
                          <button
                            onClick={() => handleExit(row)}
                            disabled={busy}
                            className={`${CTA_RED} w-[120px] h-[34px] text-[12px] flex items-center justify-center mx-auto`}
                          >
                            {busy ? <CircleNotch size={14} className="animate-spin" /> : (row.matured ? "Withdraw" : "Unlock")}
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
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
            <p className="text-[14px] text-slate-500 dark:text-white/60 mb-6">Enter the number of days you want to lock (1–{MAX_LOCK_DAYS}).</p>

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
                if (isNaN(val) || val <= 0) {
                  alert('Please enter a lock duration of at least 1 day.');
                  return;
                }
                if (val > MAX_LOCK_DAYS) {
                  alert(`Maximum lock duration is ${MAX_LOCK_DAYS} days.`);
                  return;
                }
                setDisplayLockDays(val);
                setIsCustomModalOpen(false);
              }}
              className={`${CTA_BLUE} w-full py-3.5 text-[15px] shadow-sm`}
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
