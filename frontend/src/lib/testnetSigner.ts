// Shared wallet-signer helper for Hedera Testnet (chain 296).
//
// Every write path must go through this instead of building its own
// BrowserProvider: ethers v6 pins the network a provider first detects, so if
// the wallet starts on another chain (e.g. Hedera mainnet, 295) and we then
// auto-switch it to 296, reusing the original provider throws
// NETWORK_ERROR "network changed: 295 => 296" on the very next call. After a
// switch the provider has to be rebuilt fresh against the updated wallet.
import { BrowserProvider, JsonRpcSigner } from 'ethers';

const WRONG_CHAIN = 'Please switch your wallet to Hedera Testnet (chain 296).';

export async function getTestnetSigner(walletClient: any): Promise<JsonRpcSigner> {
  let provider = new BrowserProvider(walletClient);
  let chainId = (await provider.getNetwork()).chainId;
  if (chainId !== 296n) {
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]);
    } catch {
      throw new Error(WRONG_CHAIN);
    }
    // Some wallets resolve the switch request slightly before the injected
    // client reports the new chain, so poll briefly with fresh providers.
    for (let i = 0; i < 10 && chainId !== 296n; i++) {
      await new Promise((r) => setTimeout(r, 250));
      provider = new BrowserProvider(walletClient);
      chainId = (await provider.getNetwork()).chainId;
    }
    if (chainId !== 296n) throw new Error(WRONG_CHAIN);
  }
  return provider.getSigner();
}
