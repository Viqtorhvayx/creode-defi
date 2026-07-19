import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const art = require("../artifacts/contracts/CreodeYieldVault.sol/CreodeYieldVault.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const MAX = 9_000_000_000_000_000_000n; // int64-safe, effectively unlimited (HTS allowance)
const RPC = "https://testnet.hashio.io/api";

const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
console.log("Deployer / treasury:", w.address);

const T = (sym) => book.tokens[sym].address;

// Strategy definitions: [name, apyBps, acceptedTokens]. HBAR = address(0).
// Only tokens that actually exist on testnet are accepted for deposits.
const STRATS = [
  ["HBAR-SAUCE", 4520, [HBAR, T("SAUCE")]],
  ["HBAR-WBTC", 1420, [HBAR, T("WBTC")]],
  ["HBAR-DOVU", 6210, [HBAR]],
  ["HBAR-WETH", 1140, [HBAR, T("WETH")]],
  ["HBAR-USDC", 1020, [HBAR, T("USDC")]],
  ["SAUCE-USDC", 1850, [T("SAUCE"), T("USDC")]],
  ["USDC-USDT", 1278, [T("USDC"), T("USDT")]],
];

// ERC20 tokens the treasury must approve so the vault can pull yield.
const YIELD_TOKENS = ["SAUCE", "WBTC", "WETH", "USDC", "USDT"];
const ERC20 = ["function approve(address,uint256) returns (bool)"];

async function main() {
  // 1) Deploy
  const factory = new ethers.ContractFactory(art.abi, art.bytecode, w);
  process.stdout.write("Deploying CreodeYieldVault... ");
  const vault = await factory.deploy(w.address, w.address, { gasLimit: 5_000_000 });
  await vault.waitForDeployment();
  const addr = await vault.getAddress();
  console.log(addr);

  // 2) Create strategies
  const created = [];
  for (const [name, apy, tokens] of STRATS) {
    process.stdout.write(`Create ${name} (apy ${apy})... `);
    const tx = await vault.createStrategy(name, apy, tokens, { gasLimit: 1_500_000 });
    const rc = await tx.wait();
    // strategyId is sequential in creation order
    const id = created.length;
    created.push({ id, name, apyBps: apy, tokens });
    console.log(`id ${id} (tx ${rc.hash.slice(0, 10)})`);
  }

  // 3) Treasury approvals so the vault can pull ERC20 yield
  for (const sym of YIELD_TOKENS) {
    process.stdout.write(`Approve ${sym} yield allowance... `);
    const token = new ethers.Contract(T(sym), ERC20, w);
    await (await token.approve(addr, MAX, { gasLimit: 1_000_000 })).wait();
    console.log("ok");
  }

  // 4) Fund HBAR reserve (pays native-HBAR yield)
  process.stdout.write("Fund HBAR reserve (50 HBAR)... ");
  await (await vault.fundHbarReserve({ value: ethers.parseEther("50"), gasLimit: 1_000_000 })).wait();
  console.log("done");

  // 5) Export ABI + address + strategy map to the frontend
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeYieldVault.json", outDir), JSON.stringify({ address: addr, abi: art.abi }, null, 2));

  // strategy map keyed by pair name -> { id, apyBps, tokens: [{sym,address,decimals}] }
  const symByAddr = { [HBAR.toLowerCase()]: "HBAR" };
  for (const [sym, info] of Object.entries(book.tokens)) symByAddr[info.address.toLowerCase()] = sym;
  const decByAddr = { [HBAR.toLowerCase()]: 18 };
  for (const [, info] of Object.entries(book.tokens)) decByAddr[info.address.toLowerCase()] = info.decimals;

  const stratMap = {};
  for (const s of created) {
    stratMap[s.name] = {
      id: s.id,
      apyBps: s.apyBps,
      tokens: s.tokens.map((a) => ({
        sym: symByAddr[a.toLowerCase()] || "?",
        address: a,
        decimals: decByAddr[a.toLowerCase()] ?? 18,
      })),
    };
  }
  fs.writeFileSync(new URL("yield_strategies.json", outDir), JSON.stringify({ vault: addr, strategies: stratMap }, null, 2));

  // local record
  fs.writeFileSync(new URL("./yield_vault.json", import.meta.url), JSON.stringify({ vault: addr, treasury: w.address, strategies: created }, null, 2));

  console.log("\nDeployed + configured. Vault:", addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
