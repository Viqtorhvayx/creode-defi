/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Optimized dual-support wallet button for Hedera (Native ID) and EVM.
 * Strictly enforces 0.0.x display for Hedera Testnet users.
 */

"use client";

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { connector } = useAccount();
  
  const [displayAddress, setDisplayAddress] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const resolveIdentity = async () => {
      // 1. Reset state if disconnected
      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      // 2. Identify Network (Decimal 296 or Hex 0x128)
      const isHederaTestnet = Number(chainId) === 296 || String(chainId).toLowerCase() === "0x128" || String(chainId) === "296";

      // 3. Logic for Hedera Native Identity
      if (isHederaTestnet) {
        // If it's already a native ID (starts with 0.0.)
        if (address.startsWith("0.0.")) {
          setDisplayAddress(address);
          return;
        }

        // If it's an EVM address on Hedera, we MUST resolve the 0.0.x
        if (address.startsWith("0x")) {
          setIsResolving(true);
          try {
            const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`);
            const data = await response.json();
            
            if (data && data.account) {
              setDisplayAddress(data.account);
            } else {
              // Fallback for Hedera: Never show 0x. Show syncing status instead.
              setDisplayAddress("Syncing...");
            }
          } catch (error) {
            console.error("Mirror Node resolution failed:", error);
            setDisplayAddress("Syncing...");
          } finally {
            setIsResolving(false);
          }
        }
      } else {
        // 4. Logic for standard EVM (MetaMask on Sepolia, etc.)
        const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
        setDisplayAddress(truncated);
      }
    };

    resolveIdentity();
  }, [address, isConnected, chainId, connector]);

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[170px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : isResolving ? (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          <span>Resolving...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Glowing Green Status Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
          {/* Wallet Address (Full 0.0.x or Truncated 0x) */}
          <span className="font-mono text-[10px] tracking-normal">{displayAddress}</span>
        </div>
      )}
    </button>
  );
}
