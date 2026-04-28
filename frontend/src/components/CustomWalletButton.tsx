/**
 * @title CustomWalletButton
 * @author Viqtorhvayx
 * @dev Force native Hedera ID display by bypassing AppKit web components.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

export default function CustomWalletButton() {
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

      // If already native, set it
      if (address.startsWith("0.0.")) {
        setNativeAddress(address);
        return;
      }

      // If EVM format, force resolution via Mirror Node
      if (address.startsWith("0x")) {
        setIsFetching(true);
        try {
          // Detect network (296 = Testnet, 295 = Mainnet)
          const isTestnet = chainId === 296 || String(chainId).includes("296");
          const baseUrl = isTestnet 
            ? "https://testnet.mirrornode.hedera.com" 
            : "https://mainnet-public.mirrornode.hedera.com";
          
          const response = await fetch(`${baseUrl}/api/v1/accounts/${address.toLowerCase()}`);
          const data = await response.json();
          
          if (data && data.account) {
            setNativeAddress(data.account);
          } else {
            setNativeAddress(address); // Fallback
          }
        } catch (error) {
          console.error("Mirror Node Fetch Error:", error);
          setNativeAddress(address); // Fallback
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
      if (parts.length === 3 && parts[2].length > 5) {
        return `${parts[0]}.${parts[1]}.${parts[2].substring(0, 2)}...${parts[2].substring(parts[2].length - 3)}`;
      }
      return addr;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <button 
      onClick={() => open()} 
      className="bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center min-w-[150px] text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : isFetching ? (
        <span className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          Resolving...
        </span>
      ) : (
        formatDisplay(nativeAddress || address || "")
      )}
    </button>
  );
}
