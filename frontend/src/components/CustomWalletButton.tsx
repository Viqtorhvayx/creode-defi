"use client";

/* * Developer: [Viqtorhvayx]
 * Component: CustomWalletButton
 * Description: Specialized wallet button that enforces Hedera native 0.0.x ID display,
 * integrates real-time HBAR balance, and a secure disconnect action.
 * Strictly implements Mirror Node translation logic to bypass EVM hex rendering.
 */

import { useAppKit, useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';

export default function CustomWalletButton({ theme }: { theme?: 'light' | 'dark' }) {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork(); 
  const { disconnect } = useDisconnect();
  
  // Fetch balance using wagmi hook (address needs to be 0x for the hook but resolved to native ID for display)
  const { data: balanceData } = useBalance({ 
    address: (address?.startsWith('0x') ? address : undefined) as `0x${string}` 
  });
  
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

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect();
  };

  const formattedBalance = balanceData 
    ? `${Number(balanceData.formatted).toFixed(2)} ${balanceData.symbol}` 
    : "0.00 HBAR";

  return (
    <button 
      id="custom-wallet-button"
      onClick={() => open()} 
      className="custom-wallet-glow bg-[#00A8E8] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-300 flex items-center justify-center min-w-[170px] text-[11px] uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95"
    >
      {!isConnected ? (
        "Connect Wallet"
      ) : (
        <div className="flex items-center space-x-3 w-full justify-between">
          {/* Section 1: Identity */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00]"></span>
            <span className="font-mono text-[10px] tracking-tight">{displayAddress}</span>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-3 bg-white/20"></div>

          {/* Section 2: Balance */}
          <div className="flex items-center">
            <span className="font-bold text-[10px] whitespace-nowrap">{formattedBalance}</span>
          </div>

          {/* Section 3: Disconnect Action */}
          <div 
            onClick={handleDisconnect}
            className="p-1 hover:bg-white/20 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-center ml-1"
            title="Disconnect Wallet"
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
              <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
