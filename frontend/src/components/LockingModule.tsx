"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';

interface LockingModuleProps {
  theme?: 'light' | 'dark';
}

/**
 * @title LockingModule
 * @author Viqtorhvayx
 * @dev Module for asset locking with synchronized duration (days) and maturity date selection.
 */
export const LockingModule: React.FC<LockingModuleProps> = ({ theme }) => {
  const { lockAssets } = useWeb3();
  const [amount, setAmount] = useState("");
  
  // State for synchronization
  const [days, setDays] = useState<number>(21); // Default 21 days (3 weeks)
  const [maturityDate, setMaturityDate] = useState<string>("");

  // Initialize maturity date on mount
  useEffect(() => {
    updateDateFromDays(21);
  }, []);

  const updateDateFromDays = (d: number) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    setMaturityDate(date.toISOString().split('T')[0]);
  };

  const updateDaysFromDate = (dateStr: string) => {
    const selectedDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      setDays(diffDays);
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setDays(val);
    updateDateFromDays(val);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMaturityDate(val);
    updateDaysFromDate(val);
  };

  const handleAction = async () => {
    try {
      const unlockDate = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
      await lockAssets(amount, unlockDate);
      alert("Lock-up initialized!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Matched intensity for labels (Matching 'SYSTEM NOTIFICATION' opacity-60 white in Dark Mode)
  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  /**
   * Shared classes for professional numerical inputs:
   * - No outline/ring even on focus
   * - Elevated blue undershadow for depth
   * - Smooth 60px corner radius
   * - Suppressed default spinners
   */
  const numericInputClasses = "w-full rounded-[60px] p-3 outline-none focus:outline-none focus:ring-0 border-transparent focus:border-transparent transition-all shadow-[0_4px_15px_rgba(0,168,232,0.15)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: labelColor }}
          >
            Time-lock savings
          </h3>
          <p className="text-2xl font-black" style={{ color: primaryTextColor }}>Vault</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <p 
            className="text-[10px] font-bold uppercase tracking-[0.1em]"
            style={{ color: labelColor }}
          >
            Target Yield
          </p>
          {/* Balanced Rich Green (#10B981) with typographic alignment */}
          <p className="text-[18px] font-black !text-[#10B981] leading-none tracking-[0.04em] flex items-baseline">
            0.30% 
            <span 
              className="text-[10px] font-bold ml-1 tracking-tight"
              style={{ color: labelColor }}
            >
              APY
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label 
              className="text-[10px] font-bold uppercase block mb-2"
              style={{ color: labelColor }}
            >
              Amount to Lock (HBAR)
            </label>
            <input 
              type="number" 
              placeholder="0.00"
              className={numericInputClasses}
              style={{ 
                backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                color: theme === 'dark' ? '#FFFFFF' : '#000000'
              }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label 
                className="text-[10px] font-bold uppercase block mb-2"
                style={{ color: labelColor }}
              >
                Duration (Days)
              </label>
              <input 
                type="number" 
                min="1"
                className={numericInputClasses}
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
                value={days}
                onChange={handleDaysChange}
              />
            </div>
            <div>
              <label 
                className="text-[10px] font-bold uppercase block mb-2"
                style={{ color: labelColor }}
              >
                Maturity Date
              </label>
              <input 
                type="date" 
                className={numericInputClasses}
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                  color: theme === 'dark' ? '#FFFFFF' : '#000000'
                }}
                value={maturityDate}
                onChange={handleDateChange}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-[var(--border)] rounded-2xl">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span 
                className="text-[10px] font-bold uppercase"
                style={{ color: labelColor }}
              >
                Early Exit Fee
              </span>
              <span className="text-[11px] font-black !text-red-500">5.00%</span>
            </div>
            
            {/* 
              Calculated Maturity Section: 
              - Pushed downward with mt-4 to align horizontally with the inputs in the adjacent column
              - Wrapped in a rectangle container to match the input style
            */}
            <div className="mt-4">
              <span 
                className="text-[10px] font-bold uppercase block mb-2"
                style={{ color: labelColor }}
              >
                Calculated Maturity
              </span>
              <div 
                className="w-full rounded-[60px] p-3 shadow-[0_4px_15px_rgba(0,168,232,0.15)] flex items-center justify-center"
                style={{ 
                  backgroundColor: theme === 'dark' ? '#0B0E14' : '#FFFFFF',
                }}
              >
                <span className="text-[13px] font-black" style={{ color: primaryTextColor }}>
                  {new Date(maturityDate).toLocaleDateString(undefined, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleAction}
            disabled={!amount || Number(amount) <= 0 || days <= 0}
            className="btn-action w-full mt-6"
            style={{ borderRadius: '60px' }}
          >
            Initialize
          </button>
        </div>
      </div>
    </div>
  );
};
