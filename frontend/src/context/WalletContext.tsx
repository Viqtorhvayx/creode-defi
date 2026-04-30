"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Hardened Engine)
 * Description: Production-grade Identity and Balance Engine for CREODE.
 * Features: Concurrent resolution, request timeouts, and guaranteed state cleanup.
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
   * Hardened Fetch Helper
   */
  const fetchWithTimeout = async (url: string, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  /**
   * Universal Resolver
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

    try {
      // 1. Identity Resolution
      if (rawAddress.startsWith('0.0.')) {
        setAccountId(rawAddress);
      } else {
        const idRes = await fetchWithTimeout(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`);
        if (idRes.ok) {
          const idData = await idRes.json();
          setAccountId(idData.account || truncatedEVM);
        } else {
          setAccountId(truncatedEVM);
        }
      }

      // 2. Balance Resolution
      const balRes = await fetchWithTimeout(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`);
      if (balRes.ok) {
        const balData = await balRes.json();
        if (balData.balance?.balance !== undefined) {
          setBalance((balData.balance.balance / 100000000).toFixed(2));
        }
      }
    } catch (error) {
      console.error("[WalletContext] Resolver timed out or failed:", error);
      if (rawAddress.startsWith('0x')) setAccountId(truncatedEVM);
    }
  }, [isConnected, rawAddress, connector, chainId]);

  useEffect(() => {
    resolveWalletState();
  }, [resolveWalletState]);

  const connect = async () => {
    try {
      await open();
    } catch (err) {
      console.error("[WalletContext] Connection failed:", err);
    }
  };

  const disconnect = async () => {
    try {
      console.log("[WalletContext] Executing mandatory disconnect...");
      await wagmiDisconnect();
      
      // Force immediate state wipe
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      
      // Cleanup AppKit session if lingering
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WCM_RECENT_WALLET');
      
      console.log("[WalletContext] Disconnect complete.");
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
