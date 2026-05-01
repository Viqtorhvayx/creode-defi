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

  // Organic Heartbeat Logic: Generate randomized variations for a realistic EKG feel
  const [pulseVariations] = React.useState(() => 
    Array.from({ length: 10 }).map(() => ({
      pPeak: 2 + Math.random() * 8,      // Significant variance in P-wave
      qrsPeak: 15 + Math.random() * 30, // Significant variance in QRS spike
      tPeak: 5 + Math.random() * 15,    // Significant variance in T-wave
      spacing: 70 + Math.random() * 50,  // Randomized pulse frequency
      drift: Math.random() * 10          // Subtle horizontal jitter
    }))
  );

  // Calculate total unit width for a perfectly seamless loop
  const unitWidth = pulseVariations.reduce((acc, v) => acc + v.spacing, 0);
  let cumulativeOffset = 0;

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
          viewBox={`0 0 ${unitWidth} 60`}
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
                100% { transform: translateX(-${unitWidth}px); }
              }
              .ecg-line-container {
                animation: ecg-scroll ${Math.max(4, 10 - (xp / 10))}s linear infinite;
                display: flex;
              }
            `}
          </style>

          {/* Seamless Loop: Rendering sequence twice and animating by exactly one unitWidth */}
          <g className="ecg-line-container">
            {[...pulseVariations, ...pulseVariations].map((v, i) => {
              const startX = cumulativeOffset;
              cumulativeOffset += v.spacing;
              const xpScale = xp / 100;
              
              return (
                <path
                  key={i}
                  d={`M ${startX} 30 
                     L ${startX + 10 + v.drift} 30 
                     L ${startX + 12 + v.drift} ${30 - v.pPeak * xpScale} 
                     L ${startX + 14 + v.drift} 30 
                     L ${startX + 18 + v.drift} ${30 - v.qrsPeak * xpScale} 
                     L ${startX + 22 + v.drift} ${30 + (v.qrsPeak * 0.6) * xpScale} 
                     L ${startX + 26 + v.drift} 30 
                     L ${startX + 30 + v.drift} ${30 - v.tPeak * xpScale} 
                     L ${startX + 35 + v.drift} 30 
                     L ${startX + v.spacing} 30`}
                  fill="none"
                  stroke={gaugeColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
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
