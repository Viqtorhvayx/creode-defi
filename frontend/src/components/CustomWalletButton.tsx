/**
 * @title CustomWalletButton (Deep Diagnostics)
 * @author Viqtorhvayx
 * @dev Added verbose logging to diagnose why the native address is not resolving.
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
   * Deep Diagnostic Resolver
   * Credits: Viqtorhvayx
   */
  useEffect(() => {
    const resolveIdentity = async () => {
      console.log("CREODE DEBUG - Connection Status:", { isConnected, address, chainId });

      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      // Handle both Number (296) and Hex (0x128) for Hedera Testnet
      const isHederaTestnet = String(chainId) === "296" || String(chainId) === "0x128";

      if (isHederaTestnet && address.startsWith("0x")) {
        console.log("CREODE DEBUG - Hedera Testnet Detected. Resolving native ID...");
        setIsResolving(true);
        try {
          const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address.toLowerCase()}`;
          console.log("CREODE DEBUG - Fetching from Mirror Node:", url);
          
          const res = await fetch(url);
          const data = await res.json();
          console.log("CREODE DEBUG - Mirror Node Data:", data);
          
          if (data && data.account) {
            setDisplayAddress(data.account);
            console.log("CREODE DEBUG - Success! Resolved to:", data.account);
          } else {
            console.warn("CREODE DEBUG - Mirror Node found no account for this address.");
            setDisplayAddress(address);
          }
        } catch (error) {
          console.error("CREODE DEBUG - Mirror Node Fetch Failed:", error);
          setDisplayAddress(address);
        } finally {
          setIsResolving(false);
        }
      } else {
        console.log("CREODE DEBUG - Non-Hedera or Native ID detected. Using raw address.");
        setDisplayAddress(address);
        setIsResolving(false);
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  const renderAddressContent = () => {
    if (isResolving) {
      return (
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Resolving Identity...
        </span>
      );
    }

    if (displayAddress.startsWith("0.0.")) {
      return (
        <div className="flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] mr-2 shadow-[0_0_8px_#00FF00]"></span>
          <span className="font-mono text-[10px] uppercase tracking-normal">{displayAddress}</span>
        </div>
      );
    }

    const truncated = displayAddress.length > 13 
      ? `${displayAddress.substring(0, 6)}...${displayAddress.substring(displayAddress.length - 4)}`
      : displayAddress;

    return (
      <div className="flex items-center">
        <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] mr-2 shadow-[0_0_8px_#00FF00]"></span>
        <span className="font-mono text-[10px] uppercase tracking-normal">{truncated}</span>
      </div>
    );
  };

  return (
    <button 
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[160px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? "Connect Wallet" : renderAddressContent()}
    </button>
  );
}
