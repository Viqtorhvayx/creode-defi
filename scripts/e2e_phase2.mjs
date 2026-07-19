import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const vaultArt = require("../artifacts/contracts/CreodeYieldVaultV2.sol/CreodeYieldVaultV2.json");
const routerArt = require("../artifacts/contracts/CreodeSwapRouter.sol/CreodeSwapRouter.json");
const map = require("../frontend/src/contracts/yield_strategies.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const treasury = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const ERC20 = ["function approve(address,uint256) returns (bool)", "function transfer(address,uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"];
const SAUCE = book.tokens.SAUCE, USDC = book.tokens.USDC;

const decFor = (addr) => addr === HBAR ? 8 : (Object.values(book.tokens).find(t => t.address.toLowerCase() === addr.toLowerCase())?.decimals ?? 18);
const f = (v, addr) => ethers.formatUnits(v, decFor(addr));

async function show(vault, user, id) {
  const rows = await vault.getUserPositions(user);
  const r = rows.find(x => Number(x.strategyId) === id);
  if (!r) { console.log(`   id${id}: (none)`); return; }
  console.log(`   id${id} ${r.name}: A=${f(r.amtA, r.tokenA)} ${r.tokenA===HBAR?'HBAR':'tokA'} | B=${f(r.amtB, r.tokenB)} ${r.tokenB===HBAR?'HBAR':'tokB'} | yA=${f(r.yieldA,r.tokenA)} yB=${f(r.yieldB,r.tokenB)}`);
}

async function main() {
  const user = ethers.Wallet.createRandom().connect(p);
  console.log("fresh user:", user.address);
  console.log("fund 15 HBAR..."); await (await treasury.sendTransaction({ to: user.address, value: ethers.parseEther("15"), gasLimit: 2_000_000 })).wait();
  console.log("send 2000 SAUCE..."); await (await new ethers.Contract(SAUCE.address, ERC20, treasury).transfer(user.address, ethers.parseUnits("2000", SAUCE.decimals), { gasLimit: 900_000 })).wait();

  const vault = new ethers.Contract(map.vault, vaultArt.abi, user);
  const sauceU = new ethers.Contract(SAUCE.address, ERC20, user);
  const usdcU = new ethers.Contract(USDC.address, ERC20, user);

  // ── ERC20 zap: 1000 SAUCE -> SAUCE-USDC (id 5), real swap of ~500 SAUCE -> USDC ──
  console.log("\n[ERC20] approve vault + zapIn 1000 SAUCE -> SAUCE-USDC (id5)");
  await (await sauceU.approve(map.vault, ethers.parseUnits("1000", SAUCE.decimals), { gasLimit: 1_000_000 })).wait();
  await (await vault.zapIn(5, SAUCE.address, ethers.parseUnits("1000", SAUCE.decimals), 0, { gasLimit: 2_500_000 })).wait();
  await show(vault, user.address, 5);

  console.log("[ERC20] withdrawAll id5");
  const sBefore = await usdcU.balanceOf(user.address);
  await (await vault.withdrawAll(5, { gasLimit: 2_000_000 })).wait();
  console.log("   USDC received:", f(await usdcU.balanceOf(user.address) - sBefore, USDC.address), "SAUCE bal:", f(await sauceU.balanceOf(user.address), SAUCE.address));

  // ── HBAR zap: 2 HBAR -> HBAR-USDC (id 4), real swap of ~1 HBAR -> USDC ──
  console.log("\n[HBAR] zapIn 2 HBAR -> HBAR-USDC (id4)");
  await (await vault.zapIn(4, HBAR, 0, 0, { value: ethers.parseEther("2"), gasLimit: 2_500_000 })).wait();
  await show(vault, user.address, 4);

  console.log("[HBAR] withdrawAll id4");
  await (await vault.withdrawAll(4, { gasLimit: 2_000_000 })).wait();
  await show(vault, user.address, 4);

  console.log("\nPHASE2 E2E OK");
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
