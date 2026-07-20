import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeAutoCompounder.sol/CreodeAutoCompounder.json");
const yv = require("../frontend/src/contracts/CreodeYieldVaultV3.json");

const ADDR = "0x80a20857054C1F76dC7961f1D9263110b74b3d61"; // already deployed
const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const c = new ethers.Contract(ADDR, art.abi, w);
  console.log("AutoCompounder:", ADDR);

  const bal = await p.getBalance(ADDR);
  if (bal < ethers.parseEther("8")) {
    await (await w.sendTransaction({ to: ADDR, value: ethers.parseEther("14"), gasLimit: 100_000 })).wait();
  }
  console.log("Balance:", ethers.formatEther(await p.getBalance(ADDR)), "HBAR");

  await (await c.setMinInterval(60, { gasLimit: 120_000 })).wait();

  const STRAT = 0, INTERVAL = 60;
  // If already enrolled from the failed run, skip enroll.
  const enrolled = await c.isEnrolled(w.address, STRAT);
  if (!enrolled) {
    const rcpt = await (await c.enroll(STRAT, INTERVAL, { gasLimit: 3_500_000 })).wait();
    console.log("enroll() status", rcpt.status);
  } else {
    console.log("already enrolled — reading current schedule");
  }

  let [e0] = await c.getEnrollment(w.address, STRAT);
  const firstNext = Number(e0.nextRun);
  console.log("nextRun (t0):", firstNext, "=", new Date(firstNext * 1000).toISOString());

  console.log("waiting ~105s for the scheduled run to fire and re-schedule…");
  await sleep(105_000);

  let [e1] = await c.getEnrollment(w.address, STRAT);
  const secondNext = Number(e1.nextRun);
  console.log("nextRun (after):", secondNext, "=", new Date(secondNext * 1000).toISOString());

  const advanced = secondNext > firstNext;
  console.log(advanced
    ? "\n✅ Scheduled run fired AND re-scheduled itself — auto-compound loop self-perpetuates on-chain."
    : "\n⚠️ nextRun did not advance. Investigate gas/interval.");

  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CreodeAutoCompounder.json", outDir), JSON.stringify({ address: ADDR, abi: art.abi }, null, 2));
  fs.writeFileSync(new URL("./autocompounder.json", import.meta.url), JSON.stringify({ address: ADDR, vault: yv.address }, null, 2));
  console.log("Exported CreodeAutoCompounder.json");
  console.log("AC_RESULT", JSON.stringify({ addr: ADDR, selfPerpetuates: advanced }));
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
