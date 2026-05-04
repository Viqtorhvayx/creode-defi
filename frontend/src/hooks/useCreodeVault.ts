"use client";

/* * Developer: [Viqtorhvayx]
 * Hook: useCreodeVault
 * Description: Clean ethers.js interface for the zero-dependency Vault.
 *              Optimized for Hedera Testnet connectivity with 0.1% success fee.
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
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || ""; 

// Human-Readable ABI for the Zero-Dependency Vault authored by Viqtorhvayx
const contractABI = [
  "function depositHBAR(uint256 _durationInDays) external payable",
  "function withdrawHBAR(uint256 _amount) external",
  "function getBalance(address _user) view returns (uint256)",
  "function getUnlockTime(address _user) view returns (uint256)",
  "event HBARDeposited(address indexed user, uint256 amount, uint256 unlockTime)",
  "event HBARWithdrawn(address indexed user, uint256 amount, bool isEarly)"
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
   * depositHBAR: Transfers funds to the time-locked vault.
   * Includes a mandatory 0.1% transaction fee logic for protocol success.
   */
  const deposit = async (amountHBAR: string, durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const baseValue = ethers.parseEther(amountHBAR);
      
      // CRITICAL: Set transaction fee at 0.1% for success as requested
      const protocolFee = (baseValue * 1n) / 1000n; // 0.1% calculation
      const finalValue = baseValue + protocolFee;
      
      const days = BigInt(durationDays);
      
      console.log(`[Creode] Depositing ${amountHBAR} HBAR (+0.1% fee) for ${durationDays} days...`);
      
      const tx = await contract.depositHBAR(days, { 
        value: finalValue,
        gasLimit: 400000 // Optimized gas limit for Hedera
      });
      
      const receipt = await tx.wait();
      console.log(`[Creode] Deposit Success! Hash: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Transaction failed.";
      console.error(`[Creode] Deposit Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * withdrawHBAR: Retrieves funds from the vault.
   * Note: 5% penalty applies if withdrawn before maturity.
   */
  const withdraw = async (amountHBAR: string) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const amount = ethers.parseEther(amountHBAR);
      
      console.log(`[Creode] Withdrawing ${amountHBAR} HBAR...`);
      
      const tx = await contract.withdrawHBAR(amount, {
        gasLimit: 400000 // Optimized gas limit for Hedera
      });
      
      const receipt = await tx.wait();
      console.log(`[Creode] Withdrawal Success! Hash: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Transaction failed.";
      console.error(`[Creode] Withdrawal Error:`, err);
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * getVaultData: Fetches real-time balance and lock status.
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
