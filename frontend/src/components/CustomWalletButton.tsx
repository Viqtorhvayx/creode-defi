/**
 * @title CustomWalletButton for CREODE dApp
 * @author Viqtorhvayx
 * @dev Updated to reflect refined connected state UI with full native address display.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [nativeAddress, setNativeAddress] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);

  /**
   * Hedera Testnet Identity Resolver
   * Fetches the native 0.0.x account ID from the Mirror Node.
   * Credits: Viqtorhvayx
   */
  useEffect(() => {
    const resolveIdentity = async () => {
      if (!isConnected || !address) {
        setNativeAddress("");
        return;
      }

      // Check for Hedera Testnet (296 or 0x128)
      const isHederaTestnet = String(chainId) === "296" || String(chainId) === "0x128";

      if (isHederaTestnet && address.startsWith("0x")) {
        setIsResolving(true);
        try {
          const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address.toLowerCase()}`);
          const data = await res.json();
          
          if (data && data.account) {
            setNativeAddress(data.account);
          } else {
            setNativeAddress(address);
          }
        } catch (error) {
          console.error("Mirror Node Fetch Failed:", error);
          setNativeAddress(address);
        } finally {
          setIsResolving(false);
        }
      } else {
        setNativeAddress(address);
        setIsResolving(false);
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId]);

  const renderConnectedState = () => {
    if (isResolving) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>Resolving...</span>
        </div>
      );
    }

    // Logic: If it's a native Hedera address (0.0.x), display it in full.
    // Otherwise, apply standard truncation for EVM/Hex addresses to fit UI.
    const isNativeId = nativeAddress.startsWith("0.0.");
    const finalDisplayAddress = isNativeId 
      ? nativeAddress 
      : `${nativeAddress.substring(0, 6)}...${nativeAddress.substring(nativeAddress.length - 4)}`;

    return (
      <div className="flex items-center justify-center">
        {/* Glowing Green Status Dot */}
        <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] mr-2 shadow-[0_0_8px_#00FF00]"></span>
        <span className="font-mono text-[10px] uppercase tracking-normal">
          {finalDisplayAddress}
        </span>
      </div>
    );
  };

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[160px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? "Connect Wallet" : renderConnectedState()}
    </button>
  );
}
