// Client + server helpers for CreodeGovernance (Community tab).
import { JsonRpcProvider, Contract, formatUnits } from 'ethers';
import { getTestnetSigner } from './testnetSigner';
import govArtifact from '../contracts/CreodeGovernance.json';
import codeArtifact from '../contracts/CodeToken.json';

export const GOV_ADDRESS: string = (govArtifact as any).address;
export const GOV_ABI: any[] = (govArtifact as any).abi;
export const CODE_ADDRESS: string = (codeArtifact as any).address;
export const CODE_ABI: any[] = (codeArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';

export interface Proposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  start: number;
  deadline: number;
  forVotes: number;   // in whole CODE
  againstVotes: number;
  finalized: boolean;
  passed: boolean;
  state: 'Active' | 'Passed' | 'Rejected';
}

const toCode = (v: bigint) => Number(formatUnits(v, 18));

function decodeProposal(p: any): Proposal {
  const finalized = Boolean(p.finalized);
  const passed = Boolean(p.passed);
  return {
    id: Number(p.id),
    proposer: String(p.proposer),
    title: String(p.title),
    description: String(p.description),
    start: Number(p.start),
    deadline: Number(p.deadline),
    forVotes: toCode(p.forVotes),
    againstVotes: toCode(p.againstVotes),
    finalized,
    passed,
    state: !finalized ? 'Active' : passed ? 'Passed' : 'Rejected',
  };
}

// ── Server-side reads (used by /api/governance) ──────────────────────────────
export async function readAll(): Promise<{ proposals: Proposal[]; quorumVotes: number; proposalThreshold: number; totalSupply: number }> {
  const provider = new JsonRpcProvider(RPC_URL);
  const gov = new Contract(GOV_ADDRESS, GOV_ABI, provider);
  const code = new Contract(CODE_ADDRESS, CODE_ABI, provider);
  const [raw, quorum, threshold, supply] = await Promise.all([
    gov.getProposals(0, 200),
    gov.quorumVotes(),
    gov.proposalThreshold(),
    code.totalSupply(),
  ]);
  const proposals = (raw as any[]).map(decodeProposal).sort((a, b) => b.id - a.id);
  return { proposals, quorumVotes: toCode(quorum), proposalThreshold: toCode(threshold), totalSupply: toCode(supply) };
}

export async function readVoter(address: string): Promise<{ power: number; claimed: boolean; voted: Record<number, boolean> }> {
  const provider = new JsonRpcProvider(RPC_URL);
  const gov = new Contract(GOV_ADDRESS, GOV_ABI, provider);
  const code = new Contract(CODE_ADDRESS, CODE_ABI, provider);
  const [power, claimed, count] = await Promise.all([code.balanceOf(address), code.claimed(address), gov.proposalCount()]);
  const n = Number(count);
  const voted: Record<number, boolean> = {};
  const checks = await Promise.all(Array.from({ length: n }, (_, i) => gov.hasVoted(i, address)));
  checks.forEach((v, i) => { voted[i] = Boolean(v); });
  return { power: toCode(power), claimed: Boolean(claimed), voted };
}

// ── Client fetch (browser → our API) ─────────────────────────────────────────
export async function fetchGovernance(): Promise<{ proposals: Proposal[]; quorumVotes: number; proposalThreshold: number; totalSupply: number }> {
  const r = await fetch('/api/governance', { cache: 'no-store' });
  return r.json();
}

export async function fetchVoter(address: string): Promise<{ power: number; claimed: boolean; voted: Record<number, boolean> }> {
  const r = await fetch(`/api/governance?address=${address}`, { cache: 'no-store' });
  return r.json();
}

// ── Client writes (through the user's wallet) ────────────────────────────────
// Chain-safe signer (auto-switches to 296 and rebuilds the provider after).
const getSigner = (walletClient: any) => getTestnetSigner(walletClient);

export async function claimCode(walletClient: any): Promise<string> {
  const signer = await getSigner(walletClient);
  const code = new Contract(CODE_ADDRESS, CODE_ABI, signer);
  const tx = await code.claim({ gasLimit: 200_000 });
  await tx.wait();
  return tx.hash;
}

export async function proposeGov(walletClient: any, title: string, description: string): Promise<string> {
  const signer = await getSigner(walletClient);
  const gov = new Contract(GOV_ADDRESS, GOV_ABI, signer);
  const tx = await gov.propose(title, description, { gasLimit: 900_000 });
  await tx.wait();
  return tx.hash;
}

export async function castVoteGov(walletClient: any, id: number, support: boolean): Promise<string> {
  const signer = await getSigner(walletClient);
  const gov = new Contract(GOV_ADDRESS, GOV_ABI, signer);
  const tx = await gov.castVote(id, support, { gasLimit: 300_000 });
  await tx.wait();
  return tx.hash;
}
