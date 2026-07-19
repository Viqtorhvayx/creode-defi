// Client helpers for the CreodeYieldVault (Earn / Yield Hub, Phase 1).
import { BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits } from 'ethers';
import vaultArtifact from '../contracts/CreodeYieldVault.json';
import strategyMap from '../contracts/yield_strategies.json';

export const YIELD_VAULT_ADDRESS: string = (vaultArtifact as any).address;
export const YIELD_VAULT_ABI: any[] = (vaultArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';
export const ZERO = '0x0000000000000000000000000000000000000000';

export interface StrategyTokenMeta { sym: string; address: string; decimals: number }
export interface StrategyMeta { id: number; apyBps: number; tokens: StrategyTokenMeta[] }

export const STRATEGIES: Record<string, StrategyMeta> = (strategyMap as any).strategies;

// Native HBAR: deposit value is scaled by 18 (weibar) at the tx boundary, but
// on-chain principal/yield read back in tinybar (8 dp). ERC20 use their own dp.
const DEPOSIT_DECIMALS = (t: StrategyTokenMeta) => t.decimals; // map already uses 18 for HBAR
const DISPLAY_DECIMALS = (address: string, mapped: number) => (address === ZERO ? 8 : mapped);

// address -> { sym, decimals } for decoding positions
export const TOKENS_BY_ADDRESS: Record<string, { sym: string; decimals: number }> = (() => {
  const out: Record<string, { sym: string; decimals: number }> = {};
  for (const s of Object.values(STRATEGIES)) {
    for (const t of s.tokens) out[t.address.toLowerCase()] = { sym: t.sym, decimals: t.decimals };
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
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]);
    } catch {
      throw new Error('Please switch your wallet to Hedera Testnet (chain 296).');
    }
  }
}

async function getSigner(walletClient: any) {
  const provider = new BrowserProvider(walletClient);
  await ensureHederaTestnet(provider);
  return provider.getSigner();
}

/** Deposit (zap in) `amount` of `token` into a strategy. */
export async function depositToStrategy(
  walletClient: any,
  strategyId: number,
  token: StrategyTokenMeta,
  amount: string,
): Promise<string> {
  const signer = await getSigner(walletClient);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, signer);
  const isHbar = token.address === ZERO;

  if (isHbar) {
    const value = parseUnits(amount, DEPOSIT_DECIMALS(token)); // 18 -> weibar
    const tx = await vault.deposit(strategyId, ZERO, 0, { value, gasLimit: 1_200_000 });
    return (await tx.wait()).hash;
  }

  const raw = parseUnits(amount, token.decimals);
  const erc20 = new Contract(token.address, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const current: bigint = await erc20.allowance(owner, YIELD_VAULT_ADDRESS);
  if (current < raw) {
    await (await erc20.approve(YIELD_VAULT_ADDRESS, raw, { gasLimit: 1_000_000 })).wait();
  }
  const tx = await vault.deposit(strategyId, token.address, raw, { gasLimit: 1_200_000 });
  return (await tx.wait()).hash;
}

/** Withdraw the full principal + accrued yield of a position. */
export async function withdrawAll(walletClient: any, strategyId: number, tokenAddress: string): Promise<string> {
  const signer = await getSigner(walletClient);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, signer);
  const tx = await vault.withdrawAll(strategyId, tokenAddress, { gasLimit: 1_500_000 });
  return (await tx.wait()).hash;
}

export interface UserPosition {
  strategyId: number;
  name: string;
  tokenAddress: string;
  sym: string;
  decimals: number;
  apyPct: number;
  principal: number;
  pendingYield: number;
  active: boolean;
}

/** Read a user's on-chain positions (returns only non-dust principal rows). */
export async function fetchUserPositions(user: string): Promise<UserPosition[]> {
  const provider = new JsonRpcProvider(RPC_URL);
  const vault = new Contract(YIELD_VAULT_ADDRESS, YIELD_VAULT_ABI, provider);
  const rows = await vault.getUserPositions(user);
  const out: UserPosition[] = [];
  for (const r of rows) {
    const addr = (r.token as string).toLowerCase();
    const meta = TOKENS_BY_ADDRESS[addr] || { sym: '?', decimals: 18 };
    const dp = DISPLAY_DECIMALS(r.token, meta.decimals);
    const principal = Number(formatUnits(r.principal, dp));
    const pendingYield = Number(formatUnits(r.pendingYield, dp));
    if (principal <= 0 && pendingYield <= 0) continue;
    out.push({
      strategyId: Number(r.strategyId),
      name: r.name,
      tokenAddress: r.token,
      sym: meta.sym,
      decimals: dp,
      apyPct: Number(r.apyBps) / 100,
      principal,
      pendingYield,
      active: r.active,
    });
  }
  return out;
}
