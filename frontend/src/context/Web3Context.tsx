"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useHashpack } from '../hooks/useHashpack';

interface Web3ContextType {
    address: string | null;
    isConnected: boolean;
    walletType: 'MetaMask' | 'HashPack' | null;
    balance: string;
    connectMetaMask: () => Promise<void>;
    connectHashpack: () => Promise<void>;
    disconnect: () => void;
    network: string | null;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

/**
 * @title Web3Provider
 * @author Viqtorhvayx
 * @dev Unified Context Provider for managing multiple Hedera wallets.
 */
export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const metaMask = useMetaMask();
    const hashpack = useHashpack();

    const [address, setAddress] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<'MetaMask' | 'HashPack' | null>(null);
    const [balance, setBalance] = useState<string>("0");

    // Sync state based on active connection
    useEffect(() => {
        if (metaMask.account) {
            setAddress(metaMask.account);
            setWalletType('MetaMask');
            setBalance(metaMask.balance);
        } else if (hashpack.accountId) {
            setAddress(hashpack.accountId);
            setWalletType('HashPack');
            // Balance fetching for HashPack would go here (via Mirror Node or HC)
            setBalance("0"); 
        } else {
            setAddress(null);
            setWalletType(null);
            setBalance("0");
        }
    }, [metaMask.account, metaMask.balance, hashpack.accountId]);

    const disconnect = () => {
        if (walletType === 'MetaMask') metaMask.disconnect();
        if (walletType === 'HashPack') hashpack.disconnect();
    };

    const value = {
        address,
        isConnected: !!address,
        walletType,
        balance,
        connectMetaMask: metaMask.connect,
        connectHashpack: hashpack.connect,
        disconnect,
        network: metaMask.account ? "Hedera Testnet (EVM)" : (hashpack.accountId ? "Hedera Testnet" : null)
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
