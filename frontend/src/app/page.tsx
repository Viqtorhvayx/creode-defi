"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { BorrowingModule } from '../components/BorrowingModule';

export default function Home() {
  const { address, isConnected, walletType, balance, connectMetaMask, connectHashpack, disconnect } = useWeb3();
  const [userXP, setUserXP] = useState(68); // Mock XP for demo
  const [points, setPoints] = useState(12450); // Mock Lending Points

  return (
    <div className="min-h-screen p-8 md:p-16 max-w-7xl mx-auto animate-fade-in">
      <div className="creode-title">CREODE DEFI</div>
      
      <header className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <h1 className="text-6xl font-bold tracking-tighter mb-4 text-white">
            Future Proof <br /> 
            <span className="text-accent-terracotta">Liquidity.</span>
          </h1>
          <p className="text-text-secondary max-w-md text-lg leading-relaxed">
            The next generation of Hedera Testnet DeFi. Optimized by <span className="text-accent-cyan font-bold">Viqtorhvayx</span>.
          </p>
        </div>

        <div className="flex space-x-4">
          <div className="glass-panel px-8 py-6 text-center">
            <span className="block text-xs font-bold text-text-secondary uppercase mb-1">HBAR Balance</span>
            <span className="text-3xl font-bold text-white">{Number(balance).toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col space-y-2">
            {!isConnected ? (
              <>
                <button onClick={connectMetaMask} className="btn-primary py-2 text-sm bg-accent-terracotta">
                  MetaMask
                </button>
                <button onClick={connectHashpack} className="btn-primary py-2 text-sm bg-accent-cyan text-black">
                  HashPack
                </button>
              </>
            ) : (
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-accent-cyan uppercase mb-1">{walletType} Active</span>
                <button onClick={disconnect} className="btn-secondary py-2 text-sm border border-accent-terracotta/50 text-accent-terracotta">
                  {address?.slice(0, 6)}...{address?.slice(-4)} (Disconnect)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / XP */}
        <div className="lg:col-span-4 space-y-8">
          <XPGauge xp={userXP} />
          
          <div className="glass-panel p-8">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-6">Active Assets</h3>
            <div className="space-y-4">
              {[
                { name: "HBAR", val: "24,500", type: "Liquid" },
                { name: "USDC", val: "1,200", type: "Locked" },
                { name: "USDT", val: "500", type: "Collateral" }
              ].map((item) => (
                <div key={item.name} className="flex justify-between items-center py-2">
                  <div>
                    <span className="block font-bold">{item.name}</span>
                    <span className="text-[10px] uppercase font-bold text-text-secondary">{item.type}</span>
                  </div>
                  <span className="text-lg font-medium">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <LockingModule />
            <BorrowingModule xp={userXP} />
          </div>

          <div className="glass-panel p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Lending Market</h2>
              <button className="text-xs font-bold text-accent-cyan hover:underline">VIEW STATS</button>
            </div>
            <div className="overflow-hidden rounded-xl border border-glass-border">
              <table className="w-full text-left">
                <thead className="bg-surface-highlight text-xs uppercase text-text-secondary">
                  <tr>
                    <th className="p-4">Pool</th>
                    <th className="p-4">Total Liquidity</th>
                    <th className="p-4">Points Mult.</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  {[
                    { pool: "HBAR", liq: "1.2M", mult: "1.5x" },
                    { pool: "USDC", liq: "850K", mult: "1.0x" },
                    { pool: "USDT", liq: "420K", mult: "1.0x" }
                  ].map((row) => (
                    <tr key={row.pool} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{row.pool}</td>
                      <td className="p-4 text-text-secondary">{row.liq}</td>
                      <td className="p-4 text-accent-cyan font-mono">{row.mult}</td>
                      <td className="p-4">
                        <button className="text-[10px] font-bold border border-glass-border px-3 py-1 rounded hover:bg-white text-white hover:text-black transition-all">LEND</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <footer className="credit-footer mt-24 border-t border-glass-border">
        <p>CREODE DEFI SYSTEM • SECURED BY HEDERA HTS</p>
        <p className="mt-2 text-xs">
          Engineered by <a href="#" className="credit-link">Viqtorhvayx</a>
        </p>
      </footer>
    </div>
  );
}
