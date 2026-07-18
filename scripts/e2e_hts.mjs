import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const vArt = require("../artifacts/contracts/CreodeVault.sol/CreodeVault.json");

const VAULT = "0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139";
const USDC = "0x000000000000000000000000000000000092e8A7";
const HBAR = "0x0000000000000000000000000000000000000000";
const ERC20 = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const vault = new ethers.Contract(VAULT, vArt.abi, w);
const usdc = new ethers.Contract(USDC, ERC20, w);

const openId = async () => {
  const [ids, recs] = await vault.getUserDeposits(w.address);
  for (let i = 0; i < recs.length; i++) if (!recs[i].withdrawn) return { id: ids[i], rec: recs[i] };
  return null;
};

console.log("=== config sanity ===");
console.log("treasury:", await vault.treasury());
console.log("hbarReserve:", ethers.formatEther(await vault.hbarReserve()), "HBAR");
console.log("quoteAPY USDC 30d:", (await vault.quoteAPY(USDC, 30)).toString(), "bps");
console.log("quoteAPY HBAR 30d:", (await vault.quoteAPY(HBAR, 30)).toString(), "bps");

console.log("\n=== NATIVE HBAR deposit 100 (7d) ===");
const hbarBefore = await p.getBalance(w.address);
await (await vault.depositToVault(HBAR, 0, 7, { value: ethers.parseEther("100"), gasLimit: 1500000 })).wait();
let o = await openId();
console.log(`  deposit id ${o.id}: token=${o.rec.token} principal=${ethers.formatEther(o.rec.principal)} HBAR (100 - 0.25% fee)`);
console.log("  unlock (early)...");
await (await vault.unlock(o.id, { gasLimit: 1500000 })).wait();
const hbarAfter = await p.getBalance(w.address);
console.log("  net HBAR change (deposit+unlock+gas):", ethers.formatEther(hbarAfter - hbarBefore));

console.log("\n=== HTS USDC deposit 100 (7d) ===");
const uBefore = await usdc.balanceOf(w.address);
await (await usdc.approve(VAULT, ethers.parseUnits("100", 6), { gasLimit: 1500000 })).wait();
await (await vault.depositToVault(USDC, ethers.parseUnits("100", 6), 7, { gasLimit: 1500000 })).wait();
o = await openId();
console.log(`  deposit id ${o.id}: principal=${ethers.formatUnits(o.rec.principal, 6)} USDC`);
// depositor==treasury clobbered the yield allowance; re-approve then unlock.
await (await usdc.approve(VAULT, 9_000_000_000_000_000_000n, { gasLimit: 1500000 })).wait();
console.log("  unlock (early)...");
await (await vault.unlock(o.id, { gasLimit: 1500000 })).wait();
const uAfter = await usdc.balanceOf(w.address);
console.log("  USDC net change:", ethers.formatUnits(uAfter - uBefore, 6), "(principal back minus ~2% penalty)");
const still = (await vault.getUserDeposits(w.address))[1].filter((r) => !r.withdrawn).length;
console.log("\n✅ open deposits remaining:", still, "— both native HBAR and HTS cycles work");
