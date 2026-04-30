"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Identity Resolution Fix)
 * Description: Corrected Identity Resolution Engine.
 * Fixes "ID UNRESOLVED" by isolating HashPack logic and correcting Mirror Node parsing for EVM.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect, useBalance, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

type WalletType = 'hashpack' | 'evm' | null;

interface WalletContextType {
  isConnected: boolean;
  address: string | null; 
  accountId: string | null; 
  walletType: WalletType;
  balance: string;
  balanceSymbol: string;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address: rawAddress, isConnected, connector } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();
  const chainId = useChainId();

  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);

  const { data: balanceData } = useBalance({
    address: (rawAddress?.startsWith('0x') ? rawAddress : undefined) as `0x${string}`
  });

  /**
   * Corrected Identity Resolution Engine
   * Strictly credits: Viqtorhvayx
   */
  const resolveNativeIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      return;
    }

    // 1. Precise Wallet Type Detection
    const type: WalletType = connector?.name.toLowerCase().includes('hashpack') ? 'hashpack' : 'evm';
    setWalletType(type);

    console.log(`[WalletContext] Detected Type: ${type}, Address: ${rawAddress}`);

    // 2. HASHPACK SEPARATE HANDLING: Bypass mapping if already native or from HashPack
    if (type === 'hashpack') {
      if (rawAddress.startsWith('0.0.')) {
        setAccountId(rawAddress);
        return;
      }
      
      // Attempt session extraction if HashPack gives 0x (fallback)
      try {
        const provider: any = await connector?.getProvider();
        const accounts = provider?.session?.namespaces?.hedera?.accounts;
        if (accounts && accounts[0]) {
          const id = accounts[0].split(':').pop();
          if (id && id.startsWith('0.0.')) {
            setAccountId(id);
            return;
          }
        }
      } catch (e) {
        console.warn("[WalletContext] HashPack session extraction failed.");
      }
    }

    // 3. EVM MAPPING FIX: Corrected Mirror Node Query with Case Sensitivity Fix
    if (rawAddress.startsWith('0x')) {
      const truncatedEVM = `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}`;
      setAccountId("Resolving ID...");
      
      try {
        const network = chainId === 295 ? 'mainnet' : 'testnet';
        // Case Sensitivity Fix: .toLowerCase() is mandatory for Mirror Node API
        const endpoint = `https://${network}.mirrornode.hedera.com/api/v1/accounts?account.evm_address=${rawAddress.toLowerCase()}`;
        
        console.log(`[WalletContext] Querying Mirror Node: ${endpoint}`);
        
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          console.log(`[WalletContext] Mirror Node Response:`, data);

          if (data.accounts && data.accounts.length > 0) {
            // Success: Map found
            setAccountId(data.accounts[0].account);
          } else {
            // Fallback: Display truncated EVM if no native ID is linked
            setAccountId(truncatedEVM);
          }
        } else {
          setAccountId(truncatedEVM);
        }
      } catch (error) {
        console.error("[WalletContext] Mirror Node error:", error);
        setAccountId(truncatedEVM);
      }
    } else if (rawAddress.startsWith('0.0.')) {
        setAccountId(rawAddress);
    }
  }, [isConnected, rawAddress, connector, chainId]);

  useEffect(() => {
    resolveNativeIdentity();
  }, [resolveNativeIdentity]);

  const connect = async () => {
    await open();
  };

  const disconnect = async () => {
    await wagmiDisconnect();
    setAccountId(null);
    setWalletType(null);
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address: rawAddress || null,
      accountId,
      walletType,
      balance: balanceData ? Number(balanceData.formatted).toFixed(2) : "0.00",
      balanceSymbol: balanceData?.symbol || "HBAR",
      connect,
      disconnect
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
