"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title LockingModule
 * @author Viqtorhvayx
 * @dev Module for time-locking assets with refined industrial styling and bounce effects.
 */
export const LockingModule: React.FC = () => {
  const { lockAssets, isConnected } = useWeb3();
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("HBAR");
  const [unlockDate, setUnlockDate] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleLock = async () => {
    if (!amount || !unlockDate) return;
    try {
      setIsPending(true);
      const timestamp = Math.floor(new Date(unlockDate).getTime() / 1000);
      await lockAssets(amount, timestamp);
      alert("Lock-up successful!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="industrial-panel bg-white dark:bg-[#003459]">
      <div className="mb-8 border-b border-black/5 dark:border-white/5 pb-4">
        <h2 className="text-xl font-bold tracking-tight">Saving & Locking</h2>
        <p className="text-[11px] text-black/40 dark:text-white/40 uppercase font-semibold mt-1">Structured Staking Infrastructure</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 p-1 bg-black/5 dark:bg-black/20 rounded-xl">
          {["HBAR", "USDT", "USDC"].map((t) => (
            <button
              key={t}
              onClick={() => setAsset(t)}
              className={`text-[11px] font-bold py-2 rounded-lg transition-all duration-200 ${
                asset === t 
                ? "bg-white dark:bg-accent-blue text-black dark:text-white shadow-sm" 
                : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 dark:text-white/40 mb-2 block">Deposit Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="industrial-input text-lg pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/20 dark:text-white/20">{asset}</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 dark:text-white/40 mb-2 block">Maturity Date</label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="industrial-input"
          />
        </div>

        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5" />
            <div>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Liquidation Penalty Notice</p>
              <p className="text-[11px] text-black/60 dark:text-white/60 mt-1 leading-relaxed font-medium">
                Early withdrawal incurs a <span className="text-black dark:text-white font-bold">5.00% penalty</span>. 
                HBAR yield is <span className="text-black dark:text-white font-bold">0.3%</span> per 21-day cycle.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLock}
          disabled={!isConnected || isPending || !amount || !unlockDate}
          className="btn-action w-full py-5 text-sm transition-bounce"
        >
          {isPending ? "Connecting to Network..." : "Initialize Lock-up"}
        </button>
      </div>
    </div>
  );
};
