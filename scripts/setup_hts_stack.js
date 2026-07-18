import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HBAR = "0x0000000000000000000000000000000000000000";
const MAX_UINT = (2n ** 256n) - 1n;

// minDeposit (whole units unless minRaw given) + APY tiers (BPS).
const CFG = {
  USDC:  { minWhole: 10n,     t: [400, 650, 900] },
  USDT:  { minWhole: 10n,     t: [400, 650, 900] },
  SAUCE: { minWhole: 200n,    t: [800, 1400, 2200] },
  PACK:  { minWhole: 100000n, t: [800, 1400, 2200] },
  JAM:   { minWhole: 2000n,   t: [800, 1400, 2200] },
  WETH:  { minRaw: 300000n,   t: [350, 550, 800] },
  WBTC:  { minRaw: 15000n,    t: [350, 550, 800] },
  BONZO: { minWhole: 200000n, t: [800, 1400, 2200] },
};

const ERC20 = [
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];

async function main() {
  const book = JSON.parse(fs.readFileSync(path.join(__dirname, "hts_tokens.json")));
  const [signer] = await hre.ethers.getSigners();
  const treasury = signer.address;
  console.log(`Treasury/admin: ${treasury}`);
  console.log(`Factory: ${book.factory}\n`);

  const factory = await hre.ethers.getContractAt("HtsTokenFactory", book.factory);
  const tokenAddrs = Object.values(book.tokens).map((t) => t.address);

  // 1) Deploy new vault (native HBAR + HTS) and faucet.
  const Vault = await hre.ethers.getContractFactory("CreodeVault");
  const vault = await Vault.deploy(treasury, treasury);
  await vault.waitForDeployment();
  const vaultAddr = await vault.getAddress();
  console.log(`Vault: ${vaultAddr}`);

  const Faucet = await hre.ethers.getContractFactory("CreodeFaucet");
  const faucet = await Faucet.deploy(tokenAddrs);
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();
  console.log(`Faucet: ${faucetAddr}\n`);

  // 2) Distribute supply from the factory: reserve to faucet + treasury EOA.
  for (const [sym, info] of Object.entries(book.tokens)) {
    const unit = 10n ** BigInt(info.decimals);
    process.stdout.write(`Distributing ${sym}... `);
    await (await factory.sendERC20(info.address, faucetAddr, 5_000_000n * unit)).wait();
    await (await factory.sendERC20(info.address, treasury, 2_000_000n * unit)).wait();
    console.log("faucet+treasury funded");
  }
  console.log("");

  // 3) Configure vault: 8 HTS tokens + native HBAR.
  for (const [sym, info] of Object.entries(book.tokens)) {
    const cfg = CFG[sym];
    const unit = 10n ** BigInt(info.decimals);
    const minRaw = cfg.minRaw ?? cfg.minWhole * unit;
    process.stdout.write(`Config ${sym} (min ${minRaw})... `);
    await (await vault.configureToken(info.address, minRaw, cfg.t[0], cfg.t[1], cfg.t[2])).wait();
    // Treasury approves the vault to pull yield.
    const token = new hre.ethers.Contract(info.address, ERC20, signer);
    await (await token.approve(vaultAddr, MAX_UINT)).wait();
    console.log("configured + approved");
  }

  // Native HBAR (weibar has 18 decimals): min 100 HBAR, blue-chip tiers.
  process.stdout.write("Config native HBAR (min 100)... ");
  await (await vault.configureToken(HBAR, 10000000000n, 350, 550, 800)).wait();
  console.log("configured");

  // 4) Fund the vault's HBAR reserve for native-HBAR yield payouts.
  process.stdout.write("Funding vault HBAR reserve (150 HBAR)... ");
  await (await vault.fundHbarReserve({ value: hre.ethers.parseEther("150") })).wait();
  console.log("done\n");

  // 5) Persist + export ABIs to the frontend.
  const outBook = { vault: vaultAddr, faucet: faucetAddr, factory: book.factory, hbar: HBAR, tokens: book.tokens };
  fs.writeFileSync(path.join(__dirname, "hts_stack.json"), JSON.stringify(outBook, null, 2));

  const vArt = await hre.artifacts.readArtifact("CreodeVault");
  const fArt = await hre.artifacts.readArtifact("CreodeFaucet");
  const cdir = path.join(__dirname, "../frontend/src/contracts");
  fs.writeFileSync(path.join(cdir, "CreodeVault.json"), JSON.stringify({ address: vaultAddr, abi: vArt.abi, bytecode: vArt.bytecode }, null, 2));
  fs.writeFileSync(path.join(cdir, "CreodeFaucet.json"), JSON.stringify({ address: faucetAddr, abi: fArt.abi }, null, 2));
  fs.writeFileSync(path.join(__dirname, "../frontend/src/context/abis.json"), JSON.stringify({ CreodeVault: vArt.abi }, null, 2));

  console.log("Saved -> scripts/hts_stack.json + frontend ABIs");
  console.log("\n=== ADDRESSES ===");
  console.log("VAULT :", vaultAddr);
  console.log("FAUCET:", faucetAddr);
  for (const [sym, info] of Object.entries(book.tokens)) console.log(sym.padEnd(6), info.address, info.tokenId);
}

main().catch((e) => { console.error("FAILED:", e.reason || e.shortMessage || e.message); process.exit(1); });
