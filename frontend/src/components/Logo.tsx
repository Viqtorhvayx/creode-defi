"use client";

import React from 'react';

/**
 * @title Logo
 * @author Viqtorhvayx
 * @dev Stylish SVG logo for the CREODE protocol with integrated corporate tagline.
 */
export const Logo: React.FC = () => {
  return (
    <div className="flex flex-col select-none group">
      <div className="flex items-center gap-2">
        <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5L95 27.5V72.5L50 95L5 72.5V27.5L50 5Z" stroke="currentColor" strokeWidth="8" className="text-accent-blue" />
          <path d="M50 25V75M25 50H75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-black dark:text-white" />
        </svg>
        <span className="text-xl font-black tracking-tighter text-black dark:text-white group-hover:text-accent-blue transition-colors duration-300">
          CREODE
        </span>
      </div>
      <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-[0.2em] mt-1 ml-0.5">
        Structured Credit Infrastructure
      </p>
    </div>
  );
};
