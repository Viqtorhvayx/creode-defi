import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HBAR = "0x0000000000000000000000000000000000000000";
const MAX_UINT = (2n ** 256n) - 1n;
const GAS = { gasLimit: 2000000 };

const VAULT = "0x2fFd3ae1600465DaDa7BD69356d4352c42eCE139";
const FAUCET = "0xbaC03178715Ba054E1832dAE6b069e44234aa567";

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
const ERC20 = ["function approve(address,uint256) returns (bool)"];

async function main() {
  const book = JSON.parse(fs.readFileSync(path.join(__dirname, "hts_tokens.json")));
  const [signer] = await hre.ethers.getSigners();
  const vArt = await hre.artifacts.readArtifact("CreodeVault");
  const vault = new hre.ethers.Contract(VAULT, vArt.abi, signer);
  console.log(`Vault: ${VAULT}\nSigner: ${signer.address}\n`);

  for (const [sym, info] of Object.entries(book.tokens)) {
    const cfg = CFG[sym];
    const unit = 10n ** BigInt(info.decimals);
    const minRaw = cfg.minRaw ?? cfg.minWhole * unit;
    process.stdout.write(`Config ${sym} (min ${minRaw})... `);
    await (await vault.configureToken(info.address, minRaw, cfg.t[0], cfg.t[1], cfg.t[2], GAS)).wait();
    const token = new hre.ethers.Contract(info.address, ERC20, signer);
    await (await token.approve(VAULT, MAX_UINT, GAS)).wait();
    console.log("configured + approved");
  }

  process.stdout.write("Config native HBAR (min 100)... ");
  await (await vault.configureToken(HBAR, hre.ethers.parseEther("100"), 350, 550, 800, GAS)).wait();
  console.log("configured");

  process.stdout.write("Funding vault HBAR reserve (150 HBAR)... ");
  await (await vault.fundHbarReserve({ value: hre.ethers.parseEther("150"), gasLimit: 1000000 })).wait();
  console.log("done\n");

  // Persist + export ABIs to the frontend.
  const outBook = { vault: VAULT, faucet: FAUCET, factory: book.factory, hbar: HBAR, tokens: book.tokens };
  fs.writeFileSync(path.join(__dirname, "hts_stack.json"), JSON.stringify(outBook, null, 2));
  const fArt = await hre.artifacts.readArtifact("CreodeFaucet");
  const cdir = path.join(__dirname, "../frontend/src/contracts");
  fs.writeFileSync(path.join(cdir, "CreodeVault.json"), JSON.stringify({ address: VAULT, abi: vArt.abi, bytecode: vArt.bytecode }, null, 2));
  fs.writeFileSync(path.join(cdir, "CreodeFaucet.json"), JSON.stringify({ address: FAUCET, abi: fArt.abi }, null, 2));
  fs.writeFileSync(path.join(__dirname, "../frontend/src/context/abis.json"), JSON.stringify({ CreodeVault: vArt.abi }, null, 2));
  console.log("Saved hts_stack.json + frontend ABIs");
}

main().catch((e) => { console.error("FAILED:", e.reason || e.shortMessage || e.message); process.exit(1); });
