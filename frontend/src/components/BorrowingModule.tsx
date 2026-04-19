"use client";

import React, { useState } from 'react';

export const BorrowingModule: React.FC<{ xp: number }> = ({ xp }) => {
  const [collateral, setCollateral] = useState("");
  const isLocked = xp < 15;

  // LTV calculation based on XP
  const ltv = (xp * 0.8).toFixed(1);

  return (
    <div className={`glass-panel p-8 ${isLocked ? "opacity-60 grayscale pointer-events-none" : ""}`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Borrow HBAR</h2>
          <p className="text-text-secondary text-sm">Use Stablecoins as collateral.</p>
        </div>
        <div className="bg-surface-highlight border border-glass-border px-4 py-2 rounded-lg text-xs font-bold text-accent-cyan">
          LTV: {ltv}%
        </div>
      </div>

      {isLocked && (
        <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl mb-6 text-red-400 text-sm font-medium">
          CRITICAL: Borrowing is disabled due to low XP. Repay existing debt to restore score.
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-secondary mb-2 uppercase">Collateral Amount (USDT/USDC)</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={collateral}
              onChange={(e) => setCollateral(e.target.value)}
              className="w-full bg-surface-highlight border border-glass-border rounded-xl p-4 text-white focus:outline-none focus:border-accent-cyan"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary">STABLE</span>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-secondary mb-2 uppercase">Borrowing Estimate</label>
          <div className="bg-surface p-4 rounded-xl border border-glass-border">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Estimated HBAR:</span>
              <span className="text-xl font-bold text-white">
                {collateral ? (Number(collateral) * Number(ltv) / 100 / 0.1).toFixed(2) : "0.00"}
              </span>
            </div>
          </div>
        </div>

        <button className="btn-primary w-full py-4 bg-accent-cyan text-black hover:shadow-[0_0_20px_rgba(129,178,154,0.3)]">
          Borrow HBAR
        </button>
      </div>
    </div>
  );
};
