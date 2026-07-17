"use client";

import React from 'react';

interface ActivityTableProps {
  theme: 'light' | 'dark';
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ theme }) => {
  const transactions = [
    { id: '1', type: 'Deposit', amount: '2,500.00 HBAR', date: 'May 15, 2026', status: 'Confirmed', hash: '0.0.123456...789' },
    { id: '2', type: 'Yield', amount: '7.50 HBAR', date: 'May 14, 2026', status: 'Confirmed', hash: '0.0.987654...321' },
    { id: '3', type: 'Withdraw', amount: '500.00 HBAR', date: 'May 12, 2026', status: 'Confirmed', hash: '0.0.456123...456' },
  ];

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="glass-panel !rounded-3xl overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <div>
          <h3 className="text-[11px] font-bold tracking-[0.2em] opacity-40 mb-1" style={{ color: labelColor }}>Asset lifecycle</h3>
          <p className="text-2xl font-black tracking-tight" style={{ color: primaryTextColor }}>Protocol activity</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold opacity-40" style={{ color: primaryTextColor }}>Daily volume</p>
            <p className="text-sm font-black text-[#00A8E8]">12.4M HBAR</p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/20">
              <th className="px-8 py-5 text-[10px] font-black tracking-[0.15em] opacity-50" style={{ color: primaryTextColor }}>Type</th>
              <th className="px-8 py-5 text-[10px] font-black tracking-[0.15em] opacity-50" style={{ color: primaryTextColor }}>Amount</th>
              <th className="px-8 py-5 text-[10px] font-black tracking-[0.15em] opacity-50 text-right" style={{ color: primaryTextColor }}>Transaction hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/[0.03] transition-all duration-300 group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.type === 'Deposit' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                      tx.type === 'Yield' ? 'bg-[#00A8E8] shadow-[0_0_10px_rgba(0,168,232,0.5)]' :
                      tx.type === 'Withdraw' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                      'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    }`} />
                    <span className="text-sm font-bold tracking-tight text-white">{tx.type}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white">{tx.amount}</span>
                    <span className="text-[10px] font-bold opacity-40 mt-0.5" style={{ color: primaryTextColor }}>{tx.date}</span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex flex-col items-end">
                    <code className="text-[11px] font-bold text-[#00A8E8] group-hover:underline cursor-pointer tracking-wider">
                      {tx.hash}
                    </code>
                    <span className="text-[9px] font-bold opacity-30 mt-1" style={{ color: primaryTextColor }}>Network confirmed</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-6 bg-white/[0.01] flex justify-center border-t border-white/5">
        <button className="nav-pill !px-12 bg-white/5 hover:bg-[#00A8E8]/10 text-[10px] font-black tracking-[0.25em] text-[#00A8E8] transition-all duration-500 border border-[#00A8E8]/10">
          Sync explorer
        </button>
      </div>
    </div>
  );
};
