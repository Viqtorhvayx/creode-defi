const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'VaultTab.tsx');
let c = fs.readFileSync(filePath, 'utf-8');

const NEW_HANDLE = `
  const { data: walletClient } = useWalletClient();

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
        tx = await vault.deposit(tokenEvm, 0, durationDays, { value: amountParsed });
      } else {
        const tokenContract = new Contract(tokenEvm, ERC20_ABI, signer);
        const approveTx = await tokenContract.approve(vaultAddress, amountParsed);
        await approveTx.wait();
        tx = await vault.deposit(tokenEvm, amountParsed, durationDays);
      }

      await tx.wait();

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        setHasDeposited(true);
        setIsSuccess(false);
        setDepositAmount('');
        setShowNewVault(true);
      }, 1500);

    } catch (err) {
      setIsProcessing(false);
      const e = err as any;
      console.error('[Vault] Deposit failed:', e);
      alert('Deposit failed: ' + (e?.reason || e?.message || 'Unknown error'));
    }
  };
`;

// Find and replace the fake handleDeposit using a regex that handles CRLF
const fakeHandleRegex = /const handleDeposit = \(\) => \{[\s\S]*?1200\); \/\/ 1\.2s processing time\r?\n  \};/;
if (fakeHandleRegex.test(c)) {
  c = c.replace(fakeHandleRegex, NEW_HANDLE.trim());
  console.log('✓ Replaced fake handleDeposit');
} else {
  console.log('✗ Regex did not match — dumping snippet for debug:');
  const idx = c.indexOf('handleDeposit');
  console.log(JSON.stringify(c.substring(idx, idx + 300)));
}

fs.writeFileSync(filePath, c, 'utf-8');
console.log('Done. Lines:', c.split('\n').length);
