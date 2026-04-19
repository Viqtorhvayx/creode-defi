"use client";

import React from 'react';

interface XPGaugeProps {
  xp: number;
}

/**
 * @title XPGauge
 * @author Viqtorhvayx
 * @dev Visual gauge for Borrowing XP with dynamic color thresholds.
 */
export const XPGauge: React.FC<XPGaugeProps> = ({ xp }) => {
  // Dynamic color logic based on XP percentage
  const getGaugeColor = (val: number) => {
    if (val >= 70) return '#25A18E'; // Green
    if (val >= 40) return '#F4E285'; // Yellow
    if (val >= 16) return '#FF5400'; // Orange
    return '#FF3837'; // Red
  };

  const gaugeColor = getGaugeColor(xp);
  const isCritical = xp <= 15;

  return (
    <div className="industrial-panel">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-black/40">Reputation Metric</h3>
          <p className="text-2xl font-bold text-black tracking-tight">Borrowing XP</p>
        </div>
        <div className="text-3xl font-bold" style={{ color: gaugeColor }}>
          {xp}<span className="text-sm text-black/20 ml-1">/100</span>
        </div>
      </div>
      
      <div className="h-3 w-full bg-black/5 rounded-full relative overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${xp}%`, backgroundColor: gaugeColor }}
        />
      </div>

      <div className="flex justify-between mt-3">
        <span className="text-[10px] font-medium text-black/40 uppercase">Min Threshold: 15 XP</span>
        <span className="text-[10px] font-bold uppercase" style={{ color: isCritical ? '#FF3837' : 'rgba(0,0,0,0.4)' }}>
          {isCritical ? 'Borrowing Locked' : 'Status: Functional'}
        </span>
      </div>
    </div>
  );
};
