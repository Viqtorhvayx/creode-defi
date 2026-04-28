/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Hardened Identity Engine with deep trace logging and multi-network resolution.
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
     * Deep Identity Resolution Trace
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const resolveIdentity = async () => {
            console.log("CREODE TRACE - Connection Detected:", activeAddress);
            
            if (!activeAddress) {
                setNativeAddress(null);
                setIsResolving(false);
                return;
            }

            if (activeAddress.startsWith('0.0.')) {
                setNativeAddress(activeAddress);
                setIsResolving(false);
                return;
            }

            if (activeAddress.startsWith('0x')) {
                setIsResolving(true);
                const cleanAddress = activeAddress.toLowerCase();
                
                // We attempt Testnet and Mainnet Mirror Nodes to cover all bases
                const endpoints = [
                    `https://testnet.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`,
                    `https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`
                ];

                for (const url of endpoints) {
                    try {
                        console.log("CREODE TRACE - Fetching Identity from:", url);
                        const res = await fetch(url);
                        const data = await res.json();
                        console.log("CREODE TRACE - Mirror Node Response:", data);

                        if (data.account) {
                            setNativeAddress(data.account);
                            console.log("CREODE TRACE - RESOLVED SUCCESS:", data.account);
                            setIsResolving(false);
                            return;
                        }
                    } catch (e) {
                        console.warn("CREODE TRACE - Node query failed:", url);
                    }
                }
            }

            setNativeAddress(activeAddress);
            setIsResolving(false);
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
