// Client helpers for the Creode Earn / Yield Hub (Phase 2: real zap swaps).
import { JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import vaultArtifact from '../contracts/CreodeYieldVaultV3.json';
import routerArtifact from '../contracts/CreodeTreasurySwap.json';
import strategyMap from '../contracts/yield_strategies.json';
import { getTestnetSigner } from './testnetSigner';

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

// Chain-safe signer (auto-switches to 296 and rebuilds the provider after).
const getSigner = (walletClient: any) => getTestnetSigner(walletClient);

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

/** Fold a position's accrued yield back into principal (real compound). */
export async function compound(walletClient: any, strategyId: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, signer);
  const tx = await vault.compoundMine(strategyId, { gasLimit: 1_900_000 });
  return (await tx.wait()).hash;
}

const HBAR_RESERVE = 15; // funded reserve to exclude from HBAR TVL

/** Protocol TVL inputs: the vault's real on-chain custody per token. */
export async function fetchVaultTokenBalances(): Promise<Record<string, number>> {
  const provider = new JsonRpcProvider(RPC_URL);
  const erc20abi = ['function balanceOf(address) view returns (uint256)'];
  const seen = new Set<string>();
  const out: Record<string, number> = {};
  // ERC20 strategy tokens
  const tokens: StrategyTokenMeta[] = [];
  for (const s of Object.values(STRATEGIES)) for (const t of [s.tokenA, s.tokenB]) {
    if (t.address.toLowerCase() !== ZERO && !seen.has(t.address.toLowerCase())) { seen.add(t.address.toLowerCase()); tokens.push(t); }
  }
  await Promise.all(tokens.map(async (t) => {
    try {
      const c = new Contract(t.address, erc20abi, provider);
      const bal: bigint = await c.balanceOf(YIELD_VAULT_ADDRESS);
      out[t.sym] = Number(formatUnits(bal, t.decimals));
    } catch { /* ignore */ }
  }));
  // Native HBAR custody (minus the funded reserve)
  try {
    const hbarBal = Number(formatUnits(await provider.getBalance(YIELD_VAULT_ADDRESS), 18));
    out['HBAR'] = Math.max(0, hbarBal - HBAR_RESERVE);
  } catch { /* ignore */ }
  return out;
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
