"use client";

import React, { useState } from 'react';

export const LockingModule: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("HBAR");
  const [duration, setDuration] = useState("3");

  return (
    <div className="glass-panel p-8">
      <h2 className="text-2xl font-bold mb-2">Saving & Locking</h2>
      <p className="text-text-secondary text-sm mb-8">Secure your assets and earn yield on HBAR.</p>

      <div className="space-y-6">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-secondary mb-2 uppercase">Select Asset</label>
          <div className="grid grid-cols-3 gap-3">
            {["HBAR", "USDT", "USDC"].map((t) => (
              <button
                key={t}
                onClick={() => setAsset(t)}
                className={`py-3 rounded-xl font-medium text-sm border transition-all ${
                  asset === t ? "border-accent-cyan bg-accent-cyan/10 text-accent-cyan" : "border-glass-border hover:border-white/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-secondary mb-2 uppercase">Amount</label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-surface-highlight border border-glass-border rounded-xl p-4 text-white focus:outline-none focus:border-accent-terracotta"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-text-secondary mb-2 uppercase">Lock Duration (Weeks)</label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="bg-surface-highlight border border-glass-border rounded-xl p-4 text-white focus:outline-none"
          >
            <option value="3">3 Weeks (Min)</option>
            <option value="6">6 Weeks</option>
            <option value="12">12 Weeks</option>
            <option value="24">24 Weeks</option>
          </select>
        </div>

        <div className="bg-accent-terracotta/5 border border-accent-terracotta/20 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">Estimated Yield:</span>
            <span className="text-accent-terracotta font-bold">{asset === "HBAR" ? "0.3% / 3w" : "0.00%"}</span>
          </div>
          <div className="flex justify-between items-center text-xs mt-2 text-text-secondary">
            <span>Early Withdrawal Penalty:</span>
            <span>5.00%</span>
          </div>
        </div>

        <button className="btn-primary w-full py-4 text-lg">Lock Assets</button>
      </div>
    </div>
  );
};
