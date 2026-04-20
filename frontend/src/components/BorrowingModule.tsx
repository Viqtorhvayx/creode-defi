"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { fetchPrices, MarketPrices } from '../services/PriceService';

/**
 * @title BorrowingModule
 * @author Viqtorhvayx
 * @dev Module for reputation-based borrowing with real-time price-oracle collateralization.
 */
export const BorrowingModule: React.FC<{ xp: number }> = ({ xp }) => {
  const { borrow, isConnected } = useWeb3();
  const [collateralAmount, setCollateralAmount] = useState("");
  const [collateralToken, setCollateralToken] = useState("USDT");
  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  const isLocked = xp < 15;
  
  // Real-time LTV calculation based on XP and market prices
  // Rule: Value(Collateral) must be > Value(Borrowed HBAR)
  // Base LTV is determined by XP (max 80%)
  const baseLtv = Math.min(xp * 0.8, 80);

  useEffect(() => {
    const getPrices = async () => {
      const p = await fetchPrices();
      setPrices(p);
    };
    getPrices();
    const interval = setInterval(getPrices, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const calculateHbarOutput = () => {
    if (!collateralAmount || !prices) return "0.00";
    
    const collateralValue = Number(collateralAmount) * (collateralToken === "USDT" ? prices.usdt : prices.usdc);
    const borrowableValue = collateralValue * (baseLtv / 100);
    const hbarOutput = borrowableValue / prices.hbar;
    
    return hbarOutput.toFixed(2);
  };

  const handleBorrow = async () => {
    if (!collateralAmount) return;
    try {
      setIsPending(true);
      await borrow(collateralAmount);
      alert("Borrow order executed!");
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={`industrial-panel bg-white dark:bg-[#003459] ${isLocked ? "opacity-50 grayscale pointer-events-none" : ""}`}>
      <div className="mb-8 border-b border-black/5 dark:border-white/5 pb-4 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Borrow Infrastructure</h2>
          <p className="text-[11px] text-black/40 dark:text-white/40 uppercase font-semibold mt-1">Collateralized Credit</p>
        </div>
        <div className="text-[10px] font-bold text-accent-blue uppercase bg-accent-blue/5 px-3 py-1.5 rounded-lg border border-accent-blue/10">
          Max LTV: {baseLtv.toFixed(1)}%
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 p-1 bg-black/5 dark:bg-black/20 rounded-xl">
          {["USDT", "USDC"].map((t) => (
            <button
              key={t}
              onClick={() => setCollateralToken(t)}
              className={`text-[11px] font-bold py-2 rounded-lg transition-all duration-200 ${
                collateralToken === t 
                ? "bg-white dark:bg-accent-blue text-black dark:text-white shadow-sm" 
                : "text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 dark:text-white/40 mb-2 block">Collateral Amount</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0.00"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              className="industrial-input text-lg pr-16"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-bold text-black/20 dark:text-white/20">{collateralToken}</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase text-black/40 dark:text-white/40 mb-2 block">Credit Output (HBAR)</label>
          <div className="bg-black/5 dark:bg-black/20 rounded-xl p-4 flex justify-between items-center border border-black/5 dark:border-white/5">
            <span className="text-black/40 dark:text-white/40 text-[11px] font-semibold uppercase">Real-Time Oracle Output</span>
            <span className="text-lg font-bold text-black dark:text-white">
              {calculateHbarOutput()}
            </span>
          </div>
          {prices && (
            <p className="text-[9px] text-black/20 dark:text-white/20 mt-2 text-right uppercase font-bold">
              Oracle Feed: HBAR @ ${prices.hbar.toFixed(4)}
            </p>
          )}
        </div>

        <button 
          onClick={handleBorrow}
          disabled={!isConnected || isPending || !collateralAmount || isLocked}
          className="btn-action w-full py-5 text-sm transition-bounce"
        >
          {isPending ? "Executing Order..." : "Initialize Credit Request"}
        </button>
      </div>
    </div>
  );
};
