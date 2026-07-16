/**
 * Atomic patcher for VaultTab.tsx
 * Applies 3 changes in one pass:
 * 1. Adds ethers + wagmi imports + token maps after existing imports
 * 2. Replaces fake handleDeposit with real on-chain contract call
 * 3. Fixes the early withdrawal warning text
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

// ─── CHANGE 1: Add new imports and token maps ─────────────────────────────────
const IMPORT_ANCHOR = "import { ChevronDown, X, Info } from 'lucide-react';";
const NEW_IMPORTS = `import { BrowserProvider, Contract, parseUnits } from 'ethers';
import { useWalletClient } from 'wagmi';
import vaultArtifact from '../context/abis.json';

// EVM token addresses on Hedera Testnet (address(0) = native HBAR)
const TOKEN_EVM_ADDRESSES: Record<string, string> = {
  HBAR:  '0x0000000000000000000000000000000000000000',
  USDC:  '0x0000000000000000000000000000000006F89AC',
  USDT:  '0x0000000000000000000000000000000006602D4',
  SAUCE: '0x00000000000000000000000000000000000B2FD5',
  PACK:  '0x0000000000000000000000000000000049356A8',
  JAM:   '0x000000000000000000000000000000000137D14',
  WETH:  '0x00000000000000000000000000000000000D235E',
  WBTC:  '0x00000000000000000000000000000000001008C6',
  BONZO: '0x0000000000000000000000000000000016450E2',
};
const TOKEN_DECIMALS: Record<string, number> = {
  HBAR: 8, USDC: 6, USDT: 6, SAUCE: 6, PACK: 6, JAM: 6, WETH: 8, WBTC: 8, BONZO: 6,
};
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];`;

if (!c.includes('BrowserProvider')) {
  c = c.replace(IMPORT_ANCHOR, IMPORT_ANCHOR + '\n' + NEW_IMPORTS);
  console.log('✓ Injected new imports and token maps');
} else {
  console.log('- Imports already present, skipping');
}

// ─── CHANGE 2: Destructure isConnected from useWallet ───────────────────────
const OLD_WALLET = "const { balance } = useWallet();";
const NEW_WALLET = "const { balance, isConnected } = useWallet();";
if (c.includes(OLD_WALLET)) {
  c = c.replace(OLD_WALLET, NEW_WALLET);
  console.log('✓ Destructured isConnected from useWallet');
} else {
  console.log('! useWallet destructuring already updated or not found');
}

// ─── CHANGE 3: Inject useWalletClient hook + real handleDeposit ──────────────
const OLD_HANDLE = `  const handleDeposit = () => {
    if (Number(depositAmount) <= 0) return;
    setIsProcessing(true);
    
    // Simulate API call / processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      
      // Keep success state for a moment, then update UI
      setTimeout(() => {
        setHasDeposited(true);
        setIsSuccess(false);
        setDepositAmount('');
        setShowNewVault(true);
      }, 1500); // Wait 1.5s to show success state before switching to "Deposited" layout
    }, 1200); // 1.2s processing time
  };`;

const NEW_HANDLE = `  const { data: walletClient } = useWalletClient();

  const handleDeposit = async () => {
    if (Number(depositAmount) <= 0) return;
    if (!isConnected || !walletClient) {
      alert('Please connect your wallet first.');
      return;
    }

    const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
    if (!vaultAddress) {
      alert('Vault contract address not configured.');
      return;
    }

    setIsProcessing(true);

    try {
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const vault = new Contract(vaultAddress, (vaultArtifact as any).CreodeVault, signer);

      const tokenEvm = TOKEN_EVM_ADDRESSES[activeToken] || TOKEN_EVM_ADDRESSES['HBAR'];
      const decimals = TOKEN_DECIMALS[activeToken] ?? 8;
      const amountParsed = parseUnits(depositAmount, decimals);
      const durationDays = displayLockDays;

      let tx;

      if (activeToken === 'HBAR') {
        // Native HBAR deposit — pass as msg.value
        tx = await vault.deposit(tokenEvm, 0, durationDays, { value: amountParsed });
      } else {
        // ERC-20 / HTS token — approve then deposit
        const tokenContract = new Contract(tokenEvm, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(vaultAddress, amountParsed);
        await approveTx.wait();
        tx = await vault.deposit(tokenEvm, amountParsed, durationDays);
      }

      // Wait for on-chain confirmation
      await tx.wait();

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setHasDeposited(true);
        setIsSuccess(false);
        setDepositAmount('');
        setShowNewVault(true);
      }, 1500);

    } catch (err: any) {
      setIsProcessing(false);
      console.error('[Vault] Deposit failed:', err);
      const reason = err?.reason || err?.message || 'Transaction failed.';
      alert('Deposit failed: ' + reason);
    }
  };`;

if (c.includes(OLD_HANDLE.trim().substring(0, 40))) {
  c = c.replace(OLD_HANDLE, NEW_HANDLE);
  console.log('✓ Replaced fake handleDeposit with real contract call');
} else {
  console.log('! handleDeposit anchor not found — check file manually');
}

// ─── CHANGE 4: Fix warning text ───────────────────────────────────────────────
const OLD_WARNING = 'Withdrawing before maturity incurs a 5% fee and forfeits pending yield.';
const NEW_WARNING = 'Early withdrawal incurs a time-decay penalty of up to 2% on principal. Accrued yield is still paid out in full.';
if (c.includes(OLD_WARNING)) {
  c = c.replace(OLD_WARNING, NEW_WARNING);
  console.log('✓ Fixed warning text');
} else {
  console.log('! Warning text not found — may already be fixed');
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('\nAll patches applied. Total lines:', c.split('\n').length);
