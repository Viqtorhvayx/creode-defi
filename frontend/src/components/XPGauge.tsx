"use client";

import React from 'react';

interface XPGaugeProps {
  xp: number;
}

export const XPGauge: React.FC<XPGaugeProps> = ({ xp }) => {
  const isCritical = xp < 15;

  return (
    <div className="industrial-panel">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-tighter text-white/40">Reputation Metric</h3>
          <p className="text-2xl font-black text-white">BORROWING XP</p>
        </div>
        <div className={`text-3xl font-black ${isCritical ? 'text-red-500' : 'text-terracotta'}`}>
          {xp}<span className="text-xs text-white/20">/100</span>
        </div>
      </div>
      
      <div className="h-4 w-full bg-white/5 border border-white/10 relative overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-500' : 'bg-terracotta'}`}
          style={{ width: `${xp}%` }}
        />
        {/* Technical Grid Overlay */}
        <div className="absolute inset-0 flex justify-between px-[10%] pointer-events-none">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="w-[1px] h-full bg-white/10" />
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-[9px] font-bold text-white/20 uppercase">Safety Threshold: 15 XP</span>
        <span className={`text-[9px] font-bold uppercase ${isCritical ? 'text-red-500' : 'text-white/40'}`}>
          {isCritical ? 'BORROWING LOCKED' : 'STATUS: FUNCTIONAL'}
        </span>
      </div>
    </div>
  );
};
