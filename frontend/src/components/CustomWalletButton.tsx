/**
 * @title CustomWalletButton (Full Identity Refinement)
 * @author Viqtorhvayx
 * @dev Displays full native Hedera ID with a glowing green status indicator.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [displayAddress, setDisplayAddress] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);

  /**
   * Testnet Address Resolver
   * Credits: Viqtorhvayx
   */
  useEffect(() => {
    const resolveIdentity = async () => {
      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      const numericChainId = Number(chainId);
      const isHederaTestnet = numericChainId === 296;

      if (isHederaTestnet && address.startsWith("0x")) {
        setIsResolving(true);
        try {
          const baseUrl = "https://testnet.mirrornode.hedera.com";
          const res = await fetch(`${baseUrl}/api/v1/accounts/${address.toLowerCase()}`);
          const data = await res.json();
          
          if (data && data.account) {
            setDisplayAddress(data.account);
          } else {
            setDisplayAddress(address);
          }
        } catch (error) {
          console.error("Testnet Mirror Node Fetch Failed:", error);
          setDisplayAddress(address);
        } finally {
          setIsResolving(false);
        }
      } else {
        setDisplayAddress(address);
        setIsResolving(false);
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  /**
   * Smart Formatting Utility
   * Credits: Viqtorhvayx
   */
  const renderAddressContent = () => {
    if (isResolving) {
      return (
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Resolving...
        </span>
      );
    }

    // Full Address Display for Hedera (No Truncation)
    if (displayAddress.startsWith("0.0.")) {
      return (
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] mr-2 shadow-[0_0_8px_#00FF00]"></span>
          <span className="font-mono text-[10px] tracking-normal uppercase">{displayAddress}</span>
        </div>
      );
    }

    // Standard Truncation for EVM Fallback
    const truncated = `${displayAddress.substring(0, 6)}...${displayAddress.substring(displayAddress.length - 4)}`;
    return (
      <div className="flex items-center">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] mr-2 shadow-[0_0_8px_#00FF00]"></span>
        <span className="font-mono text-[10px] tracking-normal uppercase">{truncated}</span>
      </div>
    );
  };

  // STRICT PRESERVATION of structural CSS and Tailwind classes
  return (
    <button 
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[160px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? "Connect Wallet" : renderAddressContent()}
    </button>
  );
}
