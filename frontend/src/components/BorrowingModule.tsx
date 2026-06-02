// Implementation by Viqtorhvayx
"use client";

/* * Developer: [Viqtorhvayx]
 * Component: BorrowingModule
 * Description: Credit facility module integrated with the Advanced Identity Engine.
 * Refactored for Elite Uniswap/Aave aesthetic.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../context/WalletContext';
import { FormattedNumberInput, formatWithCommas, stripCommas } from './FormattedNumberInput';
import { usePythPrice } from '../hooks/usePythPrice';
import { HeartbeatMonitor } from './HeartbeatMonitor';

interface BorrowingModuleProps {
  xp: number;
  theme?: 'light' | 'dark';
}

export const BorrowingModule: React.FC<BorrowingModuleProps> = ({ xp: initialXP, theme }) => {
  const { balance, balanceSymbol } = useWallet();
  const [hbarInput, setHbarInput] = useState("");
  
  const hbarInputNumeric = Number(stripCommas(hbarInput)) || 0;
  const MAX_LTV = 0.65;
  
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');
  const [isClicked, setIsClicked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasInput = hbarInput.length > 0 && Number(stripCommas(hbarInput)) > 0;
  const [collateralToken, setCollateralToken] = useState<'USDT' | 'USDC'>('USDT');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [assetPrice, setAssetPrice] = useState<number | null>(null);
  const [pythHbarPrice, setPythHbarPrice] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  useEffect(() => {
    const fetchPythPrices = async () => {
      setIsPriceLoading(true);
      const collateralFeed = collateralToken === 'USDT' 
        ? '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b' 
        : 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a';
      const hbarFeed = '3728e591097635310e6341af53db8b7ee42da9b3a8d918f9463ce9cca886dfbd';
      
      try {
        const response = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${collateralFeed}&ids[]=${hbarFeed}`);
        const data = await response.json();
        
        if (data.parsed) {
          const colData = data.parsed.find((p: any) => p.id.includes(collateralFeed));
          const hbData = data.parsed.find((p: any) => p.id.includes(hbarFeed));
          
          if (colData) setAssetPrice(Number(colData.price.price) * Math.pow(10, colData.price.expo));
          if (hbData) setPythHbarPrice(Number(hbData.price.price) * Math.pow(10, hbData.price.expo));
        }
      } catch (error) {
        console.error("Pyth Hermes Multi-Fetch Error:", error);
      } finally {
        setIsPriceLoading(false);
      }
    };

    fetchPythPrices();
  }, [collateralToken]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentXP, setCurrentXP] = useState(initialXP);

  const getXPColor = (val: number) => {
    if (val >= 80) return '#00E676'; // Vibrant Neon Green (Safe)
    if (val >= 40) return '#FFEA00'; // STRONG, VIBRANT warning yellow
    return '#FF3837';                // Danger Red
  };

  const labelColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.3)';
  const primaryTextColor = theme === 'dark' ? '#FFFFFF' : '#000000';

  const getTabClasses = (tab: 'deposit' | 'borrow') => {
    const isActive = activeTab === tab;
    const base = `flex-1 !py-3 font-black transition-all duration-500 rounded-[60px] text-[11px] tracking-[0.2em] uppercase`;
    return isActive 
      ? `${base} bg-[#00A8E8] text-white shadow-lg shadow-[#00A8E8]/30`
      : `${base} bg-white/5 text-white/40 hover:bg-white/10`;
  };

  const handleAction = () => {
    if (!hbarInput || Number(stripCommas(hbarInput)) <= 0) return;
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 2000);
    alert("Transaction Sent!");
  };

  const hbarPrice = usePythPrice();
  const usdValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(stripCommas(hbarInput)) || 0) * hbarPrice);

  const maxBorrowHbar = pythHbarPrice ? ((hbarInputNumeric * (assetPrice || 0)) * MAX_LTV / pythHbarPrice) : 0;

  // Calculate dynamic health factor for UI
  const borrowRatio = activeTab === 'borrow' && maxBorrowHbar > 0 ? (hbarInputNumeric / maxBorrowHbar) : 0;
  const healthFactor = activeTab === 'deposit' ? 100 : Math.max(10, 100 - (borrowRatio * 100));
  const isHealthy = healthFactor >= 50;

  return <div />;
};
