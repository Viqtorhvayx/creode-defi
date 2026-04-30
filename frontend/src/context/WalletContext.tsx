"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Mirror Node Edition)
 * Description: Centralized wallet state using direct Hedera Testnet Mirror Node
 *              for guaranteed 0.0.x ID resolution without a backend dependency.
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
   * Direct Mirror Node Identity Resolution
   * Replaces the broken /api/wallet backend call with a guaranteed resolution path.
   * Credits: Viqtorhvayx
   */
  const resolveIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      return;
    }

    console.log(`[WalletContext] Address received: ${rawAddress}`);

    // If already native Hedera format
    if (rawAddress.startsWith('0.0.')) {
      setAccountId(rawAddress);
      setWalletType('hashpack');
      console.log(`[WalletContext] Native ID detected: ${rawAddress}`);
      return;
    }

    // EVM address - attempt Mirror Node resolution for Hedera
    if (rawAddress.startsWith('0x')) {
      try {
        const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${rawAddress.toLowerCase()}`;
        console.log(`[WalletContext] Querying Mirror Node: ${url}`);

        const res = await fetch(url);
        const data = await res.json();
        console.log(`[WalletContext] Mirror Node Response:`, data);

        if (data && data.account) {
          // Successfully resolved native Hedera ID
          setAccountId(data.account);
          setWalletType('hashpack');
          
          // Also fetch HBAR balance if available
          if (data.balance?.balance !== undefined) {
            const hbar = (data.balance.balance / 1e8).toFixed(4);
            setBalance(hbar);
          }
          console.log(`[WalletContext] Resolved to native ID: ${data.account}`);
        } else {
          // Standard EVM wallet (MetaMask on non-Hedera network)
          setAccountId(rawAddress);
          setWalletType('evm');
          console.log(`[WalletContext] EVM wallet, no Hedera account found.`);
        }
      } catch (error) {
        console.error("[WalletContext] Mirror Node fetch failed:", error);
        // Fallback: show raw address
        setAccountId(rawAddress);
        setWalletType('evm');
      }
    }
  }, [isConnected, rawAddress]);

  useEffect(() => {
    resolveIdentity();
  }, [resolveIdentity]);

  const connect = async () => {
    try {
      await open();
    } catch (err) {
      console.error("[WalletContext] Connection failed:", err);
    }
  };

  const disconnect = async () => {
    try {
      console.log("[WalletContext] Disconnecting...");
      await wagmiDisconnect();
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
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
