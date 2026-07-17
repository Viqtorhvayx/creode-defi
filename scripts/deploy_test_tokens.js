import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Real mainnet names/symbols; decimals match the frontend TOKEN_DECIMALS.
const TOKENS = [
  { symbol: "USDC",  name: "USD Coin",      decimals: 6, supplyWhole: 100_000_000n },
  { symbol: "USDT",  name: "Tether USD",    decimals: 6, supplyWhole: 100_000_000n },
  { symbol: "SAUCE", name: "SAUCE",         decimals: 6, supplyWhole: 100_000_000n },
  { symbol: "PACK",  name: "HashPack",      decimals: 6, supplyWhole: 1_000_000_000n },
  { symbol: "JAM",   name: "Tune.FM",       decimals: 6, supplyWhole: 100_000_000n },
  { symbol: "WETH",  name: "Wrapped Ether", decimals: 8, supplyWhole: 1_000_000n },
  { symbol: "WBTC",  name: "Wrapped BTC",   decimals: 8, supplyWhole: 1_000_000n },
  { symbol: "BONZO", name: "Bonzo Finance", decimals: 6, supplyWhole: 1_000_000_000n },
  { symbol: "WHBAR", name: "Wrapped Hbar",  decimals: 8, supplyWhole: 100_000_000n },
];

async function main() {
  await hre.run("compile");
  const [deployer] = await hre.ethers.getSigners();
  const treasury = process.env.TREASURY_WALLET || deployer.address;
  console.log(`Deployer/treasury: ${deployer.address}\n`);

  const Factory = await hre.ethers.getContractFactory("MockERC20");
  const results = {};

  for (const t of TOKENS) {
    const initialSupply = t.supplyWhole * (10n ** BigInt(t.decimals));
    process.stdout.write(`Deploying ${t.symbol} (${t.name}, ${t.decimals}dp)... `);
    const token = await Factory.deploy(t.name, t.symbol, t.decimals, initialSupply, treasury);
    await token.waitForDeployment();
    const addr = await token.getAddress();
    results[t.symbol] = { address: addr, decimals: t.decimals, name: t.name };
    console.log(`✓ ${addr}`);
  }

  fs.writeFileSync(
    path.join(__dirname, "minted_tokens.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("\nSaved -> scripts/minted_tokens.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
