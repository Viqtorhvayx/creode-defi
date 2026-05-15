"use client";

import React from 'react';

interface ActivityTableProps {
  theme: 'light' | 'dark';
}

export const ActivityTable: React.FC<ActivityTableProps> = ({ theme }) => {
  const transactions = [
    { id: '1', type: 'Deposit', amount: '2,500.00 HBAR', date: 'May 15, 2026', status: 'Confirmed', hash: '0.0.123456...789' },
    { id: '2', type: 'Yield', amount: '7.50 HBAR', date: 'May 14, 2026', status: 'Confirmed', hash: '0.0.987654...321' },
    { id: '3', type: 'Borrow', amount: '500.00 HBAR', date: 'May 12, 2026', status: 'Confirmed', hash: '0.0.456123...456' },
    { id: '4', type: 'Repay', amount: '100.00 HBAR', date: 'May 10, 2026', status: 'Confirmed', hash: '0.0.789123...123' },
  ];

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="industrial-panel !p-0 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: labelColor }}>Protocol History</h3>
        <p className="text-xl font-black" style={{ color: primaryTextColor }}>Activity</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Amount</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Date</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: labelColor }}>Status</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: labelColor }}>Transaction Hash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                    tx.type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-500' : 
                    tx.type === 'Yield' ? 'bg-[#00A8E8]/10 text-[#00A8E8]' :
                    tx.type === 'Borrow' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-white/10 text-white'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-white">{tx.amount}</td>
                <td className="px-6 py-4 text-sm text-white/60">{tx.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-tighter">{tx.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <code className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10 text-[#00A8E8] group-hover:bg-[#00A8E8]/10 transition-colors">
                    {tx.hash}
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-white/[0.01] flex justify-center border-t border-white/5">
        <button className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#00A8E8] hover:opacity-80 transition-opacity">
          View All Transactions
        </button>
      </div>
    </div>
  );
};
