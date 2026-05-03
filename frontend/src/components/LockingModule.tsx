"use client";

/* * Developer: [Viqtorhvayx]
 * Component: LockingModule (Native HBAR Vault)
 * Description: High-fidelity savings vault for native HBAR.
 *              Uses industrial-grade ethers.js hooks for contract interaction.
 *              Maintains glassmorphism aesthetics while implementing new logic.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';
import { useCreodeVault } from '../hooks/useCreodeVault';

interface LockingModuleProps {
  theme?: 'light' | 'dark';
}

export const LockingModule: React.FC<LockingModuleProps> = ({ theme }) => {
  const { balance, balanceSymbol, address } = useWallet();
  const [amount, setAmount] = useState("");
  const [vaultBalance, setVaultBalance] = useState("0.00");
  
  const { deposit, withdraw, getVaultBalance, isPending, error } = useCreodeVault();

  // Load vault balance on mount and after transactions
  const refreshVaultBalance = async () => {
    if (address) {
      try {
        const bal = await getVaultBalance(address);
        setVaultBalance(bal);
      } catch (err) {
        console.error("Failed to refresh vault balance:", err);
      }
    } else {
      setVaultBalance("0.00");
    }
  };

  useEffect(() => {
    refreshVaultBalance();
  }, [address]);

  const handleDeposit = async () => {
    const rawAmount = stripCommas(amount);
    if (!rawAmount || Number(rawAmount) <= 0) return;
    
    try {
      await deposit(rawAmount);
      setAmount("");
      // Add a slight delay for Mirror Node/EVM sync
      setTimeout(refreshVaultBalance, 1500);
    } catch (err) {
      // Error state is captured by hook
    }
  };

  const handleWithdraw = async () => {
    const rawAmount = stripCommas(amount);
    if (!rawAmount || Number(rawAmount) <= 0) return;
    
    try {
      await withdraw(rawAmount);
      setAmount("");
      setTimeout(refreshVaultBalance, 1500);
    } catch (err) {
      // Error state is captured by hook
    }
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] font-semibold";

  const getButtonClasses = (variant: 'primary' | 'secondary') => {
    const baseClasses = "flex-1 min-w-[120px] !py-3.5 !h-auto font-bold transition-all duration-300 rounded-[60px] hover:-translate-y-1 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-[11px]";
    return variant === 'primary'
      ? `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

  const QuickButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button
      onClick={onClick}
      className="text-[8px] font-black transition-all duration-300 rounded-[60px] !py-1 !h-auto px-2 tracking-tighter bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20 active:scale-95 uppercase"
    >
      {label}
    </button>
  );

  const hbarPrice = usePythPrice();
  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((Number(stripCommas(amount)) || 0) * hbarPrice);

  return (
    <div className="industrial-panel bg-surface relative overflow-hidden">
      {/* Visual Glitch/Interaction: Loading Glow */}
      {isPending && (
        <div className="absolute inset-0 bg-[#00A8E8]/5 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00A8E8]"></div>
          <p className="mt-4 text-[10px] font-black text-[#00A8E8] uppercase tracking-[0.2em] animate-pulse">Awaiting Wallet...</p>
        </div>
      )}

      <div className="flex justify-between items-start mb-10">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: labelColor }}>Native Savings</h3>
          <p className="text-3xl font-black" style={{ color: primaryTextColor }}>Vault</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: labelColor }}>Vault Balance</p>
          <div className="flex items-baseline justify-end gap-1">
            <p className="text-[22px] font-black !text-[#00A8E8] leading-none">
              {formatWithCommas(vaultBalance)}
            </p>
            <span className="text-[10px] font-bold" style={{ color: labelColor }}>{balanceSymbol}</span>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="relative">
          <div className="flex justify-between items-center mb-2 px-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Amount to process</label>
            <span className="text-[10px] font-bold" style={{ color: labelColor }}>Available: {formatWithCommas(balance)}</span>
          </div>
          <div className="relative flex items-center">
            <FormattedNumberInput 
              placeholder="0.00"
              className={numericInputClasses + " pr-28 text-lg"}
              style={{ 
                backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                color: theme === 'dark' ? '#FFFFFF' : '#000000',
                border: '1px solid var(--border)'
              }}
              value={amount}
              onValueChange={setAmount}
            />
            <div className="absolute right-4 flex items-center gap-2 pointer-events-none bg-[#00A8E8]/10 rounded-[60px] px-3 py-1.5 border border-[#00A8E8]/20">
              <div className="w-4 h-4 bg-black rounded-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white"><path d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z"/></svg>
              </div>
              <span className="text-[11px] font-black tracking-widest text-[#00A8E8]">HBAR</span>
            </div>
          </div>
          <div className="flex justify-between items-baseline mt-3 px-2">
            <span className="text-[11px] font-black tracking-wide" style={{ color: '#00A8E8' }}>{usdValue}</span>
            <div className="flex gap-1.5">
              <QuickButton label="25%" onClick={() => setAmount(formatWithCommas((Number(balance) * 0.25).toFixed(2)))} />
              <QuickButton label="50%" onClick={() => setAmount(formatWithCommas((Number(balance) * 0.50).toFixed(2)))} />
              <QuickButton label="Max" onClick={() => setAmount(formatWithCommas(balance))} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 transition-all animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Protocol Rejection</p>
            </div>
            <p className="text-[11px] text-red-400/80 leading-relaxed font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button 
            onClick={handleDeposit} 
            disabled={isPending || !amount || Number(stripCommas(amount)) <= 0} 
            className={getButtonClasses('primary')}
          >
            {isPending ? 'Confirming...' : 'Deposit to Vault'}
          </button>
          <button 
            onClick={handleWithdraw} 
            disabled={isPending || !amount || Number(stripCommas(amount)) <= 0} 
            className={getButtonClasses('secondary')}
          >
            {isPending ? 'Processing...' : 'Withdraw HBAR'}
          </button>
        </div>

        {/* Informational Glassmorphism Panel */}
        <div className="p-5 bg-black/[0.03] dark:bg-white/[0.01] border border-[var(--border)] rounded-[32px] backdrop-blur-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-50" style={{ color: primaryTextColor }}>Vault Architecture</p>
          <div className="grid grid-cols-2 gap-y-4 gap-x-8">
            <div>
              <span className="text-[9px] font-bold uppercase block mb-1" style={{ color: labelColor }}>Network Service</span>
              <span className="text-[11px] font-black text-[#00A8E8]">Hedera HSCS</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase block mb-1" style={{ color: labelColor }}>Asset Class</span>
              <span className="text-[11px] font-black text-[#00A8E8]">Native HBAR</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase block mb-1" style={{ color: labelColor }}>Protocol Type</span>
              <span className="text-[11px] font-black text-[#10B981]">Non-Custodial</span>
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase block mb-1" style={{ color: labelColor }}>Security</span>
              <span className="text-[11px] font-black text-[#10B981]">Anti-Reentrancy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
