"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Drop, CaretDown, CircleNotch, CheckCircle, Clock } from '@phosphor-icons/react';
import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import faucetArtifact from '../contracts/CreodeFaucet.json';

interface FaucetDropdownProps {
  theme: 'light' | 'dark';
  className?: string;
}

// HTS tokens dripped by the faucet (50 of each, daily). HBAR is native — get it
// from the official Hedera faucet (faucet.hedera.com), not here.
const FAUCET_TOKENS = ['USDC', 'USDT', 'SAUCE', 'PACK', 'JAM', 'WETH', 'WBTC', 'BONZO'];
const DRIP_AMOUNT = 50;

const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS || (faucetArtifact as any).address;
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

export const FaucetDropdown: React.FC<FaucetDropdownProps> = ({ theme, className = '' }) => {
  const { isConnected } = useWallet();
  const { data: walletClient } = useWalletClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [cooldown, setCooldown] = useState(0); // seconds until next claim
  const ref = useRef<HTMLDivElement>(null);

  const refreshCooldown = useCallback(async () => {
    const userAddr = walletClient?.account?.address;
    if (!userAddr || !FAUCET_ADDRESS) { setCooldown(0); return; }
    try {
      const provider = new JsonRpcProvider(RPC_URL);
      const faucet = new Contract(FAUCET_ADDRESS, (faucetArtifact as any).abi, provider);
      const secs = await faucet.secondsUntilClaim(userAddr);
      setCooldown(Number(secs));
    } catch {
      setCooldown(0);
    }
  }, [walletClient]);

  useEffect(() => { refreshCooldown(); }, [refreshCooldown]);

  // Live countdown tick.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 1 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Close on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClaim = async () => {
    if (!isConnected || !walletClient) { alert('Please connect your wallet first.'); return; }
    if (!FAUCET_ADDRESS) { alert('Faucet address not configured.'); return; }
    if (cooldown > 0) return;
    setIsClaiming(true);
    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const faucet = new Contract(FAUCET_ADDRESS, (faucetArtifact as any).abi, signer);
      const tx = await faucet.claim();
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

  const cardBg = theme === 'dark' ? 'bg-[#0F141A]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/10' : 'border-[#EAECEF]';
  const textMain = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textMuted = theme === 'dark' ? 'text-white/50' : 'text-slate-500';
  const onCooldown = cooldown > 0;

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border ${borderColor} ${cardBg} text-[13px] font-semibold ${textMain} hover:border-[#00A8E8]/50 transition-colors shadow-sm`}
      >
        <Drop weight="fill" className="text-[#00A8E8]" size={16} />
        <span>Test Faucet</span>
        <CaretDown size={13} className={`text-[#00A8E8] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 mt-2 w-[300px] z-50 origin-top-right transition-all duration-200 ${
          isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`${cardBg} border ${borderColor} rounded-[14px] shadow-xl dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] p-4`}>
          <div className="flex items-center justify-between mb-1">
            <h4 className={`text-[14px] font-bold ${textMain}`}>Daily Test Faucet</h4>
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#00A8E8] bg-[#00A8E8]/10 px-2 py-0.5 rounded-full">Testnet</span>
          </div>
          <p className={`text-[11px] ${textMuted} mb-3 leading-snug`}>
            Claim {DRIP_AMOUNT} of each token once every 24h to run transactions on the dapp.
          </p>

          {/* Token grid */}
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {FAUCET_TOKENS.map((sym) => (
              <div
                key={sym}
                className={`flex flex-col items-center justify-center py-2 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
              >
                <span className="text-[11px] font-bold text-[#00A8E8]">+{DRIP_AMOUNT}</span>
                <span className={`text-[10px] font-semibold ${textMuted}`}>{sym}</span>
              </div>
            ))}
          </div>

          {/* Action */}
          <button
            onClick={handleClaim}
            disabled={isClaiming || onCooldown || !isConnected}
            className={`w-full h-10 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 transition-all ${
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
              <><CheckCircle weight="bold" size={16} /> Claimed!</>
            ) : isClaiming ? (
              <><CircleNotch weight="bold" size={16} className="animate-spin" /> Claiming…</>
            ) : onCooldown ? (
              <><Clock weight="bold" size={15} /> Next claim in {formatCountdown(cooldown)}</>
            ) : !isConnected ? (
              'Connect wallet to claim'
            ) : (
              `Claim ${DRIP_AMOUNT} of each`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
