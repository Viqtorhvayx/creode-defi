import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const swapArt = require("../artifacts/contracts/CreodeTreasurySwap.sol/CreodeTreasurySwap.json");
const vaultArt = require("../artifacts/contracts/CreodeYieldVaultV3.sol/CreodeYieldVaultV3.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const MAX = 9_000_000_000_000_000_000n;
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const T = (s) => book.tokens[s].address;
const ERC20 = ["function approve(address,uint256) returns (bool)"];

// USD price (8dp) + decimals per token.
const PRICES = [
  [HBAR, 8_500_000n, 8],
  [T("SAUCE"), 3_410_000n, 6],
  [T("USDC"), 100_000_000n, 6],
  [T("USDT"), 100_000_000n, 6],
  [T("WBTC"), 6_000_000_000_000n, 8],
  [T("WETH"), 322_000_000_000n, 8],
];
const STRATS = [
  ["HBAR-SAUCE", HBAR, T("SAUCE"), 4520],
  ["HBAR-WBTC", HBAR, T("WBTC"), 1420],
  ["HBAR-DOVU", HBAR, HBAR, 6210],
  ["HBAR-WETH", HBAR, T("WETH"), 1140],
  ["HBAR-USDC", HBAR, T("USDC"), 1020],
  ["SAUCE-USDC", T("SAUCE"), T("USDC"), 1850],
  ["USDC-USDT", T("USDC"), T("USDT"), 1278],
];
const YIELD_TOKENS = ["SAUCE", "WBTC", "WETH", "USDC", "USDT"];

async function main() {
  console.log("Treasury/deployer:", w.address, "| HBAR:", ethers.formatEther(await p.getBalance(w.address)));

  process.stdout.write("Deploy CreodeTreasurySwap... ");
  const swap = await new ethers.ContractFactory(swapArt.abi, swapArt.bytecode, w).deploy(w.address, w.address, { gasLimit: 3_500_000 });
  await swap.waitForDeployment();
  const swapAddr = await swap.getAddress();
  console.log(swapAddr);

  process.stdout.write("Set prices... ");
  await (await swap.setPrices(PRICES.map(x=>x[0]), PRICES.map(x=>x[1]), PRICES.map(x=>x[2]), { gasLimit: 1_500_000 })).wait();
  console.log("ok");

  // Treasury approves the swap to pull output tokens.
  for (const sym of YIELD_TOKENS) {
    process.stdout.write(`Approve swap for ${sym}... `);
    await (await new ethers.Contract(T(sym), ERC20, w).approve(swapAddr, MAX, { gasLimit: 1_000_000 })).wait();
    console.log("ok");
  }
  process.stdout.write("Fund swap HBAR reserve (20 HBAR)... ");
  await (await swap.fundHbarReserve({ value: ethers.parseEther("20"), gasLimit: 1_000_000 })).wait();
  console.log("done");

  process.stdout.write("Deploy CreodeYieldVaultV3... ");
  const vault = await new ethers.ContractFactory(vaultArt.abi, vaultArt.bytecode, w).deploy(w.address, w.address, swapAddr, { gasLimit: 5_000_000 });
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(vaultAddr);

  const created = [];
  for (const [name, tA, tB, apy] of STRATS) {
    process.stdout.write(`Create ${name}... `);
    await (await vault.createStrategy(name, tA, tB, apy, { gasLimit: 1_200_000 })).wait();
    created.push({ id: created.length, name, tokenA: tA, tokenB: tB, apyBps: apy });
    console.log(`id ${created.length - 1}`);
  }

  for (const sym of YIELD_TOKENS) {
    process.stdout.write(`Approve vault for ${sym} yield... `);
    await (await new ethers.Contract(T(sym), ERC20, w).approve(vaultAddr, MAX, { gasLimit: 1_000_000 })).wait();
    console.log("ok");
  }
  process.stdout.write("Fund vault HBAR reserve (15 HBAR)... ");
  await (await vault.fundHbarReserve({ value: ethers.parseEther("15"), gasLimit: 1_000_000 })).wait();
  console.log("done");

  // Export
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeYieldVaultV3.json", outDir), JSON.stringify({ address: vaultAddr, abi: vaultArt.abi }, null, 2));
  fs.writeFileSync(new URL("CreodeTreasurySwap.json", outDir), JSON.stringify({ address: swapAddr, abi: swapArt.abi }, null, 2));
  const symByAddr = { [HBAR.toLowerCase()]: "HBAR" }, decByAddr = { [HBAR.toLowerCase()]: 18 };
  for (const [sym, info] of Object.entries(book.tokens)) { symByAddr[info.address.toLowerCase()] = sym; decByAddr[info.address.toLowerCase()] = info.decimals; }
  const tok = (a) => ({ sym: symByAddr[a.toLowerCase()] || "?", address: a, decimals: decByAddr[a.toLowerCase()] ?? 18 });
  const stratMap = {};
  for (const s of created) stratMap[s.name] = { id: s.id, apyBps: s.apyBps, single: s.tokenA === s.tokenB, tokenA: tok(s.tokenA), tokenB: tok(s.tokenB) };
  fs.writeFileSync(new URL("yield_strategies.json", outDir), JSON.stringify({ vault: vaultAddr, router: swapAddr, version: 3, engine: "treasury", strategies: stratMap }, null, 2));
  fs.writeFileSync(new URL("./treasury_stack.json", import.meta.url), JSON.stringify({ swap: swapAddr, vault: vaultAddr, strategies: created }, null, 2));
  console.log("\nTreasury stack deployed. Swap:", swapAddr, "Vault:", vaultAddr);
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
