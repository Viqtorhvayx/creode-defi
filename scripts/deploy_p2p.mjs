import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeP2P.sol/CreodeP2P.json");
const book = require("./hts_tokens.json");

const HBAR = "0x0000000000000000000000000000000000000000";
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);

async function main() {
  console.log("Deployer/treasury:", w.address);
  const p2p = await new ethers.ContractFactory(art.abi, art.bytecode, w).deploy(w.address, w.address, { gasLimit: 4_000_000 });
  await p2p.waitForDeployment();
  const addr = await p2p.getAddress();
  console.log("CreodeP2P:", addr);

  // Export ABI + address + the tradable token set for the P2P UI.
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeP2P.json", outDir), JSON.stringify({ address: addr, abi: art.abi }, null, 2));

  const tokens = { HBAR: { sym: "HBAR", address: HBAR, decimals: 18 } };
  for (const [sym, info] of Object.entries(book.tokens)) tokens[sym] = { sym, address: info.address, decimals: info.decimals };
  // Pairs the P2P UI trades (base/quote).
  const pairs = [
    { base: "HBAR", quote: "USDC" },
    { base: "SAUCE", quote: "USDC" },
    { base: "USDC", quote: "USDT" },
  ];
  fs.writeFileSync(new URL("p2p_config.json", outDir), JSON.stringify({ address: addr, feeBps: 20, tokens, pairs }, null, 2));
  fs.writeFileSync(new URL("./p2p.json", import.meta.url), JSON.stringify({ address: addr }, null, 2));
  console.log("Exported CreodeP2P.json + p2p_config.json");
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
