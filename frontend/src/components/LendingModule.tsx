"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

/**
 * @title LendingModule
 * @author Viqtorhvayx
 * @dev Module for providing liquidity and earning points.
 */
export const LendingModule: React.FC<{ points: number }> = ({ points }) => {
  const { provideLiquidity, isConnected } = useWeb3();
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState("HBAR");
  const [isPending, setIsPending] = useState(false);

  const handleSupply = async () => {
    if (!amount) return;
    try {
      setIsPending(true);
      await provideLiquidity(amount);
      alert("Liquidity deployed successfully!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="industrial-panel bg-white shadow-sm border border-black/5">
      <div className="mb-8 border-b border-black/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-black tracking-tight">Liquidity Provision</h2>
          <p className="text-[11px] text-black/40 uppercase font-semibold mt-1">Lending Infrastructure</p>
        </div>
        <div className="text-[10px] font-bold text-accent-blue uppercase bg-accent-blue/5 px-3 py-1.5 rounded-lg border border-accent-blue/10">
          Points: {points.toLocaleString()}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 p-1 bg-black/5 rounded-xl">
          {["HBAR", "USDT", "USDC"].map((t) => (
            <button
              key={t}
              onClick={() => setAsset(t)}
              className={`text-[11px] font-bold py-2 rounded-lg transition-all ${
                asset === t ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 mb-2 block">Supply Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="industrial-input text-lg pr-14"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/20">{asset}</span>
          </div>
        </div>

        <div className="bg-accent-blue/5 border border-accent-blue/10 rounded-xl p-4">
          <div className="flex justify-between items-center text-[11px] font-semibold uppercase">
            <span className="text-black/40">Point Generation Rate</span>
            <span className="text-accent-blue">1.5x Multiplier</span>
          </div>
        </div>

        <button 
          onClick={handleSupply}
          disabled={!isConnected || isPending || !amount}
          className="btn-primary w-full py-4 text-sm font-bold shadow-md shadow-accent-blue/20"
        >
          {isPending ? "Connecting..." : "Deploy Liquidity"}
        </button>
      </div>
    </div>
  );
};
