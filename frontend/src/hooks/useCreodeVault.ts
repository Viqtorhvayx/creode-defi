"use client";

/* * Developer: [Viqtorhvayx]
 * Hook: useCreodeVault
 * Description: Industrial-grade ethers.js interface for the native HBAR CreodeVault.
 *              Uses human-readable ABI to ensure precise routing to contract fragments.
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWalletClient } from 'wagmi';

/**
 * CONFIGURATION INSTRUCTIONS:
 * 1. Deploy CreodeVault.sol to Hedera Testnet.
 * 2. Copy the resulting EVM address (0x...).
 * 3. PASTE THE ADDRESS BELOW into VAULT_ADDRESS.
 */
const VAULT_ADDRESS = "0x00000000000000000000000000000000008439B9"; 

// Human-Readable ABI to prevent fragment mismatch errors
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
    if (!walletClient) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }
    
    // Safety check to ensure a valid address is configured
    if (!VAULT_ADDRESS || !VAULT_ADDRESS.startsWith('0x') || VAULT_ADDRESS.length !== 42) {
      throw new Error("Vault Contract Address is not configured correctly. Please use a 0x hex address.");
    }
    
    const { transport } = walletClient;
    const provider = new ethers.BrowserProvider(transport);
    const signer = await provider.getSigner();
    
    // Using the human-readable ABI defined above
    return new ethers.Contract(VAULT_ADDRESS, contractABI, signer);
  }, [walletClient]);

  /**
   * Deposits native HBAR into the vault with a specified lock-up period.
   * @param amountHBAR String representation of HBAR (e.g., "50")
   * @param durationDays Number of days to lock the deposit (e.g., 21)
   */
  const deposit = async (amountHBAR: string, durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const value = ethers.parseEther(amountHBAR);
      const days = BigInt(durationDays);
      
      console.log(`[Protocol] Initiating deposit of ${amountHBAR} HBAR for ${durationDays} days...`);
      // Calling the fragment explicitly matching the human-readable ABI
      const tx = await contract.depositHBAR(days, { value });
      const receipt = await tx.wait();
      
      console.log(`[Protocol] Deposit confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Deposit transaction failed";
      console.error(`[Protocol] Deposit Error:`, err);
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
      const contract = await getContract();
      const amount = ethers.parseEther(amountHBAR);
      
      console.log(`[Protocol] Initiating withdrawal of ${amountHBAR} HBAR...`);
      const tx = await contract.withdrawHBAR(amount);
      const receipt = await tx.wait();
      
      console.log(`[Protocol] Withdrawal confirmed in block ${receipt.blockNumber}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Withdrawal transaction failed";
      console.error(`[Protocol] Withdrawal Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Fetches protocol data for a specific user using human-readable fragments.
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
      console.error("[Protocol] Failed to fetch vault data:", err);
      return { balance: "0.0", unlockTime: 0 };
    }
  };

  return { 
    deposit, 
    withdraw, 
    getVaultData,
    isPending, 
    error 
  };
};
