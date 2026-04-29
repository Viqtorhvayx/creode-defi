/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Specialized wallet button that enforces Hedera native 0.0.x ID display.
 * Strictly implements Mirror Node translation logic to bypass EVM hex rendering.
 */

"use client";

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useEffect, useState } from 'react';

export default function CustomWalletButton({ theme }: { theme?: 'light' | 'dark' }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork(); 
  
  const [displayAddress, setDisplayAddress] = useState("");

  useEffect(() => {
    const resolveNativeId = async () => {
      if (!isConnected || !address) {
        setDisplayAddress("");
        return;
      }

      // Identify Hedera Networks
      const cid = String(chainId);
      const isHederaTestnet = cid === "296" || cid === "0x128";
      const isHederaMainnet = cid === "295" || cid === "0x127";

      if ((isHederaTestnet || isHederaMainnet) && address.startsWith("0x")) {
        setDisplayAddress("Syncing ID...");
        
        try {
          const baseUrl = isHederaMainnet 
            ? "https://mainnet-public.mirrornode.hedera.com" 
            : "https://testnet.mirrornode.hedera.com";
          
          const res = await fetch(`${baseUrl}/api/v1/accounts/${address}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.account) {
              // Successfully resolved native 0.0.x ID
              setDisplayAddress(data.account);
              return;
            }
          }
          // If fetch fails or no account found, do not default to 0x if on Hedera as per requirement
          setDisplayAddress("ID Unresolved");
        } catch (error) {
          setDisplayAddress("Sync Error");
        }
      } else if (address.startsWith("0.0.")) {
        // Already a native ID
        setDisplayAddress(address);
      } else {
        // Standard EVM Truncation for non-Hedera networks
        const truncated = address.length > 13 
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : address;
        setDisplayAddress(truncated);
      }
    };

    resolveNativeId();
  }, [address, isConnected, chainId]);

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[170px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : (
        <div className="flex items-center space-x-2">
          {/* Glowing Green Status Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
          {/* Resolved Display Address (Native ID or Truncated 0x) */}
          <span className="font-mono text-[10px] tracking-normal">{displayAddress}</span>
        </div>
      )}
    </button>
  );
}
