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

// Human-Readable ABI for the Zero-Dependency CreodeVault authored by Viqtorhvayx
const contractABI = [
  "function setMaturity(uint256 durationDays) external",
  "function deposit() external payable",
  "function withdraw() external",
  "function calculateEarnings(address user) public view returns (uint256)",
  "function vaults(address) view returns (uint256 principal, uint256 depositTimestamp, uint256 maturityTimestamp, bool isMaturitySet)",
  "event MaturitySet(address indexed user, uint256 maturityDate)",
  "event Deposited(address indexed user, uint256 amount, uint256 fee)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 yield, uint256 penalty)"
];

export const useCreodeVault = () => {
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getContract = useCallback(async () => {
    if (!walletClient) throw new Error("Wallet not connected.");
    
    if (!VAULT_ADDRESS || !VAULT_ADDRESS.startsWith('0x') || VAULT_ADDRESS.length !== 42) {
      throw new Error("Vault address not configured. Please run deploy.js and update Vercel.");
    }
    
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const signer = await provider.getSigner();
    return new ethers.Contract(VAULT_ADDRESS, contractABI, signer);
  }, [walletClient]);

  /**
   * setMaturity: Explicitly locks in the duration.
   */
  const setMaturity = async (durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      console.log(`[Creode] Setting maturity to ${durationDays} days...`);
      const tx = await contract.setMaturity(BigInt(durationDays));
      const receipt = await tx.wait();
      console.log(`[Creode] Maturity locked!`);
      return receipt;
    } catch (err: any) {
      const msg = err.reason || err.message || "Set Maturity failed.";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * deposit: Ensures maturity is set then funds the vault.
   */
  const deposit = async (amountHBAR: string, durationDays: string | number) => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      const userAddress = walletClient?.account?.address;
      if (!userAddress) throw new Error("No account address found.");

      // Check if maturity is already set for this user
      const vaultInfo = await contract.vaults(userAddress);
      
      // 1. Ensure Maturity is locked before simulating deposit
      // (HashPack often fails simulation if we auto-set and deposit in the same block)
      if (!vaultInfo.isMaturitySet) {
        throw new Error("PLEASE CLICK 'SET' TO LOCK YOUR DURATION BEFORE DEPOSITING.");
      }

      // 2. Deposit Funds
      const baseValue = ethers.parseEther(amountHBAR);
      // Contract handles the 0.1% fee internally; we send exactly what the user typed.
      const finalValue = baseValue; 
      
      console.log(`[Creode] Depositing ${amountHBAR} HBAR...`);
      const tx = await contract.deposit({ 
        value: finalValue,
        gasLimit: 800000 // Increased gas for safety
      });
      
      const receipt = await tx.wait();
      console.log(`[Creode] Deposit Success! Hash: ${receipt.hash}`);
      return receipt;
    } catch (err: any) {
      // Robust error parsing
      let msg = "Transaction failed.";
      if (err.reason) msg = err.reason;
      else if (err.data?.message) msg = err.data.message;
      else if (err.message) msg = err.message;
      
      console.error(`[Creode] Deposit Error:`, err);
      setError(msg.toUpperCase());
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  /**
   * withdraw: Pulls principal + yield.
   * Note: 5% penalty applies if before maturity.
   */
  const withdraw = async () => {
    setIsPending(true);
    setError(null);
    try {
      const contract = await getContract();
      console.log(`[Creode] Withdrawing all funds...`);
      
      const tx = await contract.withdraw({
        gasLimit: 500000
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
   * getVaultData: Fetches real-time status and yield.
   */
  const getVaultData = async (address: string) => {
    try {
      const contract = await getContract();
      const vaultInfo = await contract.vaults(address);
      const earnings = await contract.calculateEarnings(address);
      
      return {
        balance: ethers.formatEther(vaultInfo.principal),
        earnings: ethers.formatEther(earnings),
        unlockTime: Number(vaultInfo.maturityTimestamp),
        isSet: vaultInfo.isMaturitySet
      };
    } catch (err) {
      console.error("[Creode] Data sync failed.", err);
      return { balance: "0.0", earnings: "0.0", unlockTime: 0, isSet: false };
    }
  };

  return { deposit, withdraw, setMaturity, getVaultData, isPending, error };
};
