// Client helpers for the Creode Earn / Yield Hub (Phase 2: real zap swaps).
import { BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import vaultArtifact from '../contracts/CreodeYieldVaultV2.json';
import routerArtifact from '../contracts/CreodeSwapRouter.json';
import strategyMap from '../contracts/yield_strategies.json';

export const YIELD_VAULT_ADDRESS: string = (vaultArtifact as any).address;
export const YIELD_VAULT_ABI: any[] = (vaultArtifact as any).abi;
export const ROUTER_ADDRESS: string = (routerArtifact as any).address;
export const ROUTER_ABI: any[] = (routerArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';
export const ZERO = '0x0000000000000000000000000000000000000000';

export interface StrategyTokenMeta { sym: string; address: string; decimals: number }
export interface StrategyMeta { id: number; apyBps: number; single: boolean; tokenA: StrategyTokenMeta; tokenB: StrategyTokenMeta }

export const STRATEGIES: Record<string, StrategyMeta> = (strategyMap as any).strategies;

// Native HBAR: deposit value scaled by 18 (weibar) at the tx boundary, but
// on-chain amounts read back in tinybar (8 dp). ERC20 use their own decimals.
const displayDecimals = (address: string, mapped: number) => (address.toLowerCase() === ZERO ? 8 : mapped);

export const TOKENS_BY_ADDRESS: Record<string, { sym: string; decimals: number }> = (() => {
  const out: Record<string, { sym: string; decimals: number }> = {};
  for (const s of Object.values(STRATEGIES)) {
    for (const t of [s.tokenA, s.tokenB]) out[t.address.toLowerCase()] = { sym: t.sym, decimals: displayDecimals(t.address, t.decimals) };
  }
  out[ZERO.toLowerCase()] = { sym: 'HBAR', decimals: 8 };
  return out;
})();

const ERC20_ABI = [
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
];

async function ensureHederaTestnet(provider: BrowserProvider) {
  const net = await provider.getNetwork();
  if (net.chainId !== 296n) {
    try { await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]); }
    catch { throw new Error('Please switch your wallet to Hedera Testnet (chain 296).'); }
  }
}

async function getSigner(walletClient: any) {
  const provider = new BrowserProvider(walletClient);
  await ensureHederaTestnet(provider);
  return provider.getSigner();
}

/** Single-sided zap: supply `amount` of `token`; ~half is swapped on-chain. */
export async function zapIn(walletClient: any, strategyId: number, token: StrategyTokenMeta, amount: string): Promise<string> {
  const signer = await getSigner(walletClient);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, signer);
  const isHbar = token.address.toLowerCase() === ZERO;

  if (isHbar) {
    const value = parseUnits(amount, 18); // -> weibar
    const tx = await vault.zapIn(strategyId, ZERO, 0, 0, { value, gasLimit: 2_600_000 });
    return (await tx.wait()).hash;
  }

  const raw = parseUnits(amount, token.decimals);
  const erc20 = new Contract(token.address, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const current: bigint = await erc20.allowance(owner, YIELD_VAULT_ADDRESS);
  if (current < raw) {
    await (await erc20.approve(YIELD_VAULT_ADDRESS, raw, { gasLimit: 1_000_000 })).wait();
  }
  const tx = await vault.zapIn(strategyId, token.address, raw, 0, { gasLimit: 2_600_000 });
  return (await tx.wait()).hash;
}

export async function withdrawAll(walletClient: any, strategyId: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, signer);
  const tx = await vault.withdrawAll(strategyId, { gasLimit: 2_200_000 });
  return (await tx.wait()).hash;
}

/** Real router quote: how much `tokenOut` for `amountIn` of `tokenIn`. */
export async function quoteSwap(tokenIn: StrategyTokenMeta, tokenOut: StrategyTokenMeta, amountIn: string): Promise<number> {
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const router = new Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
    const rawIn = parseUnits(amountIn, tokenIn.address.toLowerCase() === ZERO ? 8 : tokenIn.decimals);
    if (rawIn <= 0n) return 0;
    const rawOut: bigint = await router.getAmountOut(tokenIn.address, tokenOut.address, rawIn);
    return Number(formatUnits(rawOut, displayDecimals(tokenOut.address, tokenOut.decimals)));
  } catch { return 0; }
}

export interface SideView { sym: string; amt: number; yield: number }
export interface UserPositionV2 {
  strategyId: number;
  name: string;
  apyPct: number;
  single: boolean;
  a: SideView;
  b: SideView;
}

export async function fetchUserPositions(user: string): Promise<UserPositionV2[]> {
  const provider = new JsonRpcProvider(RPC_URL);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, provider);
  const rows = await vault.getUserPositions(user);
  const out: UserPositionV2[] = [];
  for (const r of rows) {
    const aMeta = TOKENS_BY_ADDRESS[(r.tokenA as string).toLowerCase()] || { sym: '?', decimals: 18 };
    const bMeta = TOKENS_BY_ADDRESS[(r.tokenB as string).toLowerCase()] || { sym: '?', decimals: 18 };
    const single = (r.tokenA as string).toLowerCase() === (r.tokenB as string).toLowerCase();
    const a: SideView = { sym: aMeta.sym, amt: Number(formatUnits(r.amtA, aMeta.decimals)), yield: Number(formatUnits(r.yieldA, aMeta.decimals)) };
    const b: SideView = { sym: bMeta.sym, amt: Number(formatUnits(r.amtB, bMeta.decimals)), yield: Number(formatUnits(r.yieldB, bMeta.decimals)) };
    if (a.amt <= 0 && b.amt <= 0 && a.yield <= 0 && b.yield <= 0) continue;
    out.push({ strategyId: Number(r.strategyId), name: r.name, apyPct: Number(r.apyBps) / 100, single, a, b });
  }
  return out;
}
