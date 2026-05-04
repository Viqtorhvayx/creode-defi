"use client";

/* * Developer: [Viqtorhvayx]
 * Hook: useCreodeVault
 * Description: Zero-error ethers.js interface for the flawless HBAR CreodeVault.
 *              Implements strict human-readable ABI for perfect fragment matching.
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';

/**
 * !!! CRITICAL CONFIGURATION !!!
 * 1. Deploy CreodeVault.sol via Remix IDE.
 * 2. Paste the resulting Smart Contract Address (0x...) below.
 * 3. IMPORTANT: Do NOT use your Treasury wallet address here.
 */
const VAULT_ADDRESS = "PASTE_DEPLOYED_CONTRACT_ADDRESS_HERE"; 

// Precise human-readable ABI to eliminate "no matching fragment" errors
const contractABI = [
  "function depositHBAR(uint256 _durationInDays) external payable",
  "function withdrawHBAR(uint256 _amount) external",
  "function vaultBalances(address) view returns (uint256)",
  "function unlockTimes(address) view returns (uint256)"
];

export const useCreodeVault = () => {
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!walletClient) throw new Error("Wallet not connected.");
    
    // Proactive check for the deployment address
    if (!VAULT_ADDRESS || !VAULT_ADDRESS.startsWith('0x')) {
      throw new Error("Vault Contract Address is not configured. Please paste your deployed 0x address in useCreodeVault.ts.");
    }
    
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    return new ethers.Contract(VAULT_ADDRESS, contractABI, signer);
  }, [walletClient]);

  /**
   * handleDeposit Logic
   */
  const deposit = async (amountHBAR: string, durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const value = ethers.parseEther(amountHBAR);
      const days = BigInt(durationDays);
      
      console.log(`[Protocol] Initiating deposit of ${amountHBAR} HBAR for ${durationDays} days...`);
      const tx = await contract.depositHBAR(days, { value });
      const receipt = await tx.wait();
      
      console.log(`[Protocol] Deposit Confirmed: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Deposit rejected.";
      console.error(`[Protocol] Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * handleWithdraw Logic
   */
  const withdraw = async (amountHBAR: string) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const amount = ethers.parseEther(amountHBAR);
      
      console.log(`[Protocol] Initiating withdrawal of ${amountHBAR} HBAR...`);
      const tx = await contract.withdrawHBAR(amount);
      const receipt = await tx.wait();
      
      console.log(`[Protocol] Withdrawal Confirmed: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Withdrawal rejected.";
      console.error(`[Protocol] Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * getVaultData Logic
   */
  const getVaultData = async (address: string) => {
    try {
      const contract = await getContract();
      const balance = await contract.vaultBalances(address);
      const unlockTime = await contract.unlockTimes(address);
      return {
        balance: ethers.formatEther(balance),
        unlockTime: Number(unlockTime)
      };
    } catch (err) {
      console.error("[Protocol] Balance sync failed.", err);
      return { balance: "0.0", unlockTime: 0 };
    }
  };

  return { deposit, withdraw, getVaultData, isPending, error };
};
