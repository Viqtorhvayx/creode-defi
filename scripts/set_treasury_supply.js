import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERC20 = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address,uint256) returns (bool)",
  "function mint(address,uint256)",
];
const DEAD = "0x000000000000000000000000000000000000dEaD";
const TARGET_WHOLE = 2_000_000n;

async function main() {
  const minted = JSON.parse(fs.readFileSync(path.join(__dirname, "minted_tokens.json")));
  const [signer] = await hre.ethers.getSigners();
  const treasury = signer.address;
  console.log(`Treasury: ${treasury}\nTarget: ${TARGET_WHOLE} of each\n`);

  for (const [sym, info] of Object.entries(minted)) {
    const token = new hre.ethers.Contract(info.address, ERC20, signer);
    const dec = Number(info.decimals);
    const target = TARGET_WHOLE * (10n ** BigInt(dec));
    const bal = await token.balanceOf(treasury);
    const fmt = (x) => hre.ethers.formatUnits(x, dec);

    if (bal === target) {
      console.log(`${sym.padEnd(6)} already 2,000,000 — skip`);
    } else if (bal > target) {
      const excess = bal - target;
      process.stdout.write(`${sym.padEnd(6)} ${fmt(bal)} -> burn ${fmt(excess)} to dead... `);
      await (await token.transfer(DEAD, excess)).wait();
      console.log(`now ${fmt(await token.balanceOf(treasury))}`);
    } else {
      const deficit = target - bal;
      process.stdout.write(`${sym.padEnd(6)} ${fmt(bal)} -> mint +${fmt(deficit)}... `);
      await (await token.mint(treasury, deficit)).wait();
      console.log(`now ${fmt(await token.balanceOf(treasury))}`);
    }
  }
  console.log("\nAll treasury balances set to 2,000,000.");
}

main().catch((e) => { console.error(e); process.exit(1); });
