"use client";

import React from 'react';

/**
 * @title Logo
 * @author Viqtorhvayx
 * @dev Precision SVG logo for CREODE Protocol with targeted fill/stroke colors for Dark Mode.
 */
export const Logo: React.FC = () => {
  return (
    <div className="flex flex-col select-none group">
      <div className="flex items-center gap-2">
        {/* SVG Icon: Hexagon and Cross are locked to Accent Blue using fill classes */}
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 5L95 27.5V72.5L50 95L5 72.5V27.5L50 5Z" 
            className="stroke-[#00A8E8] dark:stroke-[#00A8E8]" 
            strokeWidth="8" 
          />
          <path 
            d="M50 25V75M25 50H75" 
            className="stroke-[#00A8E8] dark:stroke-[#00A8E8]" 
            strokeWidth="8" 
            strokeLinecap="round" 
          />
        </svg>
        
        {/* Text Element: Explicitly targeted for Dark Mode conversion with dark:text-white */}
        <span className="text-xl font-black tracking-tighter text-black dark:text-white group-hover:text-[#00A8E8] transition-colors duration-300">
          CREODE
        </span>
      </div>
      
      {/* Tagline: Muted corporate text with targeted dark:text-white/40 */}
      <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-[0.2em] mt-1 ml-0.5">
        Structured Credit Infrastructure
      </p>
    </div>
  );
};
