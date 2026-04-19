"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Module for reputation-based collateralized borrowing.
 */
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
    <div className={`industrial-panel bg-white shadow-sm border border-black/5 ${isLocked ? "opacity-50 grayscale pointer-events-none" : ""}`}>
      <div className="mb-8 border-b border-black/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-black tracking-tight">Borrow Infrastructure</h2>
          <p className="text-[11px] text-black/40 uppercase font-semibold mt-1">Collateralized Credit</p>
        </div>
        <div className="text-[10px] font-bold text-accent-blue uppercase bg-accent-blue/5 px-3 py-1.5 rounded-lg border border-accent-blue/10">
          Max LTV: {ltv}%
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 mb-2 block">Collateral (STABLE)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="industrial-input text-lg pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/20">USDT/C</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 mb-2 block">Credit Output (HBAR)</label>
          <div className="bg-black/5 rounded-xl p-4 flex justify-between items-center border border-black/5">
            <span className="text-black/40 text-[11px] font-semibold uppercase">Estimated Output</span>
            <span className="text-lg font-bold text-black">
              {collateral ? (Number(collateral) * Number(ltv) / 100 / 0.1).toFixed(2) : "0.00"}
            </span>
          </div>
        </div>

        <button 
          onClick={handleBorrow}
          disabled={!isConnected || isPending || !collateral || isLocked}
          className="btn-primary w-full py-4 text-sm font-bold shadow-md shadow-accent-blue/20"
        >
          {isPending ? "Executing Order..." : "Initialize Credit Request"}
        </button>
      </div>
    </div>
  );
};
