"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export const BorrowingModule: React.FC<{ xp: number }> = ({ xp }) => {
  const { borrow, isConnected } = useWeb3();
  const [collateral, setCollateral] = useState("");
  const [isPending, setIsPending] = useState(false);
  
  const isLocked = xp < 15;
  const ltv = (xp * 0.8).toFixed(1);

  const handleBorrow = async () => {
    if (!collateral) return;
    try {
      setIsPending(true);
      await borrow(collateral);
      alert("Borrow order executed!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`industrial-panel ${isLocked ? "opacity-40 grayscale pointer-events-none" : ""}`}>
      <div className="mb-8 border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Borrow Infrastructure</h2>
          <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Collateralized Credit</p>
        </div>
        <div className="text-[10px] font-black text-cyan uppercase border border-cyan/30 px-2 py-1">
          LTV: {ltv}%
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[9px] font-black uppercase text-white/40 mb-2 block tracking-widest">Collateral (STABLES)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="industrial-input text-lg pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20">STABLE</span>
          </div>
        </div>

        <div>
          <label className="text-[9px] font-black uppercase text-white/40 mb-2 block tracking-widest">Credit Output (HBAR)</label>
          <div className="bg-black/50 border border-white/5 p-4 flex justify-between items-center">
            <span className="text-white/40 text-[10px] font-bold uppercase">Estimated HBAR</span>
            <span className="text-lg font-black text-white">
              {collateral ? (Number(collateral) * Number(ltv) / 100 / 0.1).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        <button 
          onClick={handleBorrow}
          disabled={!isConnected || isPending || !collateral || isLocked}
          className="btn-cyan w-full py-5 text-sm disabled:opacity-30"
        >
          {isPending ? "EXECUTING..." : "Execute Credit Order"}
        </button>
      </div>
    </div>
  );
};
