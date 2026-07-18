import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 8 HTS tokens (native HBAR is handled separately by the vault, not minted).
const TOKENS = [
  { symbol: "USDC",  name: "USD Coin",      decimals: 6, supplyWhole: 10_000_000n },
  { symbol: "USDT",  name: "Tether USD",    decimals: 6, supplyWhole: 10_000_000n },
  { symbol: "SAUCE", name: "SAUCE",         decimals: 6, supplyWhole: 10_000_000n },
  { symbol: "PACK",  name: "HashPack",      decimals: 6, supplyWhole: 10_000_000n },
  { symbol: "JAM",   name: "Tune.FM",       decimals: 6, supplyWhole: 10_000_000n },
  { symbol: "WETH",  name: "Wrapped Ether", decimals: 8, supplyWhole: 10_000_000n },
  { symbol: "WBTC",  name: "Wrapped BTC",   decimals: 8, supplyWhole: 10_000_000n },
  { symbol: "BONZO", name: "Bonzo Finance", decimals: 6, supplyWhole: 10_000_000n },
];

async function main() {
  await hre.run("compile");
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}\n`);

  const Factory = await hre.ethers.getContractFactory("HtsTokenFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const fAddr = await factory.getAddress();
  console.log(`Factory: ${fAddr}`);

  // Fund factory with HBAR to cover HTS creation fees + auto-renew.
  await (await deployer.sendTransaction({ to: fAddr, value: hre.ethers.parseEther("200") })).wait();
  console.log("Funded factory with 200 HBAR\n");

  const results = {};
  for (const t of TOKENS) {
    const initialSupply = t.supplyWhole * (10n ** BigInt(t.decimals));
    process.stdout.write(`Creating HTS ${t.symbol} (${t.name}, ${t.decimals}dp)... `);
    const tx = await factory.createToken(t.name, t.symbol, t.decimals, initialSupply, {
      value: hre.ethers.parseEther("18"),
      gasLimit: 900000,
    });
    const rcpt = await tx.wait();
    let addr = null;
    for (const log of rcpt.logs) {
      try { const p = factory.interface.parseLog(log); if (p && p.name === "TokenCreated") addr = p.args.token; } catch {}
    }
    const tokenId = addr ? `0.0.${BigInt(addr).toString()}` : "?";
    results[t.symbol] = { address: addr, tokenId, decimals: t.decimals, name: t.name };
    console.log(`✓ ${addr}  (${tokenId})`);
  }

  const out = { factory: fAddr, tokens: results };
  fs.writeFileSync(path.join(__dirname, "hts_tokens.json"), JSON.stringify(out, null, 2));
  console.log("\nSaved -> scripts/hts_tokens.json");
}

main().catch((e) => { console.error("FAILED:", e.reason || e.shortMessage || e.message); process.exit(1); });
