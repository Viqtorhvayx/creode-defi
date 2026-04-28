/**
 * @title CustomWalletButton
 * @author Viqtorhvayx
 * @dev Custom identity-aware wallet button to bypass AppKit/Wagmi UI conflicts and force native Hedera IDs.
 */

'use client';

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useEffect, useState } from 'react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork(); 
  const [nativeAddress, setNativeAddress] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchHederaAddress = async () => {
      // If not connected or no EVM address to convert, reset
      if (!isConnected || !address || !address.startsWith("0x")) {
        setNativeAddress(address || "");
        return;
      }

      setIsFetching(true);
      try {
        // Dynamically select Mirror Node based on connected network (296 = Testnet, 295 = Mainnet)
        const isTestnet = chainId === 296 || String(chainId).includes("296");
        const baseUrl = isTestnet 
          ? "https://testnet.mirrornode.hedera.com" 
          : "https://mainnet-public.mirrornode.hedera.com";
          
        const response = await fetch(`${baseUrl}/api/v1/accounts/${address}`);
        const data = await response.json();
        
        if (data && data.account) {
          setNativeAddress(data.account); // Set strictly to 0.0.x
        } else {
          setNativeAddress(address); // Fallback
        }
      } catch (error) {
        console.error("Mirror Node Fetch Error:", error);
        setNativeAddress(address); // Fallback
      } finally {
        setIsFetching(false);
      }
    };

    fetchHederaAddress();
  }, [address, isConnected, chainId]);

  // Clean truncation formatting for the UI
  const displayAddress = nativeAddress?.startsWith("0.0.") 
    ? `${nativeAddress.slice(0, 6)}...${nativeAddress.slice(-4)}`
    : nativeAddress?.startsWith("0x")
    ? `${nativeAddress.slice(0, 6)}...${nativeAddress.slice(-4)}`
    : nativeAddress;

  return (
    <button 
      onClick={() => open()} 
      className="bg-[#00A8E8] hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center min-w-[140px] text-xs uppercase tracking-wider"
    >
      {!isConnected ? "Connect Wallet" : isFetching ? "Loading..." : displayAddress}
    </button>
  );
}
