"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Native Enforcement Rebuild)
 * Description: Mandatory Hedera Native Identity Resolution Engine.
 * Enforces 0.0.x Account ID format for ALL wallets (HashPack & MetaMask).
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect, useBalance, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

type WalletType = 'hashpack' | 'evm' | null;

interface WalletContextType {
  isConnected: boolean;
  address: string | null; // Raw address (internal)
  accountId: string | null; // Strictly enforced Hedera 0.0.x
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

  // Balance hook - always uses the EVM address internally for compatibility
  const { data: balanceData } = useBalance({
    address: (rawAddress?.startsWith('0x') ? rawAddress : undefined) as `0x${string}`
  });

  /**
   * Strictly Enforced Identity Resolution Engine
   * Maps 0x aliases to 0.0.x Native IDs via Mirror Node
   * Credits: Viqtorhvayx
   */
  const resolveNativeIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      return;
    }

    const type: WalletType = connector?.name.toLowerCase().includes('hashpack') ? 'hashpack' : 'evm';
    setWalletType(type);

    // Scenario A: Address is already in Native Format (Common in direct HashPack sessions)
    if (rawAddress.startsWith('0.0.')) {
      setAccountId(rawAddress);
      return;
    }

    // Scenario B: Address is in EVM Format (MetaMask or HashPack EVM session)
    if (rawAddress.startsWith('0x')) {
      setAccountId("Resolving ID...");
      
      try {
        // Detect network for correct Mirror Node endpoint
        const network = chainId === 295 ? 'mainnet' : 'testnet';
        const res = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${rawAddress}`);
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.account) {
            // Success: Map EVM address to Native Hedera ID
            setAccountId(data.account);
          } else {
            // Failure: Address exists but has no linked Hedera Account
            setAccountId("No Hedera Account");
          }
        } else {
          setAccountId("No Hedera Account");
        }
      } catch (error) {
        console.error("Mirror Node resolution failed:", error);
        setAccountId("Sync Error");
      }
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
