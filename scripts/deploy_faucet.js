import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  await hre.run("compile");
  const minted = JSON.parse(fs.readFileSync(path.join(__dirname, "minted_tokens.json")));
  const tokenAddrs = Object.values(minted).map((t) => t.address);

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Seeding faucet with ${tokenAddrs.length} tokens`);

  const Faucet = await hre.ethers.getContractFactory("CreodeFaucet");
  const faucet = await Faucet.deploy(tokenAddrs);
  await faucet.waitForDeployment();
  const addr = await faucet.getAddress();
  console.log(`\nCreodeFaucet deployed: ${addr}`);

  // Persist alongside the token book + export ABI for the frontend.
  const book = { faucet: addr, tokens: minted };
  fs.writeFileSync(path.join(__dirname, "faucet.json"), JSON.stringify(book, null, 2));

  const artifact = await hre.artifacts.readArtifact("CreodeFaucet");
  const outDir = path.join(__dirname, "../frontend/src/contracts");
  fs.writeFileSync(path.join(outDir, "CreodeFaucet.json"), JSON.stringify({ address: addr, abi: artifact.abi }, null, 2));
  console.log(`ABI -> frontend/src/contracts/CreodeFaucet.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
