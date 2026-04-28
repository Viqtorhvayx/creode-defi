/**
 * @title CustomWalletButton
 * @author Viqtorhvayx
 * @dev Hardened wallet button with direct session extraction for native Hedera IDs (0.0.x).
 */

'use client';

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function CustomWalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { connector } = useAccount();
  const { chainId } = useAppKitNetwork(); 
  const [nativeAddress, setNativeAddress] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const fetchHederaAddress = async () => {
      // Clear state on disconnect
      if (!isConnected || !address) {
        setNativeAddress("");
        return;
      }

      // 1. Direct Session Extraction (Priority Path)
      if (connector && connector.name.toLowerCase().includes('hashpack')) {
        try {
          const provider: any = await connector.getProvider();
          console.log("CREODE WALLET RESPONSE:", provider); // Diagnostic Log

          // Extract accountId from WalletConnect v2 namespaces
          const namespaces = provider?.session?.namespaces;
          if (namespaces?.hedera?.accounts) {
            const accountWithChain = namespaces.hedera.accounts[0]; // e.g., hedera:296:0.0.12345
            const extractedId = accountWithChain.split(':').pop();
            if (extractedId && extractedId.startsWith('0.0.')) {
              setNativeAddress(extractedId);
              return;
            }
          }

          // Fallback extraction from provider session properties
          const sessionId = provider?.session?.accountIds?.[0] || provider?.accountIds?.[0];
          if (sessionId && sessionId.toString().startsWith('0.0.')) {
            setNativeAddress(sessionId.toString());
            return;
          }
        } catch (e) {
          console.warn("CREODE - Direct session extraction failed, falling back to mirror node.");
        }
      }

      // 2. Mirror Node Fetch (Fallback Path for EVM addresses)
      if (address.startsWith("0x")) {
        setIsFetching(true);
        try {
          const isTestnet = chainId === 296 || String(chainId).includes("296");
          const baseUrl = isTestnet 
            ? "https://testnet.mirrornode.hedera.com" 
            : "https://mainnet-public.mirrornode.hedera.com";
            
          const response = await fetch(`${baseUrl}/api/v1/accounts/${address}`);
          const data = await response.json();
          
          if (data && data.account) {
            setNativeAddress(data.account);
          } else {
            setNativeAddress(address); // Fallback to raw if not indexed
          }
        } catch (error) {
          console.error("Mirror Node Fetch Error:", error);
          setNativeAddress(address);
        } finally {
          setIsFetching(false);
        }
      } else {
        setNativeAddress(address);
      }
    };

    fetchHederaAddress();
  }, [address, isConnected, chainId, connector]);

  // Clean truncation formatting for the UI
  const displayAddress = nativeAddress?.startsWith("0.0.") 
    ? (nativeAddress.length > 12 
        ? `${nativeAddress.slice(0, 6)}...${nativeAddress.slice(-4)}` 
        : nativeAddress)
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
