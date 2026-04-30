"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Backend-Synchronized Edition)
 * Description: Centralized identity and balance state management powered by a backend API.
 * Ensures that 0.0.x IDs and correct HBAR balances are always resolved.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
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

  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [balanceSymbol] = useState<string>("HBAR");

  /**
   * Sync Wallet State with Backend
   */
  const syncWithBackend = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      return;
    }

    try {
      console.log(`[WalletContext] Syncing ${rawAddress} with backend...`);
      const res = await fetch(`/api/wallet/${rawAddress}`);
      if (res.ok) {
        const data = await res.json();
        setAccountId(data.accountId);
        setBalance(data.balance);
        setWalletType(data.walletType);
      } else {
        // Fallback if API fails
        const truncated = `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}`;
        setAccountId(rawAddress.startsWith('0x') ? truncated : rawAddress);
      }
    } catch (error) {
      console.error("[WalletContext] Backend sync failed:", error);
    }
  }, [isConnected, rawAddress]);

  useEffect(() => {
    syncWithBackend();
  }, [syncWithBackend]);

  const connect = async () => {
    try {
      await open();
    } catch (err) {
      console.error("[WalletContext] Connection failed:", err);
    }
  };

  const disconnect = async () => {
    try {
      console.log("[WalletContext] Hard disconnect initiated...");
      await wagmiDisconnect();
      
      // Cleanup local state
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      
      // Clear persistent storage to prevent ghost sessions
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WCM_RECENT_WALLET');
      
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
