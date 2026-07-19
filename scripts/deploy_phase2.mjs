import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const routerArt = require("../artifacts/contracts/CreodeSwapRouter.sol/CreodeSwapRouter.json");
const vaultArt = require("../artifacts/contracts/CreodeYieldVaultV2.sol/CreodeYieldVaultV2.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const MAX = 9_000_000_000_000_000_000n;
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const T = (s) => book.tokens[s].address;
const DEC = (s) => book.tokens[s].decimals;
const unit = (s, whole) => ethers.parseUnits(String(whole), DEC(s));
const hbarRaw = (whole) => BigInt(whole) * 10n ** 8n; // in-contract tinybar
const ERC20 = ["function approve(address,uint256) returns (bool)"];

// Strategies: [name, tokenA, tokenB, apyBps]. tokenB==tokenA => single-sided.
const STRATS = [
  ["HBAR-SAUCE", HBAR, T("SAUCE"), 4520],
  ["HBAR-WBTC", HBAR, T("WBTC"), 1420],
  ["HBAR-DOVU", HBAR, HBAR, 6210],
  ["HBAR-WETH", HBAR, T("WETH"), 1140],
  ["HBAR-USDC", HBAR, T("USDC"), 1020],
  ["SAUCE-USDC", T("SAUCE"), T("USDC"), 1850],
  ["USDC-USDT", T("USDC"), T("USDT"), 1278],
];

// Pools to seed: HBAR side value-balanced ~$3.4 (40 HBAR); ERC20 pools deep.
// [tokenA, amountA(raw), tokenB, amountB(raw), hbarValueEth|null]
const POOLS = [
  [HBAR, hbarRaw(40), T("SAUCE"), unit("SAUCE", 99.7), "40"],
  [HBAR, hbarRaw(40), T("WBTC"), unit("WBTC", 0.0000567), "40"],
  [HBAR, hbarRaw(40), T("WETH"), unit("WETH", 0.001056), "40"],
  [HBAR, hbarRaw(40), T("USDC"), unit("USDC", 3.4), "40"],
  [T("SAUCE"), unit("SAUCE", 500000), T("USDC"), unit("USDC", 17050), null],
  [T("USDC"), unit("USDC", 100000), T("USDT"), unit("USDT", 100000), null],
];

const YIELD_TOKENS = ["SAUCE", "WBTC", "WETH", "USDC", "USDT"];

async function main() {
  console.log("Deployer/treasury:", w.address);

  // 1) Router
  process.stdout.write("Deploy CreodeSwapRouter... ");
  const router = await new ethers.ContractFactory(routerArt.abi, routerArt.bytecode, w).deploy(w.address, { gasLimit: 4_000_000 });
  await router.waitForDeployment();
  const routerAddr = await router.getAddress();
  console.log(routerAddr);

  // 2) Approve router to pull tokens for seeding
  for (const sym of YIELD_TOKENS) {
    process.stdout.write(`Approve router for ${sym}... `);
    await (await new ethers.Contract(T(sym), ERC20, w).approve(routerAddr, MAX, { gasLimit: 1_000_000 })).wait();
    console.log("ok");
  }

  // 3) Seed pools
  for (const [a, amtA, b, amtB, hbarEth] of POOLS) {
    const label = `${a === HBAR ? "HBAR" : Object.keys(book.tokens).find(s => T(s) === a)}-${Object.keys(book.tokens).find(s => T(s) === b)}`;
    process.stdout.write(`Seed pool ${label}... `);
    const opts = { gasLimit: 1_500_000 };
    if (hbarEth) opts.value = ethers.parseEther(hbarEth);
    await (await router.addLiquidity(a, amtA, b, amtB, opts)).wait();
    console.log("ok");
  }

  // 4) Vault v2
  process.stdout.write("Deploy CreodeYieldVaultV2... ");
  const vault = await new ethers.ContractFactory(vaultArt.abi, vaultArt.bytecode, w).deploy(w.address, w.address, routerAddr, { gasLimit: 5_000_000 });
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(vaultAddr);

  // 5) Strategies
  const created = [];
  for (const [name, tA, tB, apy] of STRATS) {
    process.stdout.write(`Create ${name}... `);
    await (await vault.createStrategy(name, tA, tB, apy, { gasLimit: 1_200_000 })).wait();
    created.push({ id: created.length, name, tokenA: tA, tokenB: tB, apyBps: apy });
    console.log(`id ${created.length - 1}`);
  }

  // 6) Treasury approvals so the vault can pull ERC20 yield
  for (const sym of YIELD_TOKENS) {
    process.stdout.write(`Approve vault for ${sym} yield... `);
    await (await new ethers.Contract(T(sym), ERC20, w).approve(vaultAddr, MAX, { gasLimit: 1_000_000 })).wait();
    console.log("ok");
  }

  // 7) Fund vault HBAR reserve (native-HBAR yield)
  process.stdout.write("Fund vault HBAR reserve (25 HBAR)... ");
  await (await vault.fundHbarReserve({ value: ethers.parseEther("25"), gasLimit: 1_000_000 })).wait();
  console.log("done");

  // 8) Export to frontend
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeYieldVaultV2.json", outDir), JSON.stringify({ address: vaultAddr, abi: vaultArt.abi }, null, 2));
  fs.writeFileSync(new URL("CreodeSwapRouter.json", outDir), JSON.stringify({ address: routerAddr, abi: routerArt.abi }, null, 2));

  const symByAddr = { [HBAR.toLowerCase()]: "HBAR" };
  const decByAddr = { [HBAR.toLowerCase()]: 18 };
  for (const [sym, info] of Object.entries(book.tokens)) { symByAddr[info.address.toLowerCase()] = sym; decByAddr[info.address.toLowerCase()] = info.decimals; }
  const tok = (a) => ({ sym: symByAddr[a.toLowerCase()] || "?", address: a, decimals: decByAddr[a.toLowerCase()] ?? 18 });

  const stratMap = {};
  for (const s of created) {
    stratMap[s.name] = {
      id: s.id, apyBps: s.apyBps, single: s.tokenA === s.tokenB,
      tokenA: tok(s.tokenA), tokenB: tok(s.tokenB),
    };
  }
  fs.writeFileSync(new URL("yield_strategies.json", outDir), JSON.stringify({ vault: vaultAddr, router: routerAddr, version: 2, strategies: stratMap }, null, 2));
  fs.writeFileSync(new URL("./phase2.json", import.meta.url), JSON.stringify({ router: routerAddr, vault: vaultAddr, strategies: created }, null, 2));

  console.log("\nPhase 2 deployed. Router:", routerAddr, "Vault:", vaultAddr);
}
main().catch((e) => { console.error(e); process.exit(1); });
