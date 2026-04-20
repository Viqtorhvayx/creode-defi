"use client";

import React from 'react';

interface XPGaugeProps {
  xp: number;
  theme?: 'light' | 'dark';
}

/**
 * @title XPGauge
 * @author Viqtorhvayx
 * @dev Visual gauge for Borrowing XP with explicit theme-detected inline styling.
 */
export const XPGauge: React.FC<XPGaugeProps> = ({ xp, theme }) => {
  const getGaugeColor = (val: number) => {
    if (val >= 70) return '#25A18E'; // Green
    if (val >= 40) return '#F4E285'; // Yellow
    if (val >= 16) return '#FF5400'; // Orange
    return '#FF3837'; // Red
  };

  const gaugeColor = getGaugeColor(xp);
  
  // Explicit color detection for secondary labels
  const secondaryLabelColor = theme === 'dark' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: secondaryLabelColor }}
          >
            Reputation Metric
          </h3>
          <p 
            className="text-2xl font-black tracking-tighter"
            style={{ color: primaryTextColor }}
          >
            Borrowing XP
          </p>
        </div>
        <div className="text-3xl font-black" style={{ color: gaugeColor }}>
          {xp}
          <span 
            className="text-sm ml-1" 
            style={{ color: theme === 'dark' ? '#FFFFFF' : 'rgba(0, 0, 0, 0.2)' }}
          >
            /100
          </span>
        </div>
      </div>
      
      <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full relative overflow-hidden p-1">
        <div 
          className="h-full transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${xp}%`, backgroundColor: gaugeColor }}
        />
      </div>

      <div className="flex justify-between mt-4">
        <span 
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: secondaryLabelColor }}
        >
          Threshold: 15 XP
        </span>
        {/* 'status: functional' removed as requested */}
      </div>
    </div>
  );
};
