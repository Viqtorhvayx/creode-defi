/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Hardened Identity Engine with error resilience and direct native ID prioritization.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface Web3ContextType {
    address: string | null;
    nativeAddress: string | null;
    isConnected: boolean;
    walletType: string | null;
    balance: string;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { open } = useAppKit();
    
    const [nativeAddress, setNativeAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (activeAddress?.startsWith('0x') ? activeAddress : undefined) as `0x${string}` 
    });

    /**
     * Hardened Identity Resolution
     * This handles the Mirror Node resolution even if WalletConnect returns 403 errors.
     */
    useEffect(() => {
        const resolveIdentity = async () => {
            if (!activeAddress) {
                setNativeAddress(null);
                return;
            }

            // Priority 1: Direct native ID check
            if (activeAddress.startsWith('0.0.')) {
                setNativeAddress(activeAddress);
                return;
            }

            // Priority 2: Force Mirror Node translation for EVM formats
            if (activeAddress.startsWith('0x')) {
                try {
                    // We attempt Testnet first as it is the most likely development target
                    const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                    const data = await res.json();
                    if (data.account) {
                        setNativeAddress(data.account);
                        return;
                    }
                } catch (e) {
                    console.error("CREODE - Identity resolution failed:", e);
                }
            }

            setNativeAddress(activeAddress);
        };

        resolveIdentity();
    }, [activeAddress]);

    useEffect(() => {
        if (balanceData) setBalance(balanceData.formatted);
    }, [balanceData]);

    useEffect(() => {
        if (connector) setWalletType(connector.name.toLowerCase());
        else setWalletType(null);
    }, [connector]);

    return (
        <Web3Context.Provider value={{
            address: activeAddress,
            nativeAddress,
            isConnected,
            walletType,
            balance,
            connect,
            disconnect
        }}>
            {children}
        </Web3Context.Provider>
    );
};

export const useWeb3 = () => {
    const context = useContext(Web3Context);
    if (context === undefined) throw new Error('useWeb3 must be used within a Web3Provider');
    return context;
};
