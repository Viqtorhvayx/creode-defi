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
  
  // Matched intensity for Dark Mode elements (Matching 'SYSTEM NOTIFICATION' opacity-60 white)
  const matchedWhite = 'rgba(255, 255, 255, 0.6)';
  
  // Secondary labels logic for Light Mode (30% black)
  const secondaryLabelColorLight = 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  return (
    <div className="industrial-panel bg-surface">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: theme === 'dark' ? matchedWhite : secondaryLabelColorLight }}
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
            style={{ color: theme === 'dark' ? matchedWhite : 'rgba(0, 0, 0, 0.2)' }}
          >
            /100
          </span>
        </div>
      </div>
      
      <div className="h-12 w-full bg-black/5 dark:bg-white/5 rounded-xl relative overflow-hidden flex items-center">
        <svg 
          viewBox="0 0 400 60" 
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="ecgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gaugeColor} stopOpacity="0" />
              <stop offset="50%" stopColor={gaugeColor} stopOpacity="1" />
              <stop offset="100%" stopColor={gaugeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          
          <style>
            {`
              @keyframes ecg-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-100px); }
              }
              .ecg-line {
                animation: ecg-scroll ${Math.max(0.8, 2 - (xp / 100))}s linear infinite;
              }
            `}
          </style>

          <g className="ecg-line">
            {[0, 100, 200, 300, 400, 500].map((offset) => (
              <path
                key={offset}
                d={`M ${offset} 30 
                   L ${offset + 10} 30 
                   L ${offset + 12} ${30 - 5 * (xp/100)} 
                   L ${offset + 14} 30 
                   L ${offset + 18} ${30 - 25 * (xp/100)} 
                   L ${offset + 22} ${30 + 15 * (xp/100)} 
                   L ${offset + 26} 30 
                   L ${offset + 30} ${30 - 10 * (xp/100)} 
                   L ${offset + 35} 30 
                   L ${offset + 100} 30`}
                fill="none"
                stroke={gaugeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </g>
        </svg>
        
        {/* Subtle scanline overlay for industrial aesthetic */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(transparent,transparent_2px,rgba(255,255,255,0.05)_2px,rgba(255,255,255,0.05)_4px)]" />
      </div>

      <div className="flex justify-between mt-4">
        <span 
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: theme === 'dark' ? matchedWhite : secondaryLabelColorLight }}
        >
          Threshold: 15 XP
        </span>
      </div>
    </div>
  );
};
