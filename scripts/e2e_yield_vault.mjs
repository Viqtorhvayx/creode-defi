import "dotenv/config";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const art = require("../artifacts/contracts/CreodeYieldVault.sol/CreodeYieldVault.json");
const map = require("../frontend/src/contracts/yield_strategies.json");
const book = require("./hts_tokens.json");
const p = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
const treasury = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);
const usdc = book.tokens.USDC;
const ERC20 = ["function approve(address,uint256) returns (bool)","function transfer(address,uint256) returns (bool)","function balanceOf(address) view returns (uint256)"];
const f = (v) => ethers.formatUnits(v, usdc.decimals);

// fresh user wallet
const user = ethers.Wallet.createRandom().connect(p);
console.log("fresh user:", user.address);

// fund user with HBAR for gas + create account
console.log("fund user 8 HBAR...");
await (await treasury.sendTransaction({ to: user.address, value: ethers.parseEther("8"), gasLimit: 2000000 })).wait();
// send user 50 USDC
const tokenT = new ethers.Contract(usdc.address, ERC20, treasury);
console.log("send user 50 USDC...");
await (await tokenT.transfer(user.address, ethers.parseUnits("50", usdc.decimals), { gasLimit: 900000 })).wait();

const vaultU = new ethers.Contract(map.vault, art.abi, user);
const tokenU = new ethers.Contract(usdc.address, ERC20, user);
const amt = ethers.parseUnits("50", usdc.decimals);
console.log("user approves + deposits 50 USDC -> id4...");
await (await tokenU.approve(map.vault, amt, { gasLimit: 1000000 })).wait();
await (await vaultU.deposit(4, usdc.address, amt, { gasLimit: 1200000 })).wait();
console.log("user USDC after deposit:", f(await tokenU.balanceOf(user.address)));
console.log("pos principal:", f((await vaultU.getPosition(user.address, 4, usdc.address)).principal),
            "pendingYield:", f(await vaultU.pendingYield(user.address, 4, usdc.address)));
console.log("user withdrawsAll (principal from vault + yield from treasury, from!=to)...");
await (await vaultU.withdrawAll(4, usdc.address, { gasLimit: 1500000 })).wait();
console.log("user USDC after withdraw:", f(await tokenU.balanceOf(user.address)), "(should be > 50 by the yield)");
console.log("XACCT OK");
