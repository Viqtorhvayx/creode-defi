import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeCompoundScheduler.sol/CreodeCompoundScheduler.json");
const yv = require("../frontend/src/contracts/CreodeYieldVaultV3.json");

const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const VAULT = yv.address;
  console.log("Deployer:", w.address, "| bal:", ethers.formatEther(await p.getBalance(w.address)), "| Vault:", VAULT);

  const s = await new ethers.ContractFactory(art.abi, art.bytecode, w).deploy(VAULT, { gasLimit: 2_800_000 });
  await s.waitForDeployment();
  const addr = await s.getAddress();
  console.log("CreodeCompoundScheduler:", addr);

  await (await w.sendTransaction({ to: addr, value: ethers.parseEther("12"), gasLimit: 100_000 })).wait();
  console.log("Funded 12 HBAR. Balance:", ethers.formatEther(await p.getBalance(addr)));

  const c = new ethers.Contract(addr, art.abi, w);

  // A user enrolls (cheap, no scheduling).
  await (await c.enroll(0, { gasLimit: 300_000 })).wait();
  console.log("enrolled deployer in strategy 0 | subs:", (await c.subsCount()).toString());

  // Keep the verify tick cheap (deployer has no position → compound no-ops).
  await (await c.setTickGasLimit(1_500_000, { gasLimit: 120_000 })).wait();

  // Treasury schedules 2 ticks, 60s apart.
  const rc = await (await c.scheduleTicks(2, 60, { gasLimit: 4_000_000 })).wait();
  console.log("scheduleTicks status", rc.status, "| scheduledUntil:", (await c.scheduledUntil()).toString());

  const t0 = Number(await c.tickCount());
  console.log("tickCount before:", t0, "— waiting 160s for autonomous ticks…");
  await sleep(160_000);
  const t1 = Number(await c.tickCount());
  console.log("tickCount after:", t1, "| autonomous ticks:", t1 - t0);

  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeCompoundScheduler.json", outDir), JSON.stringify({ address: addr, abi: art.abi }, null, 2));
  fs.writeFileSync(new URL("./scheduler.json", import.meta.url), JSON.stringify({ address: addr, vault: VAULT }, null, 2));
  console.log(t1 > t0
    ? `\n✅ PROTOCOL COMPOUND-TICK WORKS — ${t1 - t0} tick(s) executed autonomously on-chain.`
    : "\n⚠️ tickCount did not advance — investigate.");
  console.log("SCHED_RESULT", JSON.stringify({ addr, autonomousTicks: t1 - t0 }));
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
