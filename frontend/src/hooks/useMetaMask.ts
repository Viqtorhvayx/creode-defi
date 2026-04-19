"use client";

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

/**
 * @title useMetaMask
 * @author Viqtorhvayx
 * @dev Hook for managing MetaMask connection on Hedera EVM.
 */
export const useMetaMask = () => {
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<string | null>(null);
    const [balance, setBalance] = useState<string>("0");
    const [isConnecting, setIsConnecting] = useState(false);

    const HEDERA_TESTNET_CHAIN_ID = "0x128"; // 296 in hex

    const updateBalance = useCallback(async (address: string) => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const bal = await provider.getBalance(address);
            setBalance(ethers.formatEther(bal));
        }
    }, []);

    const connect = async () => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            try {
                setIsConnecting(true);
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                
                // Request accounts
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                setAccount(accounts[0]);

                // Check Chain ID
                const network = await provider.getNetwork();
                setChainId(network.chainId.toString());

                // Attempt to switch to Hedera Testnet if not on it
                if (network.chainId !== BigInt(296)) {
                    try {
                        await (window as any).ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: HEDERA_TESTNET_CHAIN_ID }],
                        });
                    } catch (switchError: any) {
                        // If chain not added, add it
                        if (switchError.code === 4902) {
                            await (window as any).ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: HEDERA_TESTNET_CHAIN_ID,
                                    chainName: 'Hedera Testnet',
                                    nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
                                    rpcUrls: ['https://testnet.hashio.io/api'],
                                    blockExplorerUrls: ['https://hashscan.io/testnet/dashboard']
                                }],
                            });
                        }
                    }
                }

                await updateBalance(accounts[0]);
            } catch (error) {
                console.error("MetaMask connection error:", error);
            } finally {
                setIsConnecting(false);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    const disconnect = () => {
        setAccount(null);
        setBalance("0");
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    updateBalance(accounts[0]);
                } else {
                    setAccount(null);
                }
            });

            (window as any).ethereum.on('chainChanged', (hexChainId: string) => {
                setChainId(parseInt(hexChainId, 16).toString());
            });
        }
    }, [updateBalance]);

    return { account, chainId, balance, connect, disconnect, isConnecting };
};
