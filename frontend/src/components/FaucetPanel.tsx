"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { CircleNotch, CheckCircle, Clock } from '@phosphor-icons/react';
import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import { useWalletClient } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import faucetArtifact from '../contracts/CreodeFaucet.json';

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
        Claim {DRIP_AMOUNT} of each token once every 24h. (HBAR: faucet.hedera.com)
      </p>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {FAUCET_TOKENS.map((sym) => (
          <div
            key={sym}
            className={`flex flex-col items-center justify-center py-1.5 rounded-lg border ${borderColor} ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-slate-50'}`}
          >
            <span className="text-[10px] font-bold text-[#00A8E8]">+{DRIP_AMOUNT}</span>
            <span className={`text-[9px] font-semibold ${textMuted}`}>{sym}</span>
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
          `Claim ${DRIP_AMOUNT} of each`
        )}
      </button>
    </div>
  );
};
