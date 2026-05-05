"use client";

/* * Developer: [Viqtorhvayx]
 * Component: LockingModule (Native HBAR Vault - UI Reverted)
 * Description: Time-lock savings vault integrated with flawless protocol logic.
 *              UI restored to original high-fidelity state.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | 'set'>('deposit');
  
  // Flawless Protocol Logic authored by Viqtorhvayx
  const { deposit, withdraw, setMaturity, getVaultData, isPending, error } = useCreodeVault();
  const [vaultPrincipal, setVaultPrincipal] = useState("0.00");
  const [vaultEarnings, setVaultEarnings] = useState("0.00");
  const [unlockTime, setUnlockTime] = useState(0);

  const refreshVaultState = useCallback(async () => {
    if (address) {
      try {
        const data = await getVaultData(address);
        setVaultPrincipal(data.balance);
        setVaultEarnings(data.earnings);
        setUnlockTime(data.unlockTime);
      } catch (err) {
        console.error("[Protocol] State sync failed:", err);
      }
    } else {
      setVaultPrincipal("0.00");
      setVaultEarnings("0.00");
      setUnlockTime(0);
    }
  }, [address, getVaultData]);

  useEffect(() => {
    refreshVaultState();
  }, [address, refreshVaultState]);

  const [days, setDays] = useState<string>("21"); 

  /* Dynamic Maturity Engine authored by Viqtorhvayx */
  const calculatedMaturity = useMemo(() => {
    const numericDays = parseInt(stripCommas(days));
    if (isNaN(numericDays) || numericDays <= 0) return "Select duration";
    const date = new Date();
    date.setDate(date.getDate() + numericDays);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, [days]);

  const currentMaturityDate = useMemo(() => {
    if (unlockTime === 0) return "No active lock";
    return new Date(unlockTime * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [unlockTime]);

  const handleDaysChange = (val: string) => {
    setDays(val);
  };

  const handleDeposit = async () => {
    const rawAmount = stripCommas(amount);
    if (!rawAmount || Number(rawAmount) <= 0) return;
    setActiveAction('deposit');
    try {
      await deposit(rawAmount, days);
      setAmount("");
      setTimeout(refreshVaultState, 2000);
    } catch (err) {
      console.error("[Protocol] Deposit failed.");
    }
  };

  const handleWithdraw = async () => {
    setActiveAction('withdraw');
    try {
      await withdraw();
      setAmount("");
      setTimeout(refreshVaultState, 2000);
    } catch (err) {
      console.error("[Protocol] Withdrawal failed.");
    }
  };

  const handleSetMaturity = async () => {
    setActiveAction('set');
    const numericDays = stripCommas(days);
    if (!numericDays || Number(numericDays) <= 0) return;
    try {
      if (Number(vaultPrincipal) > 0) {
        alert("Cannot change maturity while funds are locked.");
        return;
      }
      await setMaturity(numericDays);
      setTimeout(refreshVaultState, 2000);
    } catch (err) {
      console.error("[Protocol] Set maturity failed.");
    }
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] font-semibold";

  const getButtonClasses = (action: 'deposit' | 'withdraw' | 'set') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] hover:-translate-y-1 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
    return isActive 
      ? `${baseClasses} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/20`
      : `${baseClasses} bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20`;
  };

  const QuickButton = ({ label, onClick }: { label: string, onClick: () => void }) => (
    <button onClick={onClick} className="text-[8px] font-black transition-all duration-300 rounded-[60px] !py-1 px-2 tracking-tighter bg-[#00A8E8]/10 text-[#00A8E8] hover:bg-[#00A8E8]/20 active:scale-95 uppercase">
      {label}
    </button>
  );

  const handleQuickSelect = (percent: number) => {
    const numericBalance = Number(balance) || 0;
    const rawValue = (numericBalance * (percent / 100)).toString();
    setAmount(formatWithCommas(rawValue));
  };

  const hbarPrice = usePythPrice();
  const usdValue = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(stripCommas(amount)) || 0) * hbarPrice);

  return (
    <div className="industrial-panel bg-surface relative overflow-hidden">
      {isPending && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A8E8]"></div>
        </div>
      )}

      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Time-lock savings</h3>
          <p className="text-2xl font-black" style={{ color: primaryTextColor }}>Vault</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: labelColor }}>Target Yield</p>
          <p className="text-[18px] font-black !text-[#10B981]">0.30% <span className="text-[10px] font-bold ml-1" style={{ color: labelColor }}>APY</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col h-full justify-between">
          <div className="space-y-1 mb-8">
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold tracking-tight" style={{ color: labelColor }}>Deposits</span>
              <span className="text-[10px] font-black" style={{ color: labelColor }}>{Number(vaultPrincipal).toFixed(2)} {balanceSymbol}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold tracking-tight" style={{ color: labelColor }}>Earnings</span>
              <span className="text-[10px] font-black" style={{ color: labelColor }}>{Number(vaultEarnings).toFixed(2)} {balanceSymbol}</span>
            </div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] font-bold uppercase tracking-tight" style={{ color: labelColor }}>TVL</span>
              <span className="text-[10px] font-black" style={{ color: labelColor }}>125,000.00 {balanceSymbol}</span>
            </div>
          </div>
 
          <div className="relative">
            <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: labelColor }}>Amount to Save ({balanceSymbol})</label>
            <FormattedNumberInput 
              placeholder="0.00"
              className={numericInputClasses}
              style={{ backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF', color: primaryTextColor }}
              value={amount}
              onValueChange={setAmount}
            />
            <div className="flex justify-between items-baseline mt-2 px-2">
              <span className="text-[10px] font-bold text-[#00A8E8]">{usdValue}</span>
              <div className="flex gap-1">
                <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
                <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
                <QuickButton label="Max" onClick={() => setAmount(balance)} />
              </div>
            </div>
          </div>

          {error && <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-[10px] text-red-500 font-bold uppercase">{error}</div>}
          
          <div className="flex gap-4 mt-20">
            <button onClick={handleDeposit} disabled={isPending || !amount} className={getButtonClasses('deposit')}>Deposit</button>
            <button onClick={handleWithdraw} disabled={isPending || !amount} className={getButtonClasses('withdraw')}>Withdraw</button>
          </div>
        </div>

        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6">
            <div className="bg-[#FF3837]/10 border border-[#FF3837]/20 rounded-2xl px-4 py-3 flex flex-col justify-center min-h-[52px]">
              <p className="text-xs font-medium leading-tight" style={{ color: labelColor }}>
                Note: A <span className="font-bold !text-[#FF3837]">5.00%</span> penalty fee applies ONLY if funds are withdrawn before the preset maturity date.
              </p>
            </div>
            <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border)] rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Active Maturity</span>
                <span className="text-[11px] font-black !text-[#00A8E8]">{currentMaturityDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Target Date</span>
                <span className="text-[11px] font-black !text-[#00A8E8]">{calculatedMaturity}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div>
              <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: labelColor }}>Duration (Days)</label>
              <FormattedNumberInput 
                placeholder="0"
                className={numericInputClasses + " !py-2.5"} 
                style={{ backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF', color: primaryTextColor }}
                value={days}
                onValueChange={handleDaysChange}
              />
            </div>
            <div className="flex flex-col justify-end">
              <button onClick={handleSetMaturity} className={getButtonClasses('set').replace('flex-1 min-w-[120px]', 'w-full')}>Set</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
