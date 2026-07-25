// Translates raw ethers/wallet errors into short, actionable messages for
// toast notifications. Ethers v6 surfaces internals ("could not coalesce error",
// "missing revert data (action=estimateGas ...)") that mean nothing to users
// and hide the actual fix, so every tx catch block should route through this.
export function friendlyTxError(err: any, fallback = 'Unknown error'): string {
  const raw = String(err?.reason || err?.shortMessage || err?.message || fallback);
  const code = err?.code;

  if (code === 'ACTION_REJECTED' || code === 4001 || /user (rejected|denied)/i.test(raw)) {
    return 'The transaction was rejected in the wallet.';
  }
  if (/could not coalesce error/i.test(raw)) {
    return 'The wallet returned an unexpected response. Reconnect your wallet, make sure it is on Hedera Testnet (chain 296) and try again.';
  }
  if (/network changed/i.test(raw)) {
    return 'The wallet switched networks mid-transaction. It is now on Hedera Testnet, so simply try again.';
  }
  if (/missing revert data|CALL_EXCEPTION/i.test(raw)) {
    return 'Transaction simulation failed. Hard-refresh the page (Ctrl/Cmd+Shift+R) so the app loads the latest contracts, confirm your wallet is on Hedera Testnet (chain 296) and try again.';
  }
  if (/insufficient funds|insufficient payer balance/i.test(raw)) {
    return 'Insufficient HBAR balance to cover the transaction and its network fee.';
  }
  if (/switch your wallet to hedera testnet/i.test(raw)) {
    return raw; // already a friendly instruction from getTestnetSigner
  }
  // Trim giant serialized payloads down to the first line.
  const line = raw.split('\n')[0];
  return line.length > 220 ? line.slice(0, 220) + '…' : line;
}
