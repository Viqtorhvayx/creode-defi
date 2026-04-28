/**
 * @title CustomWalletButton (Rebuild 2.0)
 * @author Viqtorhvayx
 * @dev Theme-aware wallet button with strict identity formatting (0.0.x vs 0x...).
 */

'use client';

import React from 'react';
import { useWeb3 } from '../context/Web3Context';

interface CustomWalletButtonProps {
  theme?: 'light' | 'dark';
}

export default function CustomWalletButton({ theme = 'dark' }: CustomWalletButtonProps) {
  const { isConnected, accountId, evmAddress, walletType, connect } = useWeb3();

  /**
   * Formatting utility for different wallet types.
   * Credits: Viqtorhvayx
   */
  const formatDisplay = () => {
    if (walletType === 'hashpack' && accountId) {
      // Native Hedera Truncation: 0.0.123...456
      if (accountId.startsWith("0.0.")) {
        const parts = accountId.split('.');
        if (parts.length === 3 && parts[2].length > 5) {
          return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 3)}...${parts[2].substring(parts[2].length - 3)}`;
        }
      }
      return accountId;
    }
    
    if (walletType === 'evm' && evmAddress) {
      // Standard EVM Truncation: 0x12...5678
      return `${evmAddress.substring(0, 6)}...${evmAddress.substring(evmAddress.length - 4)}`;
    }

    return "Resolving...";
  };

  // STRICT PRESERVATION of all inline styles and structural CSS
  const styles: React.CSSProperties = {
    backgroundColor: isConnected ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)') : '#00A8E8',
    color: isConnected ? (theme === 'dark' ? '#FFFFFF' : '#000000') : '#FFFFFF',
    border: `1px solid ${isConnected ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)') : 'transparent'}`,
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '160px',
    boxShadow: isConnected ? 'none' : '0 4px 15px rgba(0, 168, 232, 0.2)',
  };

  return (
    <button 
      style={styles}
      className="custom-wallet-glow" 
      onClick={connect}
      onMouseOver={(e) => {
        if (!isConnected) e.currentTarget.style.backgroundColor = '#0096d1';
        else e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      }}
      onMouseOut={(e) => {
        if (!isConnected) e.currentTarget.style.backgroundColor = '#00A8E8';
        else e.currentTarget.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      }}
    >
      {!isConnected ? "Connect Wallet" : formatDisplay()}
    </button>
  );
}
