"use client";

/* * Developer: [Viqtorhvayx]
 * Component: WalletContext (Definitive Fix)
 * Description: Uses useAppKitAccount as the source of truth for isConnected.
 *              Wagmi's useAccount alone does NOT reliably reflect HashPack's
 *              EIP-6963 connection state — AppKit's own hook must be used.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

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
  /** Dismiss any open AppKit wallet sheet (e.g. after a tx is approved). */
  closeModal: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // useAppKitAccount is the source of truth for connection state.
  // It reflects AppKit's internal state immediately upon connection.
  const { address: appKitAddress, isConnected: appKitConnected } = useAppKitAccount();

  // useAccount provides Wagmi-level data as a secondary source.
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open, close } = useAppKit();

  // Combine both: if EITHER reports connected, we are connected.
  const isConnected = appKitConnected || wagmiConnected;
  const rawAddress = wagmiAddress || appKitAddress || null;

  const [accountId, setAccountId] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [balance, setBalance] = useState<string>("0.00");
  const [balanceSymbol] = useState<string>("HBAR");

  /**
   * Mirror Node Identity Resolution
   * Triggers whenever AppKit or Wagmi detects a new address.
   * Credits: Viqtorhvayx
   */
  const resolveIdentity = useCallback(async () => {
    if (!isConnected || !rawAddress) {
      setAccountId(null);
      setWalletType(null);
      setBalance("0.00");
      return;
    }

    console.log(`[WalletContext] isConnected: ${isConnected}, address: ${rawAddress}`);

    // Already native Hedera format
    if (rawAddress.startsWith('0.0.')) {
      setAccountId(rawAddress);
      setWalletType('hashpack');
      return;
    }

    // EVM address — query Hedera Testnet Mirror Node to find native ID
    if (rawAddress.startsWith('0x')) {
      try {
        const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${rawAddress.toLowerCase()}`;
        console.log(`[WalletContext] Mirror Node fetch: ${url}`);

        const res = await fetch(url);

        if (!res.ok) {
          // Not a Hedera account (e.g. MetaMask on Sepolia)
          console.warn(`[WalletContext] Not a Hedera account (HTTP ${res.status}). Treating as EVM.`);
          setAccountId(rawAddress);
          setWalletType('evm');
          return;
        }

        const data = await res.json();
        console.log(`[WalletContext] Mirror Node response:`, data);

        if (data?.account) {
          setAccountId(data.account);
          setWalletType('hashpack');
          if (data.balance?.balance !== undefined) {
            setBalance((data.balance.balance / 1e8).toFixed(4));
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

  // The AppKit sheet ("Approve in wallet…") can linger after the wallet has
  // already signed; tx flows call this once they settle so it never sticks.
  const closeModal = () => {
    try { close(); } catch { /* modal not open — nothing to do */ }
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
      address: rawAddress,
      accountId,
      walletType,
      balance,
      balanceSymbol,
      connect,
      disconnect,
      closeModal,
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
