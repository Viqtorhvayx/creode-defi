"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Final Edition)
 * Description: Centralized wallet state. Reads from the single Wagmi adapter.
 *              Resolves native 0.0.x ID via direct Hedera Testnet Mirror Node.
 *              No backend API dependency.
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
  const { address: rawAddress, isConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useAppKit();

  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [balanceSymbol] = useState<string>("HBAR");

  /**
   * Mirror Node Identity Resolution
   * Direct fetch — no backend API required.
   * Credits: Viqtorhvayx
   */
  const resolveIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      return;
    }

    console.log(`[WalletContext] Resolving address: ${rawAddress}`);

    // Already native Hedera format
    if (rawAddress.startsWith('0.0.')) {
      setAccountId(rawAddress);
      setWalletType('hashpack');
      return;
    }

    // EVM address — query Hedera Testnet Mirror Node
    if (rawAddress.startsWith('0x')) {
      try {
        const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${rawAddress.toLowerCase()}`;
        console.log(`[WalletContext] Mirror Node fetch: ${url}`);

        const res = await fetch(url);

        if (!res.ok) {
          // Not a Hedera account — treat as standard EVM wallet
          console.warn(`[WalletContext] Mirror Node returned ${res.status}. Treating as EVM wallet.`);
          setAccountId(rawAddress);
          setWalletType('evm');
          return;
        }

        const data = await res.json();
        console.log(`[WalletContext] Mirror Node response:`, data);

        if (data && data.account) {
          setAccountId(data.account);
          setWalletType('hashpack');
          if (data.balance?.balance !== undefined) {
            const hbar = (data.balance.balance / 1e8).toFixed(4);
            setBalance(hbar);
          }
          console.log(`[WalletContext] Resolved → ${data.account}`);
        } else {
          setAccountId(rawAddress);
          setWalletType('evm');
        }
      } catch (error) {
        console.error("[WalletContext] Mirror Node fetch failed:", error);
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
      console.error("[WalletContext] open() failed:", err);
    }
  };

  const disconnect = async () => {
    try {
      await wagmiDisconnect();
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      localStorage.removeItem('walletconnect');
      localStorage.removeItem('WCM_RECENT_WALLET');
      console.log("[WalletContext] Disconnected and state cleared.");
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
      disconnect,
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
