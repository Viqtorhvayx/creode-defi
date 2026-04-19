"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

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
    <div className="industrial-panel">
      <div className="mb-8 border-b border-white/5 pb-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-white">Saving & Locking</h2>
        <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Asset Staking Infrastructure</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2">
          {["HBAR", "USDT", "USDC"].map((t) => (
            <button
              key={t}
              onClick={() => setAsset(t)}
              className={`text-[10px] font-black py-2 border transition-all ${
                asset === t ? "bg-white text-black border-white" : "border-white/10 text-white/40 hover:border-white/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-white/40 mb-2 block tracking-widest">Input Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="industrial-input text-lg pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">{asset}</span>
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-white/40 mb-2 block tracking-widest">Unlock Date</label>
          <input
            type="date"
            value={unlockDate}
            onChange={(e) => setUnlockDate(e.target.value)}
            className="industrial-input"
          />
        </div>

        <div className="bg-red-500/5 border border-red-500/20 p-4">
          <div className="flex items-start gap-3">
            <div className="w-1.5 h-1.5 bg-red-500 mt-1" />
            <div>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Warning: Premature Liquidation</p>
              <p className="text-[10px] text-white/60 mt-1 leading-relaxed">
                Early withdrawal incurs a <span className="text-white font-bold">5.00% penalty</span>. 
                Yield for HBAR is calculated at 0.3% per 21-day cycle.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLock}
          disabled={!isConnected || isPending || !amount || !unlockDate}
          className="btn-terracotta w-full py-5 text-sm disabled:opacity-30"
        >
          {isPending ? "OPERATING..." : "Initialize Lock-up"}
        </button>
      </div>
    </div>
  );
};
