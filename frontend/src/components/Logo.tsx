"use client";

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  theme?: 'light' | 'dark';
}

/**
 * @title Logo
 * @author Viqtorhvayx
 * @dev Modernized inline SVG logo for Creode Protocol.
 * Features an abstract geometric 'C' node structure and updated Title Case typography.
 */
export const Logo: React.FC<LogoProps> = ({ theme }) => {
  const brandTextColor = theme === 'dark' ? '#FFFFFF' : '#0F172A'; // Slate-900 for Light Mode
  const brandBlue = "#00A8E8";

  return (
    <Link href="/" className="flex items-center gap-0 select-none group transition-transform duration-300 active:scale-95">
      {/* Modern Abstract 'C' Node SVG - Acts as the capital 'C' */}
      <div className="relative h-9 w-9">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={brandBlue} />
              <stop offset="100%" stopColor="#0072FF" />
            </linearGradient>
          </defs>
          {/* Main Geometric Arc */}
          <path 
            d="M80 20C65 5 35 5 20 20C5 35 5 65 20 80C35 95 65 95 80 80" 
            stroke="url(#logoGradient)" 
            strokeWidth="12" 
            strokeLinecap="round" 
            className="drop-shadow-[0_0_8px_rgba(0,168,232,0.4)]"
          />
          {/* Interlocking Node */}
          <circle 
            cx="50" 
            cy="50" 
            r="8" 
            fill={brandBlue} 
            className="animate-pulse"
          />
          <path 
            d="M50 50L80 50" 
            stroke={brandBlue} 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeDasharray="4 8"
          />
        </svg>
      </div>

      {/* Modern Brand Typography - Prefixed by the SVG 'C' */}
      <span 
        className="text-xl font-bold tracking-wide transition-colors duration-300 -ml-1.5"
        style={{ color: brandBlue }}
      >
        reode
      </span>
    </Link>
  );
};
