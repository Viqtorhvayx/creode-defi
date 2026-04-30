"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Industrial Grade Fix)
 * Description: Robust Identity and Balance Engine for CREODE.
 * Fixes "ID UNRESOLVED" and "0.00 HBAR" issues for both HashPack and EVM wallets.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect, useChainId } from 'wagmi';
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
  const [balance, setBalance] = useState<string>("0.00");
  const [balanceSymbol, setBalanceSymbol] = useState<string>("HBAR");

  /**
   * Universal Identity & Balance Resolver
   * Credits: Viqtorhvayx
   */
  const resolveWalletState = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      return;
    }

    const type: WalletType = connector?.name.toLowerCase().includes('hashpack') ? 'hashpack' : 'evm';
    setWalletType(type);
    const network = chainId === 295 ? 'mainnet' : 'testnet';
    const cleanAddress = rawAddress.toLowerCase();
    const truncatedEVM = `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}`;

    console.log(`[WalletContext] Resolving State: ${type} | ${rawAddress}`);

    try {
      // 1. Direct Identity Resolution
      if (rawAddress.startsWith('0.0.')) {
        setAccountId(rawAddress);
      } else {
        // Attempt Mirror Node Mapping for EVM
        const idRes = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`);
        if (idRes.ok) {
          const idData = await idRes.json();
          if (idData.account) {
            setAccountId(idData.account);
          } else {
            setAccountId(truncatedEVM);
          }
        } else {
          setAccountId(truncatedEVM);
        }
      }

      // 2. Universal Balance Resolution (Mirror Node is most reliable for both formats)
      const balRes = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`);
      if (balRes.ok) {
        const balData = await balRes.json();
        if (balData.balance && balData.balance.balance !== undefined) {
          // Hedera balance is in tinybars (10^8)
          const hbarBalance = (balData.balance.balance / 100000000).toFixed(2);
          setBalance(hbarBalance);
        }
      }
    } catch (error) {
      console.error("[WalletContext] Resolution error:", error);
      if (rawAddress.startsWith('0x')) setAccountId(truncatedEVM);
    }
  }, [isConnected, rawAddress, connector, chainId]);

  useEffect(() => {
    resolveWalletState();
  }, [resolveWalletState]);

  const connect = async () => {
    await open();
  };

  const disconnect = async () => {
    try {
      await wagmiDisconnect();
      // Explicit cleanup
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
    } catch (err) {
      console.error("[WalletContext] Disconnect failed:", err);
    }
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      address: rawAddress || null,
      accountId,
      walletType,
      balance,
      balanceSymbol,
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
