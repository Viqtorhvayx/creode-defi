"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext
 * Description: Advanced Identity Resolution Engine for CREODE Protocol.
 * Maps Hedera EVM aliases to native 0.0.x IDs and manages unified wallet state.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect, useBalance, useChainId } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';

type WalletType = 'hashpack' | 'evm' | null;

interface WalletContextType {
  isConnected: boolean;
  address: string | null; // Raw address from hook
  accountId: string | null; // Resolved Hedera 0.0.x
  evmAddress: string | null; // Resolved EVM 0x...
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
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);

  const { data: balanceData } = useBalance({
    address: (rawAddress?.startsWith('0x') ? rawAddress : undefined) as `0x${string}`
  });

  /**
   * Identity Resolution Engine
   * Strictly credits: Viqtorhvayx
   */
  const resolveIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setEvmAddress(null);
      setWalletType(null);
      return;
    }

    // 1. Detect Network Context
    const isHedera = chainId === 296 || chainId === 295; // Testnet or Mainnet

    // 2. Detect Wallet Type
    const isHashPack = connector?.name.toLowerCase().includes('hashpack') || rawAddress.startsWith('0.0.');
    const type: WalletType = isHashPack ? 'hashpack' : 'evm';
    setWalletType(type);

    if (type === 'hashpack' || isHedera) {
      // Hedera Resolution Flow
      if (rawAddress.startsWith('0.0.')) {
        setAccountId(rawAddress);
        setEvmAddress(null);
      } else if (rawAddress.startsWith('0x')) {
        setEvmAddress(rawAddress);
        // Resolve 0.0.x via Mirror Node
        try {
          const network = chainId === 295 ? 'mainnet' : 'testnet';
          const res = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${rawAddress}`);
          if (res.ok) {
            const data = await res.json();
            if (data.account) {
              setAccountId(data.account);
            } else {
              setAccountId("ID Unresolved");
            }
          }
        } catch (error) {
          console.error("Identity resolution failed:", error);
          setAccountId("Sync Error");
        }
      }
    } else {
      // Standard EVM Flow
      setEvmAddress(rawAddress);
      setAccountId(null);
    }
  }, [isConnected, rawAddress, connector, chainId]);

  useEffect(() => {
    resolveIdentity();
  }, [resolveIdentity]);

  const connect = async () => {
    await open();
  };

  const disconnect = async () => {
    await wagmiDisconnect();
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address: rawAddress || null,
      accountId,
      evmAddress,
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
