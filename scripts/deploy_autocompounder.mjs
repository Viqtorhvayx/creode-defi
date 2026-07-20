import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeAutoCompounder.sol/CreodeAutoCompounder.json");
const yv = require("../frontend/src/contracts/CreodeYieldVaultV3.json");

const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const VAULT = yv.address;
  console.log("Deployer:", w.address, "\nYieldVault:", VAULT);

  const ac = await new ethers.ContractFactory(art.abi, art.bytecode, w).deploy(VAULT, { gasLimit: 2_500_000 });
  await ac.waitForDeployment();
  const addr = await ac.getAddress();
  console.log("CreodeAutoCompounder:", addr);

  // Fund gas reserve for scheduled calls.
  await (await w.sendTransaction({ to: addr, value: ethers.parseEther("40"), gasLimit: 100_000 })).wait();
  console.log("Funded 40 HBAR. Balance:", ethers.formatEther(await p.getBalance(addr)));

  const c = new ethers.Contract(addr, art.abi, w);

  // Test the self-perpetuating loop with a short interval.
  await (await c.setMinInterval(60, { gasLimit: 100_000 })).wait();
  const STRAT = 0, INTERVAL = 60;
  const tx = await c.enroll(STRAT, INTERVAL, { gasLimit: 3_500_000 });
  const rcpt = await tx.wait();
  console.log("enroll() mined, status", rcpt.status);

  let [e0] = await c.getEnrollment(w.address, STRAT);
  const firstNext = Number(e0.nextRun);
  console.log("enrollment.nextRun (t0):", firstNext);

  console.log("waiting ~100s for the scheduled run to fire and RE-schedule…");
  await sleep(100_000);

  let [e1] = await c.getEnrollment(w.address, STRAT);
  const secondNext = Number(e1.nextRun);
  console.log("enrollment.nextRun (after):", secondNext);

  const advanced = secondNext > firstNext;
  console.log(advanced
    ? "\n✅ Scheduled run fired AND re-scheduled itself — the auto-compound loop self-perpetuates."
    : "\n⚠️ nextRun did not advance — the scheduled run did not fire or did not re-schedule. Investigate gas/interval.");

  // Export for the frontend.
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeAutoCompounder.json", outDir), JSON.stringify({ address: addr, abi: art.abi }, null, 2));
  fs.writeFileSync(new URL("./autocompounder.json", import.meta.url), JSON.stringify({ address: addr, vault: VAULT }, null, 2));
  console.log("Exported CreodeAutoCompounder.json");
  console.log("AC_RESULT", JSON.stringify({ addr, selfPerpetuates: advanced }));
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
