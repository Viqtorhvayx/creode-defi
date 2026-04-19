"use client";

import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { XPGauge } from '../components/XPGauge';
import { LockingModule } from '../components/LockingModule';
import { BorrowingModule } from '../components/BorrowingModule';
import { LendingModule } from '../components/LendingModule';

export default function Home() {
  const { address, isConnected, walletType, balance, connectMetaMask, connectHashpack, disconnect } = useWeb3();
  const [userXP, setUserXP] = useState(68);
  const [points, setPoints] = useState(12450);

  return (
    <div className="min-h-screen bg-background text-white selection:bg-terracotta selection:text-black">
      <div className="creode-title">CREODE v1.0.4</div>
      
      {/* Header / Technical Status */}
      <header className="border-b border-white/10 px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-white flex items-center justify-center">
            <span className="text-black font-black text-xl">C</span>
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Creode DeFi Core</h1>
            <p className="text-[10px] text-white/40 font-bold uppercase">Infrastructure Layer: Hedera Testnet</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Active Operator</p>
            <p className="text-xs font-bold text-white/60">Viqtorhvayx</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
          
          <div className="flex gap-2">
            {!isConnected ? (
              <>
                <button onClick={connectMetaMask} className="btn-industrial border border-white/20 text-white/60 hover:border-white hover:text-white">MetaMask</button>
                <button onClick={connectHashpack} className="btn-industrial bg-white text-black">HashPack</button>
              </>
            ) : (
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2">
                <div className="text-right">
                  <p className="text-[8px] font-black uppercase text-cyan">{walletType} Active</p>
                  <p className="text-[10px] font-mono">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
                </div>
                <button onClick={disconnect} className="text-red-500 hover:text-red-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Diagnostics */}
        <div className="lg:col-span-3 space-y-8">
          <XPGauge xp={userXP} />
          
          <div className="industrial-panel">
            <h3 className="text-[10px] font-black uppercase text-white/40 mb-6 tracking-widest">Portfolio Matrix</h3>
            <div className="space-y-4">
              {[
                { label: "Total HBAR", value: balance, unit: "HBAR" },
                { label: "Locked Assets", value: "1,200.00", unit: "USDC" },
                { label: "Collateral", value: "500.00", unit: "USDT" },
                { label: "Liquidity", value: "24,500.00", unit: "HBAR" }
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-end border-b border-white/5 pb-2">
                  <span className="text-[9px] font-black uppercase text-white/40">{item.label}</span>
                  <div className="text-right">
                    <span className="text-xs font-bold block">{Number(item.value).toFixed(2)}</span>
                    <span className="text-[8px] font-black text-white/20 uppercase">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="industrial-panel bg-terracotta/5 border-terracotta/20">
            <h3 className="text-[10px] font-black uppercase text-terracotta mb-2 tracking-widest">System Notice</h3>
            <p className="text-[10px] text-white/60 leading-relaxed uppercase font-bold">
              All transactions are final on the Hedera Testnet. Ensure proper collateralization to avoid liquidation.
            </p>
          </div>
        </div>

        {/* Right Column: Operations */}
        <div className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <LockingModule />
            <div className="space-y-8">
              <LendingModule points={points} />
              <BorrowingModule xp={userXP} />
            </div>
          </div>

          <div className="industrial-panel">
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-white">Market Protocol</h2>
                <p className="text-[10px] text-white/40 uppercase font-bold mt-1">Live Liquidity Pools</p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[8px] font-black text-white/20 uppercase block">Total Value Locked</span>
                  <span className="text-xs font-bold text-cyan">$2,471,082.00</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black uppercase text-white/20 tracking-widest border-b border-white/10">
                    <th className="pb-4">Asset ID</th>
                    <th className="pb-4 text-right">Supply APY</th>
                    <th className="pb-4 text-right">Borrow APY</th>
                    <th className="pb-4 text-right">Utilization</th>
                    <th className="pb-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-bold">
                  {[
                    { id: "HBAR", sApy: "4.2%", bApy: "6.8%", util: "42%" },
                    { id: "USDC", sApy: "8.1%", bApy: "12.4%", util: "88%" },
                    { id: "USDT", sApy: "7.9%", bApy: "11.9%", util: "75%" }
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-black">{row.id}</td>
                      <td className="py-4 text-right text-sage">{row.sApy}</td>
                      <td className="py-4 text-right text-terracotta">{row.bApy}</td>
                      <td className="py-4 text-right text-white/40">{row.util}</td>
                      <td className="py-4 text-right">
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-black uppercase border border-white/20 px-3 py-1 hover:bg-white hover:text-black">Execute</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 border-t border-white/10 px-8 py-12 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20">System Attribution</p>
          <p className="text-xs font-bold text-white/40 mt-1">ENGINEERED BY <span className="text-white">VIQTORHVAYX</span></p>
        </div>
        <div className="text-[9px] font-bold text-white/20 uppercase max-w-sm leading-relaxed text-left md:text-right">
          CREODE IS A DECENTRALIZED PROTOCOL FOR ASSET OPTIMIZATION. ALL OPERATIONS ARE GOVERNED BY SMART CONTRACTS ON THE HEDERA NETWORK.
        </div>
      </footer>
    </div>
  );
}
