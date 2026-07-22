// Client helpers for CreodeCompoundScheduler — protocol-level HIP-1215
// auto-compounding. Users enroll/unenroll a position (cheap, no scheduling);
// the treasury runs the on-chain self-perpetuating tick loop.
import { JsonRpcProvider, Contract } from 'ethers';
import schedArtifact from '../contracts/CreodeCompoundScheduler.json';
import { getTestnetSigner } from './testnetSigner';

export const SCHEDULER_ADDRESS: string = (schedArtifact as any).address;
export const SCHEDULER_ABI: any[] = (schedArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';

// Chain-safe signer (auto-switches to 296 and rebuilds the provider after).
const getSigner = (walletClient: any) => getTestnetSigner(walletClient);

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
