import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dir, "..");
const SERVER = "https://sourcify.dev/server";
const CHAIN = 296;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// name, solPath (relative to repo), contractName, address
const CONTRACTS = [
  ["CreodeVault", "contracts/CreodeVault.sol", "CreodeVault", "0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139"],
  ["CreodeYieldVaultV3", "contracts/CreodeYieldVaultV3.sol", "CreodeYieldVaultV3", "0x634173A0B23bf9Bf36dD1545Ed3D95af3F0eDeF3"],
  ["CreodeSwapRouter", "contracts/CreodeSwapRouter.sol", "CreodeSwapRouter", "0x34624a10E293039c18724FFCb4e0431dA45DaED3"],
  ["CreodeTreasurySwap", "contracts/CreodeTreasurySwap.sol", "CreodeTreasurySwap", "0x2a873ED611D755e8B73E29a4839E34136e70eC53"],
  ["CreodeP2P", "contracts/CreodeP2P.sol", "CreodeP2P", "0x87b6de843538E31fc368e13BE232320915a734ef"],
  ["CreodeFaucet", "contracts/CreodeFaucet.sol", "CreodeFaucet", "0x2449135C532f78ed43C9c4a99307aAA987D39A41"],
  ["CreodeGovernance", "contracts/CreodeGovernance.sol", "CreodeGovernance", "0xe2f8e91fDCb1a6Ed20E7298A5D5619B4203C9Bd5"],
  ["CodeToken", "contracts/CodeToken.sol", "CodeToken", "0x8bb07F6C0b071b9981Ed9ba5D7635055c705BE82"],
  ["CreodeCompoundScheduler", "contracts/CreodeCompoundScheduler.sol", "CreodeCompoundScheduler", "0x2b8dB6baD3bC8Db02547dd9B4854a583CE625602"],
];

function loadBuildInfo(solPath, contractName) {
  const dbg = path.join(root, "artifacts", solPath, `${contractName}.dbg.json`);
  const rel = JSON.parse(fs.readFileSync(dbg, "utf8")).buildInfo;
  const biPath = path.resolve(path.dirname(dbg), rel);
  return JSON.parse(fs.readFileSync(biPath, "utf8"));
}

async function checkStatus(address) {
  const r = await fetch(`${SERVER}/v2/contract/${CHAIN}/${address}`);
  const j = await r.json();
  return j.match; // null | "exact_match" | "match"
}

async function verify([name, solPath, contractName, address]) {
  const pre = await checkStatus(address).catch(() => null);
  if (pre) return { name, address, result: `already ${pre}` };
  const bi = loadBuildInfo(solPath, contractName);
  const body = {
    stdJsonInput: bi.input,
    compilerVersion: bi.solcLongVersion,
    contractIdentifier: `${solPath}:${contractName}`,
  };
  const r = await fetch(`${SERVER}/v2/verify/${CHAIN}/${address}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const txt = await r.text();
  let j; try { j = JSON.parse(txt); } catch { return { name, address, result: `HTTP ${r.status}: ${txt.slice(0, 160)}` }; }
  if (!j.verificationId) return { name, address, result: `no job: ${JSON.stringify(j).slice(0, 200)}` };
  // poll
  for (let i = 0; i < 30; i++) {
    await sleep(2500);
    const pr = await fetch(`${SERVER}/v2/verify/${j.verificationId}`).then((x) => x.json());
    if (pr.isJobCompleted) {
      if (pr.error) return { name, address, result: `ERROR ${pr.error.customCode || ''}: ${pr.error.message?.slice(0, 160)}` };
      return { name, address, result: `verified: ${pr.contract?.match || 'ok'}` };
    }
  }
  return { name, address, result: "timeout polling" };
}

const only = process.argv[2];
const list = only ? CONTRACTS.filter((c) => c[0] === only) : CONTRACTS;
for (const c of list) {
  try { const res = await verify(c); console.log(`${res.name.padEnd(24)} ${res.address}  ->  ${res.result}`); }
  catch (e) { console.log(`${c[0].padEnd(24)} ${c[3]}  ->  EXC ${e.message?.slice(0, 160)}`); }
}
