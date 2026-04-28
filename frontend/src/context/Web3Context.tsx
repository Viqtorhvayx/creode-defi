/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Centralized Identity Engine for native Hedera ID resolution.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import abis from './abis.json';

interface Web3ContextType {
    address: string | null;
    nativeAddress: string | null;
    isConnected: boolean;
    walletType: string | null;
    balance: string;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
    const { address: wagmiAddress, isConnected: isWagmiConnected, isConnecting, connector } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { open } = useAppKit();
    
    const [nativeAddress, setNativeAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (wagmiAddress || (appKitAddress?.startsWith('0x') ? appKitAddress : undefined)) as `0x${string}` 
    });

    /**
     * Centralized Identity Resolution
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const resolveIdentity = async () => {
            if (!activeAddress) {
                setNativeAddress(null);
                return;
            }

            // 1. Direct Scrape for native ID (0.0.x)
            if (activeAddress.startsWith('0.0.')) {
                setNativeAddress(activeAddress);
                return;
            }

            // 2. Connector-Specific Extraction (HashPack Path)
            if (connector && connector.name.toLowerCase().includes('hashpack')) {
                try {
                    const provider: any = await connector.getProvider();
                    const namespaces = provider?.session?.namespaces;
                    if (namespaces?.hedera?.accounts) {
                        const accountId = namespaces.hedera.accounts[0].split(':').pop();
                        if (accountId && accountId.startsWith('0.0.')) {
                            setNativeAddress(accountId);
                            console.log("CREODE IDENTITY RESOLVED (Session):", accountId);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Direct extraction failed, using fallback.");
                }
            }

            // 3. Mirror Node Translation (EVM Path)
            if (activeAddress.startsWith('0x')) {
                try {
                    const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                    const data = await res.json();
                    if (data.account) {
                        setNativeAddress(data.account);
                        console.log("CREODE IDENTITY RESOLVED (Mirror Node):", data.account);
                        return;
                    }
                } catch (e) {
                    console.error("Mirror Node fetch failed:", e);
                }
            }

            setNativeAddress(activeAddress); // Final fallback
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
            isConnected,
            walletType,
            balance,
            connect,
            disconnect,
            isConnecting
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
