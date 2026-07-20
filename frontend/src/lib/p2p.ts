// Client helpers for the CreodeP2P order-book escrow (P2P tab).
import { BrowserProvider, JsonRpcProvider, Contract, parseUnits, formatUnits, parseEther } from 'ethers';
import p2pArtifact from '../contracts/CreodeP2P.json';
import cfg from '../contracts/p2p_config.json';

export const P2P_ADDRESS: string = (p2pArtifact as any).address;
export const P2P_ABI: any[] = (p2pArtifact as any).abi;
export const RPC_URL = process.env.NEXT_PUBLIC_HEDERA_JSON_RPC_URL || 'https://testnet.hashio.io/api';
export const ZERO = '0x0000000000000000000000000000000000000000';

interface TokenMeta { sym: string; address: string; decimals: number }
export const TOKENS: Record<string, TokenMeta> = (cfg as any).tokens;
// On-chain display decimals: HBAR is tinybar (8) not weibar (18).
const dec = (t: TokenMeta) => (t.address.toLowerCase() === ZERO ? 8 : t.decimals);
const isHbar = (a: string) => a.toLowerCase() === ZERO;

// Resolve a UI pair id ("HBAR-USDC") into its base/quote HTS token metadata.
// Long = buy base with quote; Short = sell base for quote.
export function pairTokens(pairId: string): { BASE: TokenMeta; QUOTE: TokenMeta } {
  const [b, q] = pairId.split('-');
  const BASE = TOKENS[b];
  const QUOTE = TOKENS[q];
  if (!BASE || !QUOTE) throw new Error(`Unknown pair ${pairId}`);
  return { BASE, QUOTE };
}

const ERC20_ABI = [
  'function approve(address,uint256) returns (bool)',
  'function allowance(address,address) view returns (uint256)',
];

async function getSigner(walletClient: any) {
  const provider = new BrowserProvider(walletClient);
  const net = await provider.getNetwork();
  if (net.chainId !== 296n) {
    try { await provider.send('wallet_switchEthereumChain', [{ chainId: '0x128' }]); }
    catch { throw new Error('Please switch your wallet to Hedera Testnet (chain 296).'); }
  }
  return provider.getSigner();
}

// Raw on-chain amount for a token (HBAR -> tinybar, ERC20 -> its decimals).
const toRaw = (t: TokenMeta, human: number) => parseUnits(human.toFixed(dec(t)), dec(t));

