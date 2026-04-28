/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Hardened state management with deep debug logging for native Hedera ID extraction.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import abis from './abis.json';

interface Web3ContextType {
    address: string | null;
    hederaId: string | null;
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
    
    const [hederaId, setHederaId] = useState<string | null>(null);
    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

    const isConnected = isAppKitConnected || isWagmiConnected;
    const activeAddress = wagmiAddress || appKitAddress || null;

    const { data: balanceData } = useBalance({ 
        address: (wagmiAddress || (appKitAddress?.startsWith('0x') ? appKitAddress : undefined)) as `0x${string}` 
    });

    /**
     * Converts an EVM address to a native Hedera Account ID via Mirror Node.
     * Credits: Viqtorhvayx
     */
    const fetchHederaId = useCallback(async (evmAddr: string) => {
        if (!evmAddr) return;
        
        // If already in Hedera format, set it immediately
        if (evmAddr.startsWith('0.0.')) {
            setHederaId(evmAddr);
            return;
        }

        if (!evmAddr.startsWith('0x')) return;

        try {
            console.log("CREODE - Fetching Hedera ID for EVM address:", evmAddr);
            const response = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${evmAddr}`);
            const data = await response.json();
            if (data.account) {
                console.log("CREODE - Mirror Node returned Account ID:", data.account);
                setHederaId(data.account);
            }
        } catch (error) {
            console.error("CREODE - Mirror Node fetch error:", error);
            setHederaId(null);
        }
    }, []);

    /**
     * Hardened Account Sync with Debug Logs
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const syncAccountId = async () => {
            console.log("CREODE DEBUG - Syncing Account ID...");
            console.log("CREODE DEBUG - Wagmi Address:", wagmiAddress);
            console.log("CREODE DEBUG - AppKit Address:", appKitAddress);

            if (!activeAddress) {
                setHederaId(null);
                return;
            }

            // Attempt direct extraction from HashPack Connector (Immediate Path)
            if (connector && connector.name.toLowerCase().includes('hashpack')) {
                try {
                    const provider: any = await connector.getProvider();
                    console.log("CREODE DEBUG - HashPack Provider Object:", provider);
                    
                    // Comprehensive scrape for account IDs in provider session
                    const nativeId = 
                        provider?.session?.accountIds?.[0] || 
                        provider?.hcData?.pairingData?.accountIds?.[0] ||
                        provider?.accountIds?.[0];

                    if (nativeId && nativeId.toString().startsWith('0.0.')) {
                        console.log("CREODE DEBUG - Found Native ID in provider:", nativeId);
                        setHederaId(nativeId.toString());
                        return;
                    }
                } catch (e) {
                    console.warn("CREODE - Direct ID extraction failed:", e);
                }
            }

            // Fallback to Mirror Node if no native ID found in provider
            fetchHederaId(activeAddress);
        };

        syncAccountId();
    }, [activeAddress, connector, fetchHederaId, wagmiAddress, appKitAddress]);

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
            hederaId,
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
