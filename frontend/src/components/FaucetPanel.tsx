"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CircleNotch, CheckCircle, Clock } from '@phosphor-icons/react';
import { BrowserProvider, JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import faucetArtifact from '../contracts/CreodeFaucet.json';
import { TokenLogo } from './TokenLogo';

// HTS tokens dripped by the faucet (~$500 worth of each, daily). HBAR is native
// — get it from the official Hedera faucet (faucet.hedera.com), not here.
const FAUCET_TOKENS: { sym: string; address: string; decimals: number }[] = [
  { sym: 'USDC',  address: '0x000000000000000000000000000000000092e8A7', decimals: 6 },
  { sym: 'USDT',  address: '0x000000000000000000000000000000000092E8a8', decimals: 6 },
  { sym: 'SAUCE', address: '0x000000000000000000000000000000000092e8A9', decimals: 6 },
  { sym: 'PACK',  address: '0x000000000000000000000000000000000092e8aB', decimals: 6 },
  { sym: 'JAM',   address: '0x000000000000000000000000000000000092E8aC', decimals: 6 },
  { sym: 'WETH',  address: '0x000000000000000000000000000000000092E8Ae', decimals: 8 },
  { sym: 'WBTC',  address: '0x000000000000000000000000000000000092e8b1', decimals: 8 },
  { sym: 'BONZO', address: '0x000000000000000000000000000000000092e8B3', decimals: 6 },
  { sym: 'DOVU',  address: '0x00000000000000000000000000000000009343F4', decimals: 6 },
];

// Use the committed address directly so a stale host env var can't override it.
const FAUCET_ADDRESS = (faucetArtifact as any).address;
const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';

const formatCountdown = (secs: number): string => {
  if (secs <= 0) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

// Compact display for amounts that range from 0.008 to 5,000,000.
const compactAmount = (v: number): string => {
  if (v === 0) return '0';
  if (v >= 1000) return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
  if (v >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
};

/**
 * Self-contained faucet UI block (no trigger button / positioning).
 * Designed to be embedded inside the wallet dropdown.
 */
export const FaucetPanel: React.FC<{ theme: 'light' | 'dark' }> = ({ theme }) => {
  const { isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [drips, setDrips] = useState<Record<string, string>>({});

  const refreshCooldown = useCallback(async () => {
    const userAddr = walletClient?.account?.address;
    if (!userAddr || !FAUCET_ADDRESS) { setCooldown(0); return; }
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const faucet = new Contract(FAUCET_ADDRESS, (faucetArtifact as any).abi, provider);
      setCooldown(Number(await faucet.secondsUntilClaim(userAddr)));
    } catch {
      setCooldown(0);
    }
  }, [walletClient]);

  useEffect(() => { refreshCooldown(); }, [refreshCooldown]);

  // Load each token's drip amount once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!FAUCET_ADDRESS) return;
      try {
        const provider = new JsonRpcProvider(RPC_URL);
        const faucet = new Contract(FAUCET_ADDRESS, (faucetArtifact as any).abi, provider);
        const entries = await Promise.all(
          FAUCET_TOKENS.map(async (t) => {
            try {
              const raw = await faucet.dripAmount(t.address);
              return [t.sym, compactAmount(Number(formatUnits(raw, t.decimals)))] as const;
            } catch {
              return [t.sym, '—'] as const;
            }
          })
        );
        if (!cancelled) setDrips(Object.fromEntries(entries));
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleClaim = async () => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    if (!FAUCET_ADDRESS) { alert('Faucet address not configured.'); return; }
    if (cooldown > 0) return;
    setIsClaiming(true);
    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const faucet = new Contract(FAUCET_ADDRESS, (faucetArtifact as any).abi, signer);
      // Explicit gas limit: 8 HTS transfers make the wallet's estimateGas flaky.
      const tx = await faucet.claim({ gasLimit: 2000000 });
      await tx.wait();
      setJustClaimed(true);
      setTimeout(() => setJustClaimed(false), 4000);
      await refreshCooldown();
    } catch (err) {
      const e = err as any;
      console.error('[Faucet] Claim failed:', e);
      alert('Claim failed: ' + (e?.reason || e?.shortMessage || e?.message || 'Unknown error'));
    } finally {
      setIsClaiming(false);
    }
  };

  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-[#EAECEF]';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-500';
  const onCooldown = cooldown > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h4 className={`text-[13px] font-bold ${textMain}`}>Daily Test Faucet</h4>
        <span className="text-[9px] font-bold uppercase tracking-wide text-[#00A8E8] bg-[#00A8E8]/10 px-2 py-0.5 rounded-full">Testnet</span>
      </div>
      <p className={`text-[11px] ${textMuted} mb-2.5 leading-snug`}>
        Claim ~$500 worth of each token once every 24h. (HBAR: faucet.hedera.com)
      </p>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {FAUCET_TOKENS.map((t) => (
          <div
            key={t.sym}
            className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
          >
            <TokenLogo sym={t.sym} size={16} />
            <span className="text-[10px] font-bold text-[#00A8E8] leading-tight">{drips[t.sym] ?? '…'}</span>
            <span className={`text-[9px] font-semibold ${textMuted}`}>{t.sym}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleClaim}
        disabled={isClaiming || onCooldown || !isConnected}
        className={`w-full h-9 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${
          justClaimed
            ? 'bg-emerald-500 text-white'
            : onCooldown
              ? `${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'} cursor-not-allowed`
              : isClaiming
                ? 'bg-[#00A8E8]/80 text-white cursor-wait'
                : !isConnected
                  ? `${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-slate-100 text-slate-400'} cursor-not-allowed`
                  : 'bg-[#00A8E8] hover:bg-[#0090C7] text-white'
        }`}
      >
        {justClaimed ? (
          <><CheckCircle weight="bold" size={15} /> Claimed!</>
        ) : isClaiming ? (
          <><CircleNotch weight="bold" size={15} className="animate-spin" /> Claiming…</>
        ) : onCooldown ? (
          <><Clock weight="bold" size={14} /> Next claim in {formatCountdown(cooldown)}</>
        ) : !isConnected ? (
          'Connect wallet to claim'
        ) : (
          'Claim ~$500 of each'
        )}
      </button>
    </div>
  );
};
