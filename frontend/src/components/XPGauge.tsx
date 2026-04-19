"use client";

import React from 'react';

interface XPGaugeProps {
  xp: number;
}

export const XPGauge: React.FC<XPGaugeProps> = ({ xp }) => {
  const percentage = (xp / 100) * 100;
  const isCritical = xp < 15;

  return (
    <div className="glass-panel p-8 flex flex-col items-center">
      <h3 className="text-text-secondary text-sm font-semibold tracking-widest uppercase mb-6">User Reputation</h3>
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="var(--surface-highlight)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke={isCritical ? "#ff4d4d" : "var(--accent-terracotta)"}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={552.92}
            strokeDashoffset={552.92 - (552.92 * percentage) / 100}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-bold text-white">{xp}</span>
          <span className="text-xs font-medium text-text-secondary">XP SCORE</span>
        </div>
      </div>
      <p className={`mt-6 text-sm font-medium ${isCritical ? 'text-red-400' : 'text-text-secondary'}`}>
        {isCritical ? 'CRITICAL: Borrowing Locked' : 'Reputation: Stable'}
      </p>
    </div>
  );
};
