"use client";

/* * Developer: [Viqtorhvayx]
 * Hook: useCreodeVault
 * Description: Industrial-grade ethers.js interface for the CreodeVault native HBAR contract.
 *              Handles wallet approvals, transaction state, and error catching.
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';
import ABIS from '@/context/abis.json';

// IMPORTANT: The address below MUST be the deployed CreodeVault.sol contract address.
// Do NOT use the Treasury wallet address (0x2d553c56de9153dc98d853f8ec15850b5afd004c) here.
const VAULT_ADDRESS = "PASTE_DEPLOYED_SMART_CONTRACT_ADDRESS_HERE"; 

/**
 * Hook to interact with the CreodeVault smart contract.
 * Created by [Viqtorhvayx]
 */
export const useCreodeVault = () => {
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!walletClient) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }
    
    // Bridge Viem/Wagmi wallet client to Ethers.js v6
    // Note: transport is the EIP-1193 provider from the wallet
    const { transport } = walletClient;
    const provider = new ethers.BrowserProvider(transport);
    const signer = await provider.getSigner();
    
    return new ethers.Contract(VAULT_ADDRESS, ABIS.CreodeVault, signer);
  }, [walletClient]);

  /**
   * Deposits native HBAR into the vault.
   * @param amountHBAR String representation of HBAR (e.g., "10.5")
   */
  const deposit = async (amountHBAR: string) => {
    setIsPending(true);
    setError(null);
    try {
      if (!amountHBAR || isNaN(Number(amountHBAR))) {
        throw new Error("Invalid HBAR amount provided.");
      }
      
      const contract = await getContract();
      // Hedera EVM uses 18 decimals for native HBAR (10^18 units per HBAR)
      const value = ethers.parseEther(amountHBAR); 
      
      console.log(`[CreodeVault] Initiating deposit of ${amountHBAR} HBAR...`);
      const tx = await contract.depositHBAR({ value });
      
      console.log(`[CreodeVault] Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      const receipt = await tx.wait();
      
      console.log(`[CreodeVault] Deposit successful! Block: ${receipt.blockNumber}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Deposit transaction failed";
      console.error(`[CreodeVault] Deposit Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Withdraws native HBAR from the vault.
   * @param amountHBAR String representation of HBAR
   */
  const withdraw = async (amountHBAR: string) => {
    setIsPending(true);
    setError(null);
    try {
      if (!amountHBAR || isNaN(Number(amountHBAR))) {
        throw new Error("Invalid HBAR amount provided.");
      }
      
      const contract = await getContract();
      const amount = ethers.parseEther(amountHBAR);
      
      console.log(`[CreodeVault] Initiating withdrawal of ${amountHBAR} HBAR...`);
      const tx = await contract.withdrawHBAR(amount);
      
      console.log(`[CreodeVault] Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      const receipt = await tx.wait();
      
      console.log(`[CreodeVault] Withdrawal successful! Block: ${receipt.blockNumber}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Withdrawal transaction failed";
      console.error(`[CreodeVault] Withdrawal Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Fetches the user's current vault balance.
   */
  const getVaultBalance = async (address: string) => {
    try {
      const contract = await getContract();
      const balance = await contract.vaultBalances(address);
      return ethers.formatEther(balance);
    } catch (err) {
      console.error("[CreodeVault] Failed to fetch balance:", err);
      return "0.0";
    }
  };

  return { 
    deposit, 
    withdraw, 
    getVaultBalance,
    isPending, 
    error 
  };
};
