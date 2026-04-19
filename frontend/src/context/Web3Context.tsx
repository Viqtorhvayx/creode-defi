"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useMetaMask } from '../hooks/useMetaMask';
import { useHashpack } from '../hooks/useHashpack';
import abis from './abis.json';

interface Web3ContextType {
    address: string | null;
    isConnected: boolean;
    walletType: 'metamask' | 'hashpack' | null;
    balance: string;
    connectMetaMask: () => Promise<void>;
    connectHashpack: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnecting: boolean;
    // Contract methods
    lockAssets: (amount: string, unlockDate: number) => Promise<void>;
    provideLiquidity: (amount: string) => Promise<void>;
    borrow: (collateralAmount: string) => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Deployed Addresses (Placeholders - Update after deployment)
const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; 
const XP_ADDRESS = "0x0000000000000000000000000000000000000000";

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const metamask = useMetaMask();
    const hashpack = useHashpack();

    const [walletType, setWalletType] = useState<'metamask' | 'hashpack' | null>(null);
    const [balance, setBalance] = useState("0");

    const isConnected = !!(metamask.account || hashpack.accountId);
    const address = metamask.account || hashpack.accountId;
    const isConnecting = metamask.isConnecting || hashpack.isConnecting;

    useEffect(() => {
        if (metamask.account) {
            setWalletType('metamask');
            setBalance(metamask.balance);
        } else if (hashpack.accountId) {
            setWalletType('hashpack');
            setBalance("0"); // Hashpack balance fetching is separate
        } else {
            setWalletType(null);
            setBalance("0");
        }
    }, [metamask.account, metamask.balance, hashpack.accountId]);

    const connectMetaMask = async () => {
        await metamask.connect();
    };

    const connectHashpack = async () => {
        await hashpack.connect();
    };

    const disconnect = async () => {
        if (walletType === 'metamask') await metamask.disconnect();
        else if (walletType === 'hashpack') await hashpack.disconnect();
    };

    // Contract Interaction Logic (EVM focus for now, HashConnect requires separate signer logic)
    const getVaultContract = useCallback(async () => {
        if (walletType === 'metamask' && typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            return new ethers.Contract(VAULT_ADDRESS, abis.CreodeVault, signer);
        }
        return null;
    }, [walletType]);

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

        // Assuming HTS Token address for collateral (placeholder)
        const tx = await contract.borrowHbar(ethers.parseUnits(collateralAmount, 6), "0x0000000000000000000000000000000000000000");
        await tx.wait();
    };

    return (
        <Web3Context.Provider value={{
            address,
            isConnected,
            walletType,
            balance,
            connectMetaMask,
            connectHashpack,
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
