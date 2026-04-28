/**
 * @title CustomWalletButton
 * @author Viqtorhvayx
 * @dev Force native Hedera ID display with explicit theme-aware inline styling.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

interface CustomWalletButtonProps {
  theme?: 'light' | 'dark';
}

export default function CustomWalletButton({ theme = 'dark' }: CustomWalletButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [nativeAddress, setNativeAddress] = useState<string>("");
  const [isFetching, setIsFetching] = useState<boolean>(false);

  /**
   * Identity Resolution Hook
   * Credits: Viqtorhvayx
   */
  useEffect(() => {
    const resolveIdentity = async () => {
      if (!isConnected || !address) {
        setNativeAddress("");
        return;
      }

      if (address.startsWith("0.0.")) {
        setNativeAddress(address);
        return;
      }

      if (address.startsWith("0x")) {
        setIsFetching(true);
        try {
          const isTestnet = chainId === 296 || String(chainId).includes("296");
          const baseUrl = isTestnet 
            ? "https://testnet.mirrornode.hedera.com" 
            : "https://mainnet-public.mirrornode.hedera.com";
          
          const response = await fetch(`${baseUrl}/api/v1/accounts/${address.toLowerCase()}`);
          const data = await response.json();
          
          if (data && data.account) {
            setNativeAddress(data.account);
          } else {
            setNativeAddress(address);
          }
        } catch (error) {
          console.error("Mirror Node Fetch Error:", error);
          setNativeAddress(address);
        } finally {
          setIsFetching(false);
        }
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  /**
   * Formatting Truncation
   */
  const formatDisplay = (addr: string) => {
    if (!addr) return "";
    if (addr.startsWith("0.0.")) {
      const parts = addr.split('.');
      if (parts.length === 3 && parts[2].length > 6) {
        return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 3)}...${parts[2].substring(parts[2].length - 3)}`;
      }
      return addr;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Explicit Inline Styles for Theme Consistency
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
      onClick={() => open()} 
      style={styles}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = isConnected 
          ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')
          : '#0096d1';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = isConnected 
          ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')
          : '#00A8E8';
      }}
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : isFetching ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#00A8E8', borderRadius: '50%' }} />
          Resolving...
        </span>
      ) : (
        formatDisplay(nativeAddress || address || "")
      )}
    </button>
  );
}
