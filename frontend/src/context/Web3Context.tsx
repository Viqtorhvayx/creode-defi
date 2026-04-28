/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev State management with forced Mirror Node fetch for native Hedera ID resolution.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import abis from './abis.json';

interface Web3ContextType {
    address: string | null;
    nativeHederaAddress: string | null;
    isConnected: boolean;
    walletType: string | null;
    balance: string;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnecting: boolean;
    // Contract methods
    lockAssets: (amount: string, unlockDate: number) => Promise<void>;
    provideLiquidity: (amount: string) => Promise<void>;
    borrow: (collateralAmount: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Hedera Testnet Vault Address Placeholder
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; 

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { address: appKitAddress, isConnected: isAppKitConnected } = useAppKitAccount();
    const { address: wagmiAddress, isConnected: isWagmiConnected, isConnecting, connector } = useAccount();
    
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { open } = useAppKit();
    
    const [nativeHederaAddress, setNativeHederaAddress] = useState<string | null>(null);
    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (wagmiAddress || (appKitAddress?.startsWith('0x') ? appKitAddress : undefined)) as `0x${string}` 
    });

    /**
     * Force fetch native 0.0.x ID from Mirror Node.
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const resolveHederaId = async () => {
            if (!activeAddress) {
                setNativeHederaAddress(null);
                return;
            }

            // If already in Hedera format, use it directly
            if (activeAddress.startsWith('0.0.')) {
                setNativeHederaAddress(activeAddress);
                return;
            }

            // Force Mirror Node fetch for EVM (0x) addresses
            if (activeAddress.startsWith('0x')) {
                try {
                    const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                    const data = await response.json();
                    if (data.account) {
                        setNativeHederaAddress(data.account);
                    }
                } catch (error) {
                    console.error("CREODE - Mirror Node resolution failed:", error);
                    setNativeHederaAddress(null);
                }
            }
        };

        resolveHederaId();
    }, [activeAddress]);

    useEffect(() => {
        if (balanceData) {
            setBalance(balanceData.formatted);
        }
    }, [balanceData]);

    useEffect(() => {
        if (connector) {
            setWalletType(connector.name.toLowerCase());
        } else {
            setWalletType(null);
        }
    }, [connector]);

    const connect = async () => {
        await open();
    };

    const disconnect = async () => {
        await wagmiDisconnect();
    };

    const getVaultContract = useCallback(async () => {
        if (isConnected && typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            return new ethers.Contract(VAULT_ADDRESS, abis.CreodeVault, signer);
        }
        return null;
    }, [isConnected]);

    const lockAssets = async (amount: string, unlockDate: number) => {
        const contract = await getVaultContract();
        if (!contract) throw new Error("Wallet not connected or unsupported");
        
        const tx = await contract.lockHbar(unlockDate, {
            value: ethers.parseEther(amount)
        });
        await tx.wait();
    };

    const provideLiquidity = async (amount: string) => {
        const contract = await getVaultContract();
        if (!contract) throw new Error("Wallet not connected or unsupported");

        const tx = await contract.provideLiquidityHbar({
            value: ethers.parseEther(amount)
        });
        await tx.wait();
    };

    const borrow = async (collateralAmount: string) => {
        const contract = await getVaultContract();
        if (!contract) throw new Error("Wallet not connected or unsupported");

        const tx = await contract.borrowHbar(ethers.parseUnits(collateralAmount, 6), "0x0000000000000000000000000000000000000000");
        await tx.wait();
    };

    return (
        <Web3Context.Provider value={{
            address: activeAddress,
            nativeHederaAddress,
            isConnected,
            walletType,
            balance,
            connect,
            disconnect,
            isConnecting,
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
    if (context === undefined) {
        throw new Error('useWeb3 must be used within a Web3Provider');
    }
    return context;
};
