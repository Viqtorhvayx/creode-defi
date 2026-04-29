/**
 * @title Web3Context (Rebuild 2.0)
 * @author Viqtorhvayx
 * @dev Hardened state management for multi-chain identity (0.0.x vs 0x...).
 */

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';

type WalletType = 'hashpack' | 'evm' | null;

interface Web3ContextType {
    address: string | null;
    accountId: string | null; // For Hedera (0.0.x)
    evmAddress: string | null; // For MetaMask (0x...)
    walletType: WalletType;
    isConnected: boolean;
    balance: string;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    lockAssets: (amount: string, unlockDate: number) => Promise<void>;
    provideLiquidity: (amount: string) => Promise<void>;
    borrow: (amount: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
    const { address: wagmiAddress, isConnected: isWagmiConnected, connector } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { open } = useAppKit();
    
    const [accountId, setAccountId] = useState<string | null>(null);
    const [evmAddress, setEvmAddress] = useState<string | null>(null);
    const [walletType, setWalletType] = useState<WalletType>(null);
    const [balance, setBalance] = useState("0");

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (activeAddress?.startsWith('0x') ? activeAddress : undefined) as `0x${string}` 
    });

    /**
     * Identity resolution engine.
     * Detects wallet type and resolves the correct address format.
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const resolveIdentity = async () => {
            if (!activeAddress) {
                setAccountId(null);
                setEvmAddress(null);
                setWalletType(null);
                return;
            }

            const isHashpack = connector?.name.toLowerCase().includes('hashpack') || activeAddress.startsWith('0.0.');
            setWalletType(isHashpack ? 'hashpack' : 'evm');

            if (isHashpack) {
                setEvmAddress(null); // Strictly suppress EVM for Hashpack users
                
                // 1. Path: Direct accountId extraction from session
                if (activeAddress.startsWith('0.0.')) {
                    setAccountId(activeAddress);
                    return;
                }

                // 2. Path: Direct provider scrape
                try {
                    const provider: any = await connector?.getProvider();
                    const namespaces = provider?.session?.namespaces;
                    if (namespaces?.hedera?.accounts) {
                        const id = namespaces.hedera.accounts[0].split(':').pop();
                        if (id) {
                            setAccountId(id);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Direct session extraction failed.");
                }

                // 3. Path: Mirror Node Fallback
                if (activeAddress.startsWith('0x')) {
                    try {
                        const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                        const data = await res.json();
                        if (data.account) {
                            setAccountId(data.account);
                            return;
                        }
                    } catch (e) {
                        console.error("Mirror Node resolution failed.");
                    }
                }
                setAccountId(activeAddress); // Final fallback
            } else {
                // Standard EVM Flow
                setAccountId(null);
                setEvmAddress(activeAddress);
            }
        };

        resolveIdentity();
    }, [activeAddress, connector]);

    useEffect(() => {
        if (balanceData) setBalance(balanceData.formatted);
    }, [balanceData]);

    const connect = async () => {
        await open();
    };

    const disconnect = async () => {
        await wagmiDisconnect();
        setAccountId(null);
        setEvmAddress(null);
        setWalletType(null);
    };

    const lockAssets = async (amount: string, unlockDate: number) => {
        console.log(`Locking ${amount} until ${unlockDate}`);
    };

    const provideLiquidity = async (amount: string) => {
        console.log(`Providing ${amount} liquidity`);
    };

    const borrow = async (amount: string) => {
        console.log(`Borrowing ${amount}`);
    };

    return (
        <Web3Context.Provider value={{
            address: activeAddress,
            accountId,
            evmAddress,
            walletType,
            isConnected,
            balance,
            connect,
            disconnect,
            lockAssets,
            provideLiquidity,
            borrow
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
