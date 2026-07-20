import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/ScheduleSpike.sol/ScheduleSpike.json");

const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Deployer:", w.address);
  const spike = await new ethers.ContractFactory(art.abi, art.bytecode, w).deploy({ gasLimit: 1_500_000 });
  await spike.waitForDeployment();
  const addr = await spike.getAddress();
  console.log("ScheduleSpike:", addr);

  // Fund the contract so it can pay for the scheduled call's gas.
  await (await w.sendTransaction({ to: addr, value: ethers.parseEther("10"), gasLimit: 100_000 })).wait();
  console.log("Funded 10 HBAR. Contract balance:", ethers.formatEther(await p.getBalance(addr)));

  const c = new ethers.Contract(addr, art.abi, w);

  // 1) Capacity check (best-effort).
  try {
    const cap = await c.capacity.staticCall(90, 200_000);
    console.log("hasScheduleCapacity(90s, 200k gas):", cap);
  } catch (e) {
    console.log("capacity() call reverted:", e?.shortMessage || e?.reason || e?.message);
  }

  // 2) Schedule bump() ~90s out.
  const DELAY = 90;
  try {
    const tx = await c.kick(DELAY, 250_000, { gasLimit: 3_000_000 });
    const rcpt = await tx.wait();
    console.log("kick() mined in block", rcpt.blockNumber, "status", rcpt.status);
  } catch (e) {
    console.log("kick() FAILED:", e?.shortMessage || e?.reason || e?.message);
    console.log("=> hashio does not support HSS scheduleCall from a contract. Keep auto-compound as roadmap.");
    return;
  }

  const code = await c.lastResponseCode();
  const sched = await c.lastSchedule();
  const expiry = await c.lastScheduledFor();
  console.log("responseCode:", code.toString(), "(22 = SUCCESS)");
  console.log("schedule address:", sched);
  console.log("scheduled for (unix):", expiry.toString());

  if (code.toString() !== "22") {
    console.log("=> scheduleCall returned non-SUCCESS. Not usable. Keep roadmap.");
    return;
  }

  // 3) Wait past the expiry and check the counter bumped autonomously.
  const before = await c.counter();
  console.log("counter before:", before.toString(), "— waiting ~", DELAY + 25, "s for autonomous execution…");
  await sleep((DELAY + 25) * 1000);
  const after = await c.counter();
  console.log("counter after:", after.toString());

  if (after > before) {
    console.log("\n✅ HIP-1215 WORKS on testnet via hashio — the scheduled call executed itself.");
  } else {
    console.log("\n⚠️ scheduleCall succeeded but bump() did not fire in time. Either more delay is needed, the payer lacked funds, or relay execution lags. Investigate before wiring.");
  }
  console.log("SPIKE_RESULT", JSON.stringify({ addr, code: code.toString(), sched, executed: after > before }));
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
