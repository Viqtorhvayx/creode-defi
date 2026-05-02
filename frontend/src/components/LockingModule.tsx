"use client";

/* * Developer: [Viqtorhvayx]
 * Component: LockingModule
 * Description: Time-lock savings vault integrated with the Advanced Identity Engine.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';

interface LockingModuleProps {
  theme?: 'light' | 'dark';
}

export const LockingModule: React.FC<LockingModuleProps> = ({ theme }) => {
  const { balance, balanceSymbol } = useWallet();
  const [amount, setAmount] = useState("");
  const [activeAction, setActiveAction] = useState<'deposit' | 'withdraw' | 'set'>('deposit');

  const [deposited, setDeposited] = useState(2500.00);
  const [earnings, setEarnings] = useState(7.50);
  const [tvl, setTvl] = useState(125000.00);

  const [days, setDays] = useState<string>("21"); 
  const [maturityDate, setMaturityDate] = useState<string>("");

  useEffect(() => {
    updateDateFromDays(21);
  }, []);

  const updateDateFromDays = (d: number) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    setMaturityDate(date.toISOString().split('T')[0]);
  };

  const handleDaysChange = (val: string) => {
    const cleanVal = stripCommas(val);
    setDays(val);
    const numericDays = parseInt(cleanVal) || 0;
    updateDateFromDays(numericDays);
  };

  const handleDeposit = async () => {
    setActiveAction('deposit');
    alert("Lock-up initialized!");
  };

  const handleWithdraw = async () => {
    setActiveAction('withdraw');
    alert("Withdrawal requested!");
  };

  const handleSetMaturity = () => {
    setActiveAction('set');
    alert("Maturity confirmed!");
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-medium";

  const getButtonClasses = (action: 'deposit' | 'withdraw' | 'set') => {
    const isActive = activeAction === action;
    const baseClasses = "flex-1 min-w-[120px] !py-2.5 !h-auto font-bold transition-all duration-300 rounded-[60px] hover:-translate-y-1 hover:shadow-md active:scale-95";
    return isActive 
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

  const handleQuickSelect = (percent: number) => {
    const numericBalance = Number(balance) || 0;
    const rawValue = (numericBalance * (percent / 100)).toString();
    setAmount(formatWithCommas(rawValue));
  };

  const handleMaxSelect = () => {
    setAmount(formatWithCommas(balance));
  };

  const hbarPrice = usePythPrice();

  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(stripCommas(amount)) || 0) * hbarPrice);

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Time-lock savings</h3>
          <p className="text-2xl font-black" style={{ color: primaryTextColor }}>Vault</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: labelColor }}>Target Yield</p>
          <p className="text-[18px] font-black !text-[#10B981] leading-none tracking-[0.04em] flex items-baseline">
            0.30% <span className="text-[10px] font-bold ml-1 tracking-tight" style={{ color: labelColor }}>APY</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="flex flex-col h-full justify-between">
          <div>
            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold" style={{ color: labelColor }}>Deposit</span>
                <span className="text-[11px] font-bold" style={{ color: labelColor }}>{deposited.toLocaleString()} {balanceSymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold" style={{ color: labelColor }}>Earnings</span>
                <span className="text-[11px] font-bold" style={{ color: labelColor }}>{earnings.toLocaleString()} {balanceSymbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold" style={{ color: labelColor }}>TVL</span>
                <span className="text-[11px] font-bold" style={{ color: labelColor }}>{tvl.toLocaleString()} {balanceSymbol}</span>
              </div>
            </div>

            <div className="relative">
              <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: labelColor }}>Amount to Lock ({balanceSymbol})</label>
              <FormattedNumberInput 
                placeholder="0.00"
                className={numericInputClasses}
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
                value={amount}
                onValueChange={setAmount}
              />
              <div className="flex justify-between items-baseline mt-2 px-2">
                <span className="text-[10px] font-bold" style={{ color: '#00A8E8' }}>{usdValue}</span>
                <div className="flex gap-1">
                  <QuickButton label="25%" onClick={() => handleQuickSelect(25)} />
                  <QuickButton label="50%" onClick={() => handleQuickSelect(50)} />
                  <QuickButton label="Max" onClick={handleMaxSelect} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 mt-20">
            <button onClick={handleDeposit} disabled={!amount || Number(stripCommas(amount)) <= 0 || !days || Number(days) <= 0} className={getButtonClasses('deposit')}>Deposit</button>
            <button onClick={handleWithdraw} className={getButtonClasses('withdraw')}>Withdraw</button>
          </div>
        </div>

        <div className="flex flex-col h-full justify-between">
          <div className="space-y-6">
            <div className="bg-[#FF3837]/10 border border-[#FF3837]/20 rounded-2xl px-4 py-3 flex flex-col justify-center min-h-[52px]">
              <p className="text-xs font-medium leading-tight" style={{ color: labelColor }}>
                Note: A <span className="font-bold !text-[#FF3837]">5.00%</span> penalty fee applies if funds are withdrawn before the preset maturity date.
              </p>
            </div>
            <div className="p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border)] rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Early Withdrawal Fee</span>
                <span className="text-[11px] font-black !text-red-500">5.00%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>Calculated Maturity</span>
                <span className="text-[11px] font-bold" style={{ color: primaryTextColor }}>{new Date(maturityDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div>
              <label className="text-[10px] font-bold uppercase block mb-2" style={{ color: labelColor }}>Duration (Days)</label>
              <FormattedNumberInput 
                placeholder="0"
                className={numericInputClasses + " !py-2.5 !h-auto"} 
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
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
