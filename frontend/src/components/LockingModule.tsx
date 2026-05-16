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
  const [isMaturityLocked, setIsMaturityLocked] = useState(false);
  const [userDeposit, setUserDeposit] = useState("0.00"); // Step 1: React state for live balance

  // Step 2: Implement the fetcher function
  const fetchVaultData = useCallback(async () => {
    if (address) {
      try {
        const data = await getVaultData(address);
        // Step 4: Mandatory console logging
        console.log("Vault Balance Fetched:", data.balance);
        
        // Format strictly to 2 decimal places as requested
        const formattedBalance = Number(data.balance).toFixed(2);
        
        // Step 1 & 2: Update the states
        setUserDeposit(formattedBalance);
        setVaultPrincipal(data.balance);
        setVaultEarnings(data.earnings);
        setUnlockTime(data.unlockTime);
        setIsMaturityLocked(data.isSet);
      } catch (err) {
        console.error("[Protocol] fetchVaultData failed:", err);
      }
    } else {
      setUserDeposit("0.00");
      setVaultPrincipal("0.00");
      setVaultEarnings("0.00");
      setUnlockTime(0);
      setIsMaturityLocked(false);
    }
  }, [address, getVaultData]);

  // Step 3: Trigger the Effect
  useEffect(() => {
    fetchVaultData();
  }, [address, fetchVaultData]);

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
    
    // Explicit UI-level check before even hitting the hook
    if (!isMaturityLocked) {
      alert("⚠️ PLEASE CLICK 'SET' FIRST TO LOCK YOUR DURATION.");
      return;
    }

    setActiveAction('deposit');
    try {
      await deposit(rawAmount, days);
      setAmount("");
      setTimeout(fetchVaultData, 2000);
    } catch (err) {
      console.error("[Protocol] Deposit failed.");
    }
  };

  const handleWithdraw = async () => {
    setActiveAction('withdraw');
    try {
      await withdraw();
      setAmount("");
      setTimeout(fetchVaultData, 2000);
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
      setTimeout(fetchVaultData, 2000);
    } catch (err) {
      console.error("[Protocol] Set maturity failed.");
    }
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] font-semibold";

  const getButtonClasses = (action: 'deposit' | 'withdraw' | 'set') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] hover:-translate-y-1 hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
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
    <div className="glass-panel !rounded-[40px] p-10 max-w-2xl mx-auto shadow-2xl relative overflow-hidden">
      {isPending && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A8E8]"></div>
        </div>
      )}

      {/* Header authored by Viqtorhvayx */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.3em]" style={{ color: labelColor }}>Capital Strategy</h3>
          <p className="text-3xl font-black tracking-tighter" style={{ color: primaryTextColor }}>Vault</p>
        </div>
        <div className="bg-[#00A8E8]/10 px-4 py-2 rounded-2xl border border-[#00A8E8]/20">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: primaryTextColor }}>Target Yield</p>
          <p className="text-xl font-black text-[#10B981]">0.30% <span className="text-[10px] opacity-40">APY</span></p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Aave-style Data Rows authored by Viqtorhvayx */}
        <div className="space-y-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Deposited Capital</span>
            <span className="text-lg font-black text-white ml-auto tracking-tight">0.00 HBAR</span>
          </div>
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Accrued Yield</span>
            <span className="text-lg font-black text-[#10B981] ml-auto tracking-tight">0.00 HBAR</span>
          </div>
          <div className="flex justify-between items-center group">
            <span className="text-[11px] font-bold tracking-widest uppercase opacity-40" style={{ color: primaryTextColor }}>Protocol TVL</span>
            <span className="text-lg font-black text-white ml-auto tracking-tight">12.5M HBAR</span>
          </div>
        </div>

        {/* Uniswap-style Input Box authored by Viqtorhvayx */}
        <div className="bg-black/20 p-6 rounded-[32px] border border-white/10 transition-all duration-300 focus-within:border-[#00A8E8]/40 shadow-inner">
          <div className="flex justify-between mb-4">
            <label className="text-[11px] font-black uppercase tracking-widest opacity-40" style={{ color: primaryTextColor }}>Amount to Save</label>
            <div className="flex gap-2">
              <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
              <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
              <QuickButton label="Max" onClick={() => setAmount(balance)} />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <FormattedNumberInput 
              placeholder="0.00"
              className="w-full bg-transparent text-4xl font-black outline-none border-none p-0 tracking-tighter"
              style={{ color: primaryTextColor }}
              value={amount}
              onValueChange={setAmount}
            />
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 shadow-xl">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                  <path d="M5 4h3v5h8V4h3v16h-3v-5H8v5H5V4zm3 7v2h8v-2H8z" />
                </svg>
              </div>
              <span className="text-lg font-black tracking-tighter text-white">HBAR</span>
            </div>
          </div>
          <p className="mt-4 text-[11px] font-bold text-[#00A8E8] tracking-widest opacity-80 uppercase">{usdValue} Valuation</p>
        </div>

        {/* Duration Logic authored by Viqtorhvayx */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-black/20 p-6 rounded-[32px] border border-white/10">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-3" style={{ color: primaryTextColor }}>Lock Duration</label>
            <div className="flex items-center gap-2">
               <FormattedNumberInput 
                placeholder="21"
                className="w-full bg-transparent text-2xl font-black outline-none border-none p-0 tracking-tighter"
                style={{ color: primaryTextColor }}
                value={days}
                onValueChange={handleDaysChange}
              />
              <span className="text-xs font-black opacity-40 uppercase">Days</span>
            </div>
          </div>
          <div className="flex flex-col justify-center px-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] font-bold uppercase opacity-30">Release</span>
              <span className="text-[10px] font-black text-[#00A8E8]">{calculatedMaturity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase opacity-30">Status</span>
              <span className="text-[10px] font-black text-white uppercase tracking-tighter">{currentMaturityDate === "No active lock" ? "Open" : "Locked"}</span>
            </div>
          </div>
        </div>

        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] text-red-500 font-black uppercase tracking-widest text-center">{error}</div>}

        <div className="grid grid-cols-2 gap-4 mt-4">
          <button onClick={handleDeposit} disabled={isPending || !amount} className="nav-pill !py-5 bg-[#00A8E8] text-white text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(0,168,232,0.4)] bounce-hover">Deposit</button>
          <button onClick={handleSetMaturity} disabled={isPending} className="nav-pill !py-5 bg-white/5 border border-white/10 text-white text-sm font-black uppercase tracking-[0.2em] hover:bg-[#00A8E8]/10 hover:border-[#00A8E8]/40 transition-all bounce-hover">Set Strategy</button>
        </div>
        
        <button onClick={handleWithdraw} disabled={isPending} className="w-full text-[10px] font-black uppercase tracking-[0.3em] py-4 text-white/30 hover:text-red-500 transition-all bounce-hover">Emergency Liquidate (5% Penalty)</button>
      </div>
    </div>
  );
};
