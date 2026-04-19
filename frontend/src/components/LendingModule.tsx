"use client";

import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

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
    <div className="industrial-panel">
      <div className="mb-8 border-b border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Liquidity Provision</h2>
          <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Lending Infrastructure</p>
        </div>
        <div className="text-[10px] font-black text-sage uppercase border border-sage/30 px-2 py-1">
          POINTS: {points.toLocaleString()}
        </div>
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
          <label className="text-[9px] font-black uppercase text-white/40 mb-2 block tracking-widest">Supply Amount</label>
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

        <div className="bg-sage/5 border border-sage/20 p-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase">
            <span className="text-white/40">Point Generation Rate:</span>
            <span className="text-sage">1.5x Multiplier</span>
          </div>
        </div>

        <button 
          onClick={handleSupply}
          disabled={!isConnected || isPending || !amount}
          className="btn-industrial bg-sage text-black hover:bg-sage-muted w-full py-5 text-sm disabled:opacity-30"
        >
          {isPending ? "DEPLOYING..." : "Deploy Liquidity"}
        </button>
      </div>
    </div>
  );
};
