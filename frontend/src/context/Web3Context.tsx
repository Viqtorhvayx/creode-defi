/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Centralized Identity Engine with direct session scraping for native Hedera IDs.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

interface Web3ContextType {
    address: string | null;
    nativeAddress: string | null;
    isResolving: boolean;
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
    const [isResolving, setIsResolving] = useState(false);
    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (activeAddress?.startsWith('0x') ? activeAddress : undefined) as `0x${string}` 
    });

    /**
     * Centralized Identity Engine
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const resolveIdentity = async () => {
            if (!activeAddress) {
                setNativeAddress(null);
                setIsResolving(false);
                return;
            }

            // Path 1: Direct native ID check
            if (activeAddress.startsWith('0.0.')) {
                setNativeAddress(activeAddress);
                return;
            }

            // Path 2: Direct Provider Scraping (The Fast Path)
            if (connector && connector.name.toLowerCase().includes('hashpack')) {
                try {
                    const provider: any = await connector.getProvider();
                    // HashPack often stores the accountId directly in the session namespaces
                    const namespaces = provider?.session?.namespaces;
                    if (namespaces?.hedera?.accounts) {
                        const accountWithChain = namespaces.hedera.accounts[0];
                        const extractedId = accountWithChain.split(':').pop();
                        if (extractedId && extractedId.startsWith('0.0.')) {
                            setNativeAddress(extractedId);
                            console.log("CREODE - Identity resolved from session:", extractedId);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("CREODE - Direct session scraping failed.");
                }
            }

            // Path 3: Mirror Node Fallback (The Accurate Path)
            if (activeAddress.startsWith('0x')) {
                setIsResolving(true);
                try {
                    const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                    const data = await res.json();
                    if (data.account) {
                        setNativeAddress(data.account);
                        return;
                    }
                } catch (e) {
                    console.error("CREODE - Mirror Node resolution failed.");
                } finally {
                    setIsResolving(false);
                }
            }

            setNativeAddress(activeAddress);
        };

        resolveIdentity();
    }, [activeAddress, connector]);

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
            isResolving,
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
