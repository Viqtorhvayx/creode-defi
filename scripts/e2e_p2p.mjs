import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeP2P.sol/CreodeP2P.json");
const cfg = require("../frontend/src/contracts/p2p_config.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const taker = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p); // deployer holds tokens
const ERC20 = ["function approve(address,uint256) returns (bool)","function transfer(address,uint256) returns (bool)","function balanceOf(address) view returns (uint256)"];
const SAUCE = book.tokens.SAUCE, USDC = book.tokens.USDC;
const f6 = (v) => ethers.formatUnits(v, 6);

async function main() {
  const p2pTaker = new ethers.Contract(cfg.address, art.abi, taker);
  const sauceT = new ethers.Contract(SAUCE.address, ERC20, taker);
  const usdcT = new ethers.Contract(USDC.address, ERC20, taker);

  // fresh maker
  const maker = ethers.Wallet.createRandom().connect(p);
  console.log("maker:", maker.address);
  await (await taker.sendTransaction({ to: maker.address, value: ethers.parseEther("12"), gasLimit: 2_000_000 })).wait();
  await (await sauceT.transfer(maker.address, ethers.parseUnits("500", 6), { gasLimit: 900_000 })).wait();
  const p2pMaker = new ethers.Contract(cfg.address, art.abi, maker);
  const sauceM = new ethers.Contract(SAUCE.address, ERC20, maker);
  const usdcM = new ethers.Contract(USDC.address, ERC20, maker);

  const hbarRaw = (whole) => BigInt(whole) * 10n ** 8n; // HBAR amounts are tinybar in-contract

  // ── ERC20 limit order: maker sells 200 SAUCE for 6 USDC ──
  console.log("\n[LIMIT] maker escrows 200 SAUCE, wants 6 USDC");
  await (await sauceM.approve(cfg.address, ethers.parseUnits("200",6), { gasLimit: 1_000_000 })).wait();
  const id = Number(await p2pMaker.nextOrderId());
  const rc = await (await p2pMaker.createLimitOrder(SAUCE.address, ethers.parseUnits("200",6), USDC.address, ethers.parseUnits("6",6), 0, { gasLimit: 1_300_000 })).wait();
  console.log("   order", id, "created (tx", rc.hash.slice(0,10) + ")");
  console.log("   maker USDC before fill:", f6(await usdcM.balanceOf(maker.address)));

  // taker fills half (pay 3 USDC -> ~100 SAUCE minus fee)
  console.log("[MARKET] taker fills 3 USDC of the order");
  await (await usdcT.approve(cfg.address, ethers.parseUnits("100",6), { gasLimit: 1_000_000 })).wait();
  const sBefore = await sauceT.balanceOf(taker.address);
  await (await p2pTaker.fillOrder(id, ethers.parseUnits("3",6), 0, { gasLimit: 1_600_000 })).wait();
  console.log("   taker SAUCE received:", f6(await sauceT.balanceOf(taker.address) - sBefore), "(expect ~99.8 = 100 - 0.2% fee)");
  console.log("   maker USDC now:", f6(await usdcM.balanceOf(maker.address)), "(expect +3)");

  // fill the rest
  console.log("[MARKET] taker fills remaining 3 USDC");
  const s2 = await sauceT.balanceOf(taker.address);
  await (await p2pTaker.fillOrder(id, ethers.parseUnits("3",6), 0, { gasLimit: 1_600_000 })).wait();
  console.log("   taker SAUCE received:", f6(await sauceT.balanceOf(taker.address) - s2));
  const o = await p2pTaker.getOrder(id);
  console.log("   order active?", o.active, "| sellRemaining:", f6(o.sellRemaining));

  // ── HBAR limit order: maker sells 2 HBAR for 0.17 USDC (HBAR amount = tinybar) ──
  console.log("\n[LIMIT-HBAR] maker escrows 2 HBAR, wants 0.17 USDC");
  const hbarId = Number(await p2pMaker.nextOrderId());
  await (await p2pMaker.createLimitOrder(HBAR, hbarRaw(2), USDC.address, ethers.parseUnits("0.17",6), 0, { value: ethers.parseEther("2"), gasLimit: 1_300_000 })).wait();
  const takerHbarBefore = await p.getBalance(taker.address);
  console.log("[MARKET-HBAR] taker pays 0.17 USDC -> receives HBAR");
  await (await p2pTaker.fillOrder(hbarId, ethers.parseUnits("0.17",6), 0, { gasLimit: 1_600_000 })).wait();
  const takerHbarAfter = await p.getBalance(taker.address);
  console.log("   taker HBAR delta (net of gas):", ethers.formatEther(takerHbarAfter - takerHbarBefore));

  // ── Cancel ──
  console.log("\n[CANCEL] maker creates + cancels an order, gets escrow back");
  await (await sauceM.approve(cfg.address, ethers.parseUnits("50",6), { gasLimit: 1_000_000 })).wait();
  const cancelId = Number(await p2pMaker.nextOrderId());
  await (await p2pMaker.createLimitOrder(SAUCE.address, ethers.parseUnits("50",6), USDC.address, ethers.parseUnits("2",6), 0, { gasLimit: 1_300_000 })).wait();
  const mSauceBefore = await sauceM.balanceOf(maker.address);
  await (await p2pMaker.cancelOrder(cancelId, { gasLimit: 1_000_000 })).wait();
  console.log("   maker SAUCE refunded:", f6(await sauceM.balanceOf(maker.address) - mSauceBefore), "(expect 50)");

  const [ids] = await p2pTaker.getOpenOrders(0);
  console.log("\n   open orders remaining:", ids.length);
  console.log("P2P E2E OK");
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
