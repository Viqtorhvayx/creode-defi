import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const vaultArt = require("../artifacts/contracts/CreodeYieldVaultV3.sol/CreodeYieldVaultV3.json");
const map = require("../frontend/src/contracts/yield_strategies.json");
const book = require("./hts_tokens.json");
const HBAR = "0x0000000000000000000000000000000000000000";
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const treasury = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const ERC20 = ["function approve(address,uint256) returns (bool)","function transfer(address,uint256) returns (bool)","function balanceOf(address) view returns (uint256)"];
const SAUCE = book.tokens.SAUCE, USDC = book.tokens.USDC;
const decFor = (a) => a === HBAR ? 8 : (Object.values(book.tokens).find(t=>t.address.toLowerCase()===a.toLowerCase())?.decimals ?? 18);
const f = (v,a) => ethers.formatUnits(v, decFor(a));
async function show(v,u,id,l){ const r=(await v.getUserPositions(u)).find(x=>Number(x.strategyId)===id); console.log(`   ${l}: A=${f(r.amtA,r.tokenA)} B=${f(r.amtB,r.tokenB)} yA=${f(r.yieldA,r.tokenA)} yB=${f(r.yieldB,r.tokenB)}`); }

async function main() {
  const user = ethers.Wallet.createRandom().connect(p);
  console.log("user:", user.address);
  await (await treasury.sendTransaction({ to: user.address, value: ethers.parseEther("15"), gasLimit: 2_000_000 })).wait();
  await (await new ethers.Contract(SAUCE.address, ERC20, treasury).transfer(user.address, ethers.parseUnits("2000", 6), { gasLimit: 900_000 })).wait();
  const vault = new ethers.Contract(map.vault, vaultArt.abi, user);
  const sauceU = new ethers.Contract(SAUCE.address, ERC20, user);
  const usdcU = new ethers.Contract(USDC.address, ERC20, user);

  console.log("\n[HBAR] zapIn 4 HBAR -> HBAR-USDC (id4) [treasury swap, clean]");
  await (await vault.zapIn(4, HBAR, 0, 0, { value: ethers.parseEther("4"), gasLimit: 2_600_000 })).wait();
  await show(vault, user.address, 4, "after zap");

  console.log("[compound] wait ~6s, compoundMine(4)");
  await new Promise(r=>setTimeout(r,6000));
  await (await vault.compoundMine(4, { gasLimit: 1_800_000 })).wait();
  await show(vault, user.address, 4, "after compound (principal folded)");

  console.log("\n[ERC20] approve + zapIn 1000 SAUCE -> SAUCE-USDC (id5)");
  await (await sauceU.approve(map.vault, ethers.parseUnits("1000",6), { gasLimit: 1_000_000 })).wait();
  await (await vault.zapIn(5, SAUCE.address, ethers.parseUnits("1000",6), 0, { gasLimit: 2_600_000 })).wait();
  await show(vault, user.address, 5, "after zap");
  console.log("[ERC20] withdrawAll id5");
  await (await vault.withdrawAll(5, { gasLimit: 2_200_000 })).wait();
  console.log("   USDC bal:", f(await usdcU.balanceOf(user.address), USDC.address), "SAUCE bal:", f(await sauceU.balanceOf(user.address), SAUCE.address));
  console.log("\nTREASURY E2E OK");
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
