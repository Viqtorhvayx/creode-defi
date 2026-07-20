import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const codeArt = require("../artifacts/contracts/CodeToken.sol/CodeToken.json");
const govArt = require("../artifacts/contracts/CreodeGovernance.sol/CreodeGovernance.json");

const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  console.log("Deployer/treasury:", w.address);

  // 1) CODE governance token (treasury = deployer, seeded 1,000,000 CODE).
  const code = await new ethers.ContractFactory(codeArt.abi, codeArt.bytecode, w).deploy(w.address, { gasLimit: 2_500_000 });
  await code.waitForDeployment();
  const codeAddr = await code.getAddress();
  console.log("CodeToken (CODE):", codeAddr);

  // 2) Governance bound to the CODE token.
  const gov = await new ethers.ContractFactory(govArt.abi, govArt.bytecode, w).deploy(codeAddr, { gasLimit: 3_500_000 });
  await gov.waitForDeployment();
  const govAddr = await gov.getAddress();
  console.log("CreodeGovernance:", govAddr);

  const govW = new ethers.Contract(govAddr, govArt.abi, w);

  // ── Seed two already-decided proposals (short window → finalize now). ─────
  console.log("Seeding recent decisions (60s window)…");
  await (await govW.setVotingPeriod(60, { gasLimit: 200_000 })).wait();
  const decided = [
    ["Reduce HBAR early-unstake penalty to 1.5%", "Lower the maximum early-withdrawal penalty on HBAR Vault positions from 2.0% to 1.5% to improve capital flexibility while still discouraging churn."],
    ["Add DOVU to the time-locked Vault", "Add DOVU to the Ecosystem tier of the time-locked Vault with the standard 8% / 14% / 22% APY schedule for 7 / 30 / 60-day locks."],
  ];
  for (const [title, desc] of decided) {
    await (await govW.propose(title, desc, { gasLimit: 900_000 })).wait();
    console.log("  + decided:", title);
  }
  let count = Number(await govW.proposalCount());
  const decidedIds = [count - 2, count - 1];
  for (const id of decidedIds) {
    await (await govW.castVote(id, true, { gasLimit: 300_000 })).wait();
    console.log("  voted YES on", id);
  }
  console.log("  waiting for the 60s window to close…");
  await sleep(66_000);
  for (const id of decidedIds) {
    await (await govW.finalize(id, { gasLimit: 300_000 })).wait();
    const st = Number(await govW.stateOf(id));
    console.log("  finalized", id, "state", st, "(1=Passed)");
  }

  // ── Three live proposals, standard 3-day window, awaiting community votes. ─
  await (await govW.setVotingPeriod(259200, { gasLimit: 200_000 })).wait();
  const actives = [
    ["Increase SAUCE-USDC farm rewards by 5%", "Raise emissions on the SAUCE-USDC Yield Hub strategy by 5% for one epoch to bootstrap depth on the pair. Funded from the treasury emissions reserve."],
    ["Enable HIP-1215 auto-compounding for the Yield Hub", "Authorize wiring the Yield Hub to Hedera HIP-1215 generalized scheduled contract calls so positions compound natively on-chain with no off-chain keeper, starting with the blue-chip strategies."],
    ["List WBTC-HBAR as a new P2P market", "Add WBTC-HBAR to the P2P order book so users can trade the pair directly against HBAR rather than routing through USDC."],
  ];
  for (const [title, desc] of actives) {
    await (await govW.propose(title, desc, { gasLimit: 900_000 })).wait();
    console.log("  + active:", title);
  }

  // ── Export to the frontend. ───────────────────────────────────────────────
  const outDir = new URL("../frontend/src/contracts/", import.meta.url);
  fs.writeFileSync(new URL("CodeToken.json", outDir), JSON.stringify({ address: codeAddr, abi: codeArt.abi }, null, 2));
  fs.writeFileSync(new URL("CreodeGovernance.json", outDir), JSON.stringify({ address: govAddr, abi: govArt.abi }, null, 2));
  fs.writeFileSync(new URL("./governance.json", import.meta.url), JSON.stringify({ code: codeAddr, governance: govAddr }, null, 2));
  console.log("Exported CodeToken.json + CreodeGovernance.json");
  console.log("DONE. CODE:", codeAddr, "GOV:", govAddr);
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
