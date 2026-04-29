/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Robust dual-support wallet button. Strictly enforces Hedera 0.0.x display.
 * Uses direct session extraction and Mirror Node fallback for maximum accuracy.
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
      // 1. Reset if disconnected
      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      // 2. Identify Hedera Network (Decimal 296, Hex 0x128)
      const cid = String(chainId);
      const isHedera = cid === "296" || cid.toLowerCase() === "0x128" || cid.includes("296");

      if (isHedera) {
        // Path A: Address is already native 0.0.x
        if (address.startsWith("0.0.")) {
          setDisplayAddress(address);
          return;
        }

        setIsResolving(true);
        
        // Path B: Attempt direct session extraction (Most reliable for HashPack)
        try {
          const provider: any = await connector?.getProvider();
          const accounts = provider?.session?.namespaces?.hedera?.accounts;
          if (accounts && accounts[0]) {
            const id = accounts[0].split(':').pop();
            if (id && id.startsWith("0.0.")) {
              setDisplayAddress(id);
              setIsResolving(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Session extraction failed, falling back to Mirror Node.");
        }

        // Path C: Mirror Node Fallback for 0x addresses on Hedera
        if (address.startsWith("0x")) {
          try {
            const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`);
            const data = await res.json();
            if (data && data.account) {
              setDisplayAddress(data.account);
            } else {
              setDisplayAddress("Syncing...");
            }
          } catch (e) {
            setDisplayAddress("Syncing...");
          } finally {
            setIsResolving(false);
          }
          return;
        }
      }

      // 3. Logic for standard EVM (MetaMask on Sepolia, etc.)
      const truncated = address.length > 13 
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : address;
      setDisplayAddress(truncated);
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
