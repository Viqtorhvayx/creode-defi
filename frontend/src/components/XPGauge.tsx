"use client";

import React from 'react';

interface XPGaugeProps {
  xp: number;
}

/**
 * @title XPGauge
 * @author Viqtorhvayx
 * @dev Visual gauge for Borrowing XP with dynamic color thresholds and theme support.
 */
export const XPGauge: React.FC<XPGaugeProps> = ({ xp }) => {
  const getGaugeColor = (val: number) => {
    if (val >= 70) return '#25A18E'; // Green
    if (val >= 40) return '#F4E285'; // Yellow
    if (val >= 16) return '#FF5400'; // Orange
    return '#FF3837'; // Red
  };

  const gaugeColor = getGaugeColor(xp);
  const isCritical = xp <= 15;

  return (
    <div className="industrial-panel bg-white dark:bg-[#1C1C1E]">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-black/30 dark:text-white/30">Reputation Metric</h3>
          <p className="text-2xl font-black text-black dark:text-white tracking-tighter">Borrowing XP</p>
        </div>
        <div className="text-3xl font-black" style={{ color: gaugeColor }}>
          {xp}<span className="text-sm text-black/20 dark:text-white/20 ml-1">/100</span>
        </div>
      </div>
      
      <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full relative overflow-hidden p-1">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${xp}%`, backgroundColor: gaugeColor }}
        />
      </div>

      <div className="flex justify-between mt-4">
        <span className="text-[10px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">Threshold: 15 XP</span>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: isCritical ? '#FF3837' : 'rgba(0,168,232,0.6)' }}>
          {isCritical ? 'Borrowing Locked' : 'Status: Functional'}
        </span>
      </div>
    </div>
  );
};
