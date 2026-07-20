// Client helpers for CreodeCompoundScheduler — protocol-level HIP-1215
// auto-compounding. Users enroll/unenroll a position (cheap, no scheduling);
// the treasury runs the on-chain self-perpetuating tick loop.
import { BrowserProvider, JsonRpcProvider, Contract } from 'ethers';
import schedArtifact from '../contracts/CreodeCompoundScheduler.json';

export const SCHEDULER_ADDRESS: string = (schedArtifact as any).address;
export const SCHEDULER_ABI: any[] = (schedArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';

async function getSigner(walletClient: any) {
  const provider = new BrowserProvider(walletClient);
  const net = await provider.getNetwork();
  if (net.chainId !== 296n) {
    try { await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]); }
    catch { throw new Error('Please switch your wallet to Hedera Testnet (chain 296).'); }
  }
  return provider.getSigner();
}

/** Is this user's position enrolled in auto-compounding? */
export async function isAutoEnrolled(address: string, strategyId: number): Promise<boolean> {
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const c = new Contract(SCHEDULER_ADDRESS, SCHEDULER_ABI, provider);
    return await c.isEnrolled(address, strategyId);
  } catch {
    return false;
  }
}

export async function enrollAuto(walletClient: any, strategyId: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const c = new Contract(SCHEDULER_ADDRESS, SCHEDULER_ABI, signer);
  const tx = await c.enroll(strategyId, { gasLimit: 300_000 });
  await tx.wait();
  return tx.hash;
}

export async function unenrollAuto(walletClient: any, strategyId: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const c = new Contract(SCHEDULER_ADDRESS, SCHEDULER_ABI, signer);
  const tx = await c.unenroll(strategyId, { gasLimit: 300_000 });
  await tx.wait();
  return tx.hash;
}
