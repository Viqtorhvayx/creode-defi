import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// minDeposit is in the token's smallest unit; tiers are APY in BPS.
const CONFIG = {
  USDC:  { min: 10n,      dec: 6, t: [400, 650, 900] },
  USDT:  { min: 10n,      dec: 6, t: [400, 650, 900] },
  SAUCE: { min: 200n,     dec: 6, t: [800, 1400, 2200] },
  PACK:  { min: 100000n,  dec: 6, t: [800, 1400, 2200] },
  JAM:   { min: 2000n,    dec: 6, t: [800, 1400, 2200] },
  WETH:  { min: 0n,       dec: 8, t: [350, 550, 800], minRaw: 300000n },   // 0.003
  WBTC:  { min: 0n,       dec: 8, t: [350, 550, 800], minRaw: 15000n },    // 0.00015
  BONZO: { min: 200000n,  dec: 6, t: [800, 1400, 2200] },
  WHBAR: { min: 100n,     dec: 8, t: [350, 550, 800] },
};

const ERC20_APPROVE = ["function approve(address,uint256) returns (bool)"];
const MAX_UINT = (2n ** 256n) - 1n;

async function main() {
  const minted = JSON.parse(fs.readFileSync(path.join(__dirname, "minted_tokens.json")));
  const vaultAddr = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
  if (!vaultAddr) throw new Error("NEXT_PUBLIC_VAULT_ADDRESS not set");

  const [signer] = await hre.ethers.getSigners();
  const artifact = await hre.artifacts.readArtifact("CreodeVault");
  const vault = new hre.ethers.Contract(vaultAddr, artifact.abi, signer);

  console.log(`Vault: ${vaultAddr}\nTreasury/signer: ${signer.address}\n`);

  for (const [sym, info] of Object.entries(minted)) {
    const cfg = CONFIG[sym];
    if (!cfg) { console.log(`Skipping ${sym}: no config`); continue; }
    const minRaw = cfg.minRaw ?? (cfg.min * (10n ** BigInt(cfg.dec)));

    process.stdout.write(`Configuring ${sym} @ ${info.address} (min ${minRaw})... `);
    const tx1 = await vault.configureToken(info.address, minRaw, cfg.t[0], cfg.t[1], cfg.t[2]);
    await tx1.wait();

    // Treasury approves the vault so it can pull yield via transferFrom.
    const token = new hre.ethers.Contract(info.address, ERC20_APPROVE, signer);
    const tx2 = await token.approve(vaultAddr, MAX_UINT);
    await tx2.wait();
    console.log("✓ configured + approved");
  }

  console.log("\nDone. All tokens configured and treasury-approved for yield.");
}

main().catch((e) => { console.error(e); process.exit(1); });