async function ensureAllowance(signer: any, token: TokenMeta, amount: bigint) {
  if (isHbar(token.address)) return;
  const erc20 = new Contract(token.address, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const cur: bigint = await erc20.allowance(owner, P2P_ADDRESS);
  if (cur < amount) await (await erc20.approve(P2P_ADDRESS, amount, { gasLimit: 1_000_000 })).wait();
}

/**
 * Post a limit order. `pay` is in the token you pay (Long -> quote/USDC,
 * Short -> base/HBAR); `price` is quote per base (USDC per HBAR).
 */
export async function createLimitOrder(walletClient: any, pairId: string, side: 'Long' | 'Short', pay: number, price: number): Promise<string> {
  const { BASE, QUOTE } = pairTokens(pairId);
  const signer = await getSigner(walletClient);
  const p2p = new Contract(P2P_ADDRESS, P2P_ABI, signer);
  // Long sells QUOTE to buy BASE; Short sells BASE to buy QUOTE. The escrowed
  // (sell) token may be native HBAR (msg.value) or an HTS/ERC20 (approve).
  const sellTok = side === 'Long' ? QUOTE : BASE;
  const buyTok = side === 'Long' ? BASE : QUOTE;
  const sellRaw = toRaw(sellTok, pay);
  const buyRaw = side === 'Long' ? toRaw(BASE, pay / price) : toRaw(QUOTE, pay * price);
  const opts: any = { gasLimit: 1_400_000 };
  if (isHbar(sellTok.address)) opts.value = parseEther(String(pay));
  else await ensureAllowance(signer, sellTok, sellRaw);
  const tx = await p2p.createLimitOrder(sellTok.address, sellRaw, buyTok.address, buyRaw, 0, opts);
  return (await tx.wait()).hash;
}

export interface OpenOrder {
  id: number;
  maker: string;
  sellToken: string; sellSym: string; sellRemaining: number;
  buyToken: string; buySym: string; buyRemaining: number;
  price: number; // quote per base
  side: 'Long' | 'Short' | 'Other'; // relative to BASE/QUOTE
}

const symOf = (addr: string) => Object.values(TOKENS).find((t) => t.address.toLowerCase() === addr.toLowerCase())?.sym || '?';

export async function fetchOpenOrders(pairId: string): Promise<OpenOrder[]> {
  const { BASE, QUOTE } = pairTokens(pairId);
  const provider = new JsonRpcProvider(RPC_URL);
  const p2p = new Contract(P2P_ADDRESS, P2P_ABI, provider);
  const [ids, list] = await p2p.getOpenOrders(0);
  const out: OpenOrder[] = [];
  for (let i = 0; i < ids.length; i++) {
    const o = list[i];
    const st = Object.values(TOKENS).find((t) => t.address.toLowerCase() === (o.sellToken as string).toLowerCase());
    const bt = Object.values(TOKENS).find((t) => t.address.toLowerCase() === (o.buyToken as string).toLowerCase());
    if (!st || !bt) continue;
    const sellRem = Number(formatUnits(o.sellRemaining, dec(st)));
    const buyRem = Number(formatUnits(o.buyRemaining, dec(bt)));
    // Only surface orders on the selected BASE/QUOTE pair.
    let side: OpenOrder['side'] = 'Other';
    let price = 0;
    if (st.sym === BASE.sym && bt.sym === QUOTE.sym) { side = 'Short'; price = buyRem / sellRem; }        // maker sells base for quote
    else if (st.sym === QUOTE.sym && bt.sym === BASE.sym) { side = 'Long'; price = sellRem / buyRem; }     // maker sells quote for base
    out.push({
      id: Number(ids[i]), maker: o.maker,
      sellToken: o.sellToken, sellSym: st.sym, sellRemaining: sellRem,
      buyToken: o.buyToken, buySym: bt.sym, buyRemaining: buyRem,
      price, side,
    });
  }
  return out;
}

export async function fetchUserOrderIds(user: string): Promise<number[]> {
  const provider = new JsonRpcProvider(RPC_URL);
  const p2p = new Contract(P2P_ADDRESS, P2P_ABI, provider);
  return (await p2p.getUserOrders(user)).map((x: bigint) => Number(x));
}

/** Market order: fill the best resting order for the chosen side, paying `pay`. */
export async function marketFill(walletClient: any, pairId: string, side: 'Long' | 'Short', pay: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const me = (await signer.getAddress()).toLowerCase();
  const orders = await fetchOpenOrders(pairId);
  // Long buys base -> needs a maker SELLING base (an on-book "Short"). Short sells base -> needs a maker BUYING base (on-book "Long").
  const want = side === 'Long' ? 'Short' : 'Long';
  const candidates = orders
    .filter((o) => o.side === want && o.maker.toLowerCase() !== me && o.buyRemaining > 0)
    .sort((a, b) => (side === 'Long' ? a.price - b.price : b.price - a.price)); // Long wants cheapest base, Short wants richest
  if (candidates.length === 0) throw new Error('No matching open orders to fill. Post a limit order or try later.');

  const best = candidates[0];
  return fillOrderById(walletClient, best, pay);
}

export async function fillOrderById(walletClient: any, order: OpenOrder, pay: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const p2p = new Contract(P2P_ADDRESS, P2P_ABI, signer);
  const payToken = Object.values(TOKENS).find((t) => t.address.toLowerCase() === order.buyToken.toLowerCase())!;
  const payHuman = Math.min(pay, order.buyRemaining);
  const raw = toRaw(payToken, payHuman);
  if (isHbar(order.buyToken)) {
    const tx = await p2p.fillOrder(order.id, raw, 0, { value: parseEther(String(payHuman)), gasLimit: 1_700_000 });
    return (await tx.wait()).hash;
  }
  await ensureAllowance(signer, payToken, raw);
  const tx = await p2p.fillOrder(order.id, raw, 0, { gasLimit: 1_700_000 });
  return (await tx.wait()).hash;
}

/** Wallet balance (human units) of a token by symbol — HBAR is native. */
export async function fetchBalance(user: string, sym: string): Promise<number> {
  const t = TOKENS[sym];
  if (!t) return 0;
  const provider = new JsonRpcProvider(RPC_URL);
  if (isHbar(t.address)) return Number(formatUnits(await provider.getBalance(user), 18));
  const erc20 = new Contract(t.address, ['function balanceOf(address) view returns (uint256)'], provider);
  return Number(formatUnits(await erc20.balanceOf(user), dec(t)));
}

export async function cancelOrder(walletClient: any, id: number): Promise<string> {
  const signer = await getSigner(walletClient);
  const p2p = new Contract(P2P_ADDRESS, P2P_ABI, signer);
  const tx = await p2p.cancelOrder(id, { gasLimit: 1_100_000 });
  return (await tx.wait()).hash;
}
