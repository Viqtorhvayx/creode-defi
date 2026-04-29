/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Ultra-reliable wallet button. Strictly enforces Hedera native 0.0.x ID display.
 * Engineered with a multi-path resolution engine to bypass EVM-only rendering.
 */

"use client";

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function CustomWalletButton({ theme }: { theme?: 'light' | 'dark' }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork(); 
  const { connector } = useAccount();
  
  const [displayAddress, setDisplayAddress] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const resolveIdentity = async () => {
      // 1. Instant Exit if disconnected
      if (!isConnected || !address) {
        setDisplayAddress("");
        setIsResolving(false);
        return;
      }

      // Pre-calculate truncated address for fallback
      const truncatedFallback = address.length > 13 
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : address;

      // 2. Multi-Path Hedera Native ID Resolution
      
      // Path A: The address is already a native ID (Common for HashPack sessions)
      if (address.startsWith("0.0.")) {
        setDisplayAddress(address);
        setIsResolving(false);
        return;
      }

      setIsResolving(true);

      // Path B: Direct Session Extraction (Primary for HashPack/WalletConnect)
      try {
        const provider: any = await connector?.getProvider();
        // Check both EIP-6963 and standard WalletConnect session namespaces
        const accounts = provider?.session?.namespaces?.hedera?.accounts || 
                        provider?.session?.namespaces?.['hedera:296']?.accounts;
        
        if (accounts && accounts[0]) {
          const id = accounts[0].split(':').pop();
          if (id && id.startsWith("0.0.")) {
            setDisplayAddress(id);
            setIsResolving(false);
            return;
          }
        }
      } catch (e) {
        // Non-blocking fail
      }

      // Path C: Universal Mirror Node Translation (For MetaMask on Hedera or HashPack EVM mode)
      if (address.startsWith("0x")) {
        try {
          // Query the testnet mirror node using the EVM address
          const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`, {
            signal: AbortSignal.timeout(5000) // Increased to 5s for reliability
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.account) {
              setDisplayAddress(data.account); // Success: Resolved 0.0.x
              setIsResolving(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Mirror Node resolution failed:", e);
        }
      }

      // 3. Final Fallback (If all native paths fail, show truncated EVM)
      setDisplayAddress(truncatedFallback);
      setIsResolving(false);
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
          <span>Translating...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Glowing Green Status Dot */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
          {/* Native Hedera ID (0.0.x) preferred */}
          <span className="font-mono text-[10px] tracking-normal">{displayAddress}</span>
        </div>
      )}
    </button>
  );
}
