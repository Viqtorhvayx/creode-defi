/**
 * @title Web3Context
 * @author Viqtorhvayx
 * @dev Hardened state management for deep HashPack Account ID extraction and session logging.
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
     * Deep Extraction and Diagnostic Logging.
     * Credits: Viqtorhvayx
     */
    useEffect(() => {
        const extractNativeId = async () => {
            if (!activeAddress) {
                setHederaId(null);
                return;
            }

            if (connector && connector.name.toLowerCase().includes('hashpack')) {
                try {
                    const provider: any = await connector.getProvider();
                    console.log("CREODE WALLET RESPONSE (FULL PROVIDER):", provider);
                    
                    // 1. Check WalletConnect v2 Namespaces (Official Path)
                    const namespaces = provider?.session?.namespaces;
                    if (namespaces?.hedera?.accounts) {
                        const accountWithChain = namespaces.hedera.accounts[0]; // Format: hedera:296:0.0.xxxx
                        const nativeId = accountWithChain.split(':').pop();
                        if (nativeId) {
                            console.log("CREODE - Extracted ID from Namespaces:", nativeId);
                            setHederaId(nativeId);
                            return;
                        }
                    }

                    // 2. Check Custom Provider Props (HashPack specific)
                    const customId = 
                        provider?.session?.accountIds?.[0] || 
                        provider?.accountIds?.[0] ||
                        provider?.hcData?.pairingData?.accountIds?.[0];

                    if (customId && customId.toString().startsWith('0.0.')) {
                        console.log("CREODE - Extracted ID from Custom Props:", customId);
                        setHederaId(customId.toString());
                        return;
                    }
                } catch (e) {
                    console.warn("CREODE - Deep extraction failed:", e);
                }
            }

            // 3. Fallback to Mirror Node if direct extraction fails
            if (activeAddress.startsWith('0x')) {
                try {
                    const res = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${activeAddress}`);
                    const data = await res.json();
                    if (data.account) setHederaId(data.account);
                } catch (e) {
                    setHederaId(null);
                }
            } else if (activeAddress.startsWith('0.0.')) {
                setHederaId(activeAddress);
            }
        };

        extractNativeId();
    }, [activeAddress, connector]);

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
