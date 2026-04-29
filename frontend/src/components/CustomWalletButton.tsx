/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Dual-support wallet button for Hedera Testnet (full 0.0.x address) and EVM.
 */

"use client";

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useEffect, useState } from 'react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork(); 
  
  const [displayAddress, setDisplayAddress] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      // 1. If disconnected, clear state
      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      // 2. If already natively formatted (rare, but good fallback)
      if (address.startsWith("0.0.")) {
        setDisplayAddress(address); // NO TRUNCATION
        return;
      }

      // 3. If it's an EVM 0x address, check if we need to translate it
      if (address.startsWith("0x")) {
        // Hedera Testnet Chain ID is 296
        const isHederaTestnet = chainId === 296 || String(chainId).includes("296");
        
        if (isHederaTestnet) {
          setIsFetching(true);
          try {
            const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`);
            const data = await response.json();
            
            if (data && data.account) {
              // Success: Set the full, un-truncated 0.0.x address
              setDisplayAddress(data.account);
            } else {
              // Mirror node failed, fallback to truncated EVM
              setDisplayAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
            }
          } catch (error) {
            console.error("Mirror Node Error:", error);
            setDisplayAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
          } finally {
            setIsFetching(false);
          }
        } else {
          // It's a standard EVM chain (like Sepolia or MetaMask), truncate it normally
          setDisplayAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
        }
      }
    };

    fetchAddress();
  }, [address, isConnected, chainId]);

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[160px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : isFetching ? (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>Resolving...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* The Green Status Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
          {/* The Wallet Address */}
          <span className="font-mono text-[10px] uppercase tracking-normal">{displayAddress}</span>
        </div>
      )}
    </button>
  );
}
