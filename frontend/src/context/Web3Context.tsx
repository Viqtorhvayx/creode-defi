"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import abis from './abis.json';

interface Web3ContextType {
    address: string | null;
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

const VAULT_ADDRESS = "0x0000000000000000000000000000000000000000"; 

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { address, isConnected, isConnecting, connector } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { open } = useAppKit();
    const { data: balanceData } = useBalance({ address });

    const [balance, setBalance] = useState("0");
    const [walletType, setWalletType] = useState<string | null>(null);

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
            address: address || null,
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
