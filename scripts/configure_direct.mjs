import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const vArt = require("../artifacts/contracts/CreodeVault.sol/CreodeVault.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
// HTS allowances are int64 — MAX_UINT overflows. Use a large int64-safe value.
const MAX = 9_000_000_000_000_000_000n; // ~int64 max, effectively unlimited for yield
const VAULT = "0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139";
const FAUCET = "0xbaC03178715Ba054E1832dAE6b069e44234aa567";

const CFG = {
  USDC:  { minWhole: 10n,     t: [400, 650, 900] },
  USDT:  { minWhole: 10n,     t: [400, 650, 900] },
  SAUCE: { minWhole: 200n,    t: [800, 1400, 2200] },
  PACK:  { minWhole: 100000n, t: [800, 1400, 2200] },
  JAM:   { minWhole: 2000n,   t: [800, 1400, 2200] },
  WETH:  { minRaw: 300000n,   t: [350, 550, 800] },
  WBTC:  { minRaw: 15000n,    t: [350, 550, 800] },
  BONZO: { minWhole: 200000n, t: [800, 1400, 2200] },
};
const ERC20 = ["function approve(address,uint256) returns (bool)"];

const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const vault = new ethers.Contract(VAULT, vArt.abi, w);

for (const [sym, info] of Object.entries(book.tokens)) {
  const cfg = CFG[sym];
  const unit = 10n ** BigInt(info.decimals);
  const minRaw = cfg.minRaw ?? cfg.minWhole * unit;
  process.stdout.write(`Config ${sym} (min ${minRaw})... `);
  let tx = await vault.configureToken(info.address, minRaw, cfg.t[0], cfg.t[1], cfg.t[2], { gasLimit: 2000000 });
  await tx.wait();
  const token = new ethers.Contract(info.address, ERC20, w);
  tx = await token.approve(VAULT, MAX, { gasLimit: 2000000 });
  await tx.wait();
  console.log("configured + approved");
}

process.stdout.write("Config native HBAR (min 100)... ");
await (await vault.configureToken(HBAR, 10000000000n, 350, 550, 800, { gasLimit: 2000000 })).wait();
console.log("configured");

process.stdout.write("Fund vault HBAR reserve (150 HBAR)... ");
await (await vault.fundHbarReserve({ value: ethers.parseEther("150"), gasLimit: 1000000 })).wait();
console.log("done");

// Export
const outBook = { vault: VAULT, faucet: FAUCET, factory: book.factory, hbar: HBAR, tokens: book.tokens };
fs.writeFileSync(new URL("./hts_stack.json", import.meta.url), JSON.stringify(outBook, null, 2));
const fArt = require("../artifacts/contracts/CreodeFaucet.sol/CreodeFaucet.json");
fs.writeFileSync(new URL("../frontend/src/contracts/CreodeVault.json", import.meta.url), JSON.stringify({ address: VAULT, abi: vArt.abi, bytecode: vArt.bytecode }, null, 2));
fs.writeFileSync(new URL("../frontend/src/contracts/CreodeFaucet.json", import.meta.url), JSON.stringify({ address: FAUCET, abi: fArt.abi }, null, 2));
fs.writeFileSync(new URL("../frontend/src/context/abis.json", import.meta.url), JSON.stringify({ CreodeVault: vArt.abi }, null, 2));
console.log("Saved hts_stack.json + frontend ABIs");
