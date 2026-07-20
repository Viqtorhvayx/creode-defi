import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeP2P.sol/CreodeP2P.json");
const cfg = require("../frontend/src/contracts/p2p_config.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const USDC = cfg.tokens.USDC;
const tinybar = (whole) => BigInt(Math.round(whole * 1e8));
const usdc = (v) => ethers.parseUnits(v.toFixed(6), 6);
const ERC20 = ["function approve(address,uint256) returns (bool)"];

async function main() {
  const p2p = new ethers.Contract(cfg.address, art.abi, w);
  const usdcC = new ethers.Contract(USDC.address, ERC20, w);

  // Approve enough USDC for the bid side up front.
  await (await usdcC.approve(cfg.address, usdc(1000), { gasLimit: 1_000_000 })).wait();

  const asks = [0.0665, 0.0672, 0.0680]; // sell HBAR for USDC (above mark)
  const bids = [0.0648, 0.0641, 0.0633]; // sell USDC to buy HBAR (below mark)
  const baseSize = 50; // 50 HBAR per level

  for (const price of asks) {
    const sell = tinybar(baseSize);            // HBAR in tinybar
    const buy = usdc(baseSize * price);        // USDC wanted
    const tx = await p2p.createLimitOrder(HBAR, sell, USDC.address, buy, 0, { value: ethers.parseEther(String(baseSize)), gasLimit: 1_400_000 });
    await tx.wait();
    console.log(`ASK  ${baseSize} HBAR @ ${price} USDC`);
  }
  for (const price of bids) {
    const sell = usdc(baseSize * price);       // USDC escrowed
    const buy = tinybar(baseSize);             // HBAR wanted
    const tx = await p2p.createLimitOrder(USDC.address, sell, HBAR, buy, 0, { gasLimit: 1_400_000 });
    await tx.wait();
    console.log(`BID  ${baseSize} HBAR @ ${price} USDC`);
  }

  const [ids] = await p2p.getOpenOrders(0);
  console.log("open orders now:", ids.length);
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
