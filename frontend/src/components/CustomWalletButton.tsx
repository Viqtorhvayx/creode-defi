/**
 * @title CustomWalletButton (Strict Testnet)
 * @author Viqtorhvayx
 * @dev Dynamic identity switcher strictly for Testnet (0.0.x vs 0x...).
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

      // Check if on Hedera Testnet (Chain ID 296)
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
            setDisplayAddress(address); // Fallback to EVM
          }
        } catch (error) {
          console.error("Testnet Mirror Node Fetch Failed:", error);
          setDisplayAddress(address);
        } finally {
          setIsResolving(false);
        }
      } else {
        // Standard EVM Testnet display
        setDisplayAddress(address);
        setIsResolving(false);
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  /**
   * Truncation Utility
   */
  const formatText = (addr: string) => {
    if (!addr) return "";
    if (addr.startsWith("0.0.")) {
      const parts = addr.split('.');
      if (parts.length === 3 && parts[2].length > 5) {
        return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 3)}...${parts[2].substring(parts[2].length - 3)}`;
      }
      return addr;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // STRICT PRESERVATION of structural CSS and Tailwind classes
  return (
    <button 
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[160px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : isResolving ? (
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Resolving...
        </span>
      ) : (
        formatText(displayAddress)
      )}
    </button>
  );
}
