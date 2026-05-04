"use client";

/* * Developer: [Viqtorhvayx]
 * Hook: useCreodeVault
 * Description: Clean ethers.js interface for the zero-dependency Vault.
 *              Optimized for Hedera Testnet connectivity.
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';

/**
 * !!! ONE-CLICK DEPLOYER SYNC !!!
 * 1. Run 'node scripts/deploy.js' in your terminal.
 * 2. Copy the 'EVM Address' from the success log.
 * 3. PASTE THE ADDRESS BELOW.
 */
const VAULT_ADDRESS = "PASTE_DEPLOYED_EVM_ADDRESS_HERE"; 

// Human-Readable ABI for the Zero-Dependency Vault
const contractABI = [
  "function depositHBAR(uint256 _durationInDays) external payable",
  "function withdrawHBAR(uint256 _amount) external",
  "function getBalance(address _user) view returns (uint256)",
  "function getUnlockTime(address _user) view returns (uint256)"
];

export const useCreodeVault = () => {
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!walletClient) throw new Error("Wallet not connected.");
    
    if (!VAULT_ADDRESS || !VAULT_ADDRESS.startsWith('0x') || VAULT_ADDRESS.length !== 42) {
      throw new Error("Vault address not configured. Please run deploy.js and update useCreodeVault.ts.");
    }
    
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    return new ethers.Contract(VAULT_ADDRESS, contractABI, signer);
  }, [walletClient]);

  /**
   * Secure handleDeposit
   */
  const deposit = async (amountHBAR: string, durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const value = ethers.parseEther(amountHBAR);
      const days = BigInt(durationDays);
      
      console.log(`[Creode] Depositing ${amountHBAR} HBAR for ${durationDays} days...`);
      
      // Hedera Transaction Fee Optimization: Using a robust gas limit for success
      const tx = await contract.depositHBAR(days, { 
        value,
        gasLimit: 300000 
      });
      
      const receipt = await tx.wait();
      console.log(`[Creode] Success! Hash: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Transaction rejected.";
      console.error(`[Creode] Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Secure handleWithdraw
   */
  const withdraw = async (amountHBAR: string) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const amount = ethers.parseEther(amountHBAR);
      
      console.log(`[Creode] Withdrawing ${amountHBAR} HBAR...`);
      
      const tx = await contract.withdrawHBAR(amount, {
        gasLimit: 300000
      });
      
      const receipt = await tx.wait();
      console.log(`[Creode] Success! Hash: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Transaction rejected.";
      console.error(`[Creode] Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Data Sync Logic
   */
  const getVaultData = async (address: string) => {
    try {
      const contract = await getContract();
      const balance = await contract.getBalance(address);
      const unlockTime = await contract.getUnlockTime(address);
      return {
        balance: ethers.formatEther(balance),
        unlockTime: Number(unlockTime)
      };
    } catch (err) {
      console.error("[Creode] Data sync failed.", err);
      return { balance: "0.0", unlockTime: 0 };
    }
  };

  return { deposit, withdraw, getVaultData, isPending, error };
};
