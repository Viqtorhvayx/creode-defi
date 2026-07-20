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
const mirrorSchedule = async (evmAddr) => {
  const num = BigInt(evmAddr);
  const r = await fetch(`https://testnet.mirrornode.hedera.com/api/v1/schedules/0.0.${num}`).then((r) => r.json());
  return r.executed_timestamp;
};

async function main() {
  const VAULT = yv.address;
  console.log("Deployer:", w.address, "| YieldVault:", VAULT);

  const ac = await new ethers.ContractFactory(art.abi, art.bytecode, w).deploy(VAULT, { gasLimit: 3_000_000 });
  await ac.waitForDeployment();
  const addr = await ac.getAddress();
  console.log("CreodeAutoCompounder (batch):", addr);

  await (await w.sendTransaction({ to: addr, value: ethers.parseEther("25"), gasLimit: 100_000 })).wait();
  console.log("Funded 25 HBAR. Balance:", ethers.formatEther(await p.getBalance(addr)));

  const c = new ethers.Contract(addr, art.abi, w);

  // Verify with a short interval + small batch.
  await (await c.setMinInterval(60, { gasLimit: 120_000 })).wait();
  const STRAT = 0, INTERVAL = 60, COUNT = 3;
  console.log(`enroll(strategy ${STRAT}, ${INTERVAL}s, ${COUNT} compounds)…`);
  const rcpt = await (await c.enroll(STRAT, INTERVAL, COUNT, { gasLimit: 4_000_000 })).wait();

  // Collect scheduled addresses from events.
  const scheduled = [];
  for (const log of rcpt.logs) { try { const pl = c.interface.parseLog(log); if (pl?.name === "Scheduled") scheduled.push({ sched: pl.args.schedule, expiry: Number(pl.args.expiry) }); } catch {} }
  console.log("enroll status", rcpt.status, "| scheduled", scheduled.length, "compounds:", scheduled.map((s) => s.expiry).join(", "));

  const runs0 = Number(await c.totalRuns());
  console.log("totalRuns before:", runs0, "| first fires in ~60s. Waiting 150s to catch ≥2 autonomous runs…");
  await sleep(150_000);

  const runs1 = Number(await c.totalRuns());
  console.log("totalRuns after:", runs1);

  // Confirm on the mirror node that the first schedules actually executed.
  for (const s of scheduled.slice(0, 2)) {
    const ex = await mirrorSchedule(s.sched).catch(() => null);
    console.log(`  schedule ${s.sched} executed_timestamp:`, ex);
  }

  const works = runs1 > runs0;
  console.log(works
    ? `\n✅ BATCH AUTO-COMPOUND WORKS — ${runs1 - runs0} scheduled compound(s) executed autonomously on-chain.`
    : "\n⚠️ totalRuns did not increase — investigate.");

  // Export for the frontend.
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeAutoCompounder.json", outDir), JSON.stringify({ address: addr, abi: art.abi }, null, 2));
  fs.writeFileSync(new URL("./autocompounder.json", import.meta.url), JSON.stringify({ address: addr, vault: VAULT }, null, 2));
  console.log("Exported CreodeAutoCompounder.json");
  console.log("AC_RESULT", JSON.stringify({ addr, autonomousRuns: runs1 - runs0 }));
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
