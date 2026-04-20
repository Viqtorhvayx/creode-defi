"use client";

import React from 'react';

interface LogoProps {
  theme?: 'light' | 'dark';
}

/**
 * @title Logo
 * @author Viqtorhvayx
 * @dev Precision SVG logo for CREODE Protocol with explicit theme-detected inline styling.
 */
export const Logo: React.FC<LogoProps> = ({ theme }) => {
  // Explicit color detection
  const brandTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';
  
  // Matched intensity for tagline (Matching 'SYSTEM NOTIFICATION' opacity-60 white in Dark Mode)
  const taglineColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';

  return (
    <div className="flex flex-col select-none group">
      <div className="flex items-center gap-2">
        {/* SVG Icon: Hexagon and Cross are locked to Accent Blue */}
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 5L95 27.5V72.5L50 95L5 72.5V27.5L50 5Z" 
            stroke="#00A8E8"
            strokeWidth="8" 
          />
          <path 
            d="M50 25V75M25 50H75" 
            stroke="#00A8E8"
            strokeWidth="8" 
            strokeLinecap="round" 
          />
        </svg>
        
        {/* Text Element: Explicitly set via inline style for theme detection */}
        <span 
          className="text-xl font-black tracking-tighter transition-colors duration-300"
          style={{ color: brandTextColor }}
        >
          CREODE
        </span>
      </div>
      
      {/* Tagline: Explicitly set via inline style for theme detection. Matched to 'SYSTEM NOTIFICATION' in Dark Mode. */}
      <p 
        className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 ml-0.5"
        style={{ color: taglineColor }}
      >
        STRUCTURED CREDIT INFRASTRUCTURE
      </p>
    </div>
  );
};
