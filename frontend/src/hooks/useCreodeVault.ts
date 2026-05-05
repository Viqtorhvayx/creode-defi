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
   * deposit: Sets maturity then funds the vault.
   * Includes a 0.1% protocol fee logic as requested.
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
      
      // 1. Set Maturity if principal is 0 (as per contract rules)
      if (vaultInfo.principal === 0n) {
        console.log(`[Creode] Setting maturity to ${durationDays} days...`);
        const setTx = await contract.setMaturity(BigInt(durationDays));
        await setTx.wait();
      }

      // 2. Deposit Funds
      const baseValue = ethers.parseEther(amountHBAR);
      // Add 0.1% fee on top in frontend for seamless UX (contract also deducts its fee)
      const protocolFee = (baseValue * 1n) / 1000n;
      const finalValue = baseValue + protocolFee;
      
      console.log(`[Creode] Depositing ${amountHBAR} HBAR...`);
      const tx = await contract.deposit({ 
        value: finalValue,
        gasLimit: 500000 
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

  return { deposit, withdraw, getVaultData, isPending, error };
};
