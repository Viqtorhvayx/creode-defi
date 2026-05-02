"use client";

import React from 'react';
import Link from 'next/link';

interface LogoProps {
  theme?: 'light' | 'dark';
}

/**
 * @title Logo
 * @author Viqtorhvayx
 * @dev High-fidelity brand logo for CREODE Protocol.
 * Supports dynamic theme inversion for light/dark mode compatibility.
 */
export const Logo: React.FC<LogoProps> = ({ theme }) => {
  return (
    <Link href="/" className="flex items-center select-none group transition-transform duration-300 active:scale-95">
      <img 
        src="/creode-logo.png" 
        alt="CREODE Logo"
        className={`h-11 w-auto object-contain transition-all duration-300 ${
          theme === 'light' ? 'invert brightness-0' : 'invert-0'
        }`}
      />
    </Link>
  );
};
