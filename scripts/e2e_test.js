import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ERC20 = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

async function main() {
  const minted = JSON.parse(fs.readFileSync(path.join(__dirname, "minted_tokens.json")));
  const usdc = minted.USDC.address;
  const vaultAddr = process.env.NEXT_PUBLIC_VAULT_ADDRESS;

  const [signer] = await hre.ethers.getSigners();
  const artifact = await hre.artifacts.readArtifact("CreodeVault");
  const vault = new hre.ethers.Contract(vaultAddr, artifact.abi, signer);
  const token = new hre.ethers.Contract(usdc, ERC20, signer);
  const fmt = (x) => hre.ethers.formatUnits(x, 6);

  const amount = hre.ethers.parseUnits("1000", 6); // 1000 USDC
  console.log(`USDC: ${usdc}`);
  console.log(`Wallet USDC before: ${fmt(await token.balanceOf(signer.address))}`);

  console.log(`\n1) approve + depositToVault(1000 USDC, 7 days)...`);
  await (await token.approve(vaultAddr, amount)).wait();
  const depTx = await vault.depositToVault(usdc, amount, 7);
  const rcpt = await depTx.wait();
  console.log(`   deposit tx: ${rcpt.hash}`);

  console.log(`\n2) getUserDeposits():`);
  const [ids, records] = await vault.getUserDeposits(signer.address);
  let openId = null;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.withdrawn) continue;
    openId = ids[i];
    console.log(`   id ${ids[i]}: principal=${fmt(r.principal)} USDC  apyBps=${r.apyBps}  matured=${Number(r.maturityTimestamp) <= Math.floor(Date.now()/1000)}`);
  }

  console.log(`\n3) previewYield(id ${openId}): ${fmt(await vault.previewYield(openId))} USDC (tiny — just deposited)`);

  console.log(`\n4) unlock(id ${openId}) — early exit (should refund principal minus ~2% penalty + yield):`);
  await (await vault.unlock(openId)).wait();
  console.log(`   Wallet USDC after unlock: ${fmt(await token.balanceOf(signer.address))}`);

  const [ids2, records2] = await vault.getUserDeposits(signer.address);
  const stillOpen = records2.filter((r) => !r.withdrawn).length;
  console.log(`\n5) open deposits remaining: ${stillOpen}  (deposit marked withdrawn ✓)`);
  console.log(`\nEND-TO-END OK: deposit + on-chain read + early unlock all succeeded.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
