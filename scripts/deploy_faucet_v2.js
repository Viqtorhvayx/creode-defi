import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GAS = { gasLimit: 2000000 };
const CLAIMS_RESERVE = 50n; // fund enough for ~50 claims per token

// ~$500 worth per token, in smallest units (reference prices the dapp uses).
const DRIP = {
  USDC:  500000000n,          // 500        (6dp, $1)
  USDT:  500000000n,          // 500        (6dp, $1)
  SAUCE: 16666666666n,        // ~16,667    (6dp, $0.03)
  PACK:  5000000000000n,      // 5,000,000  (6dp, $0.0001)
  JAM:   250000000000n,       // 250,000    (6dp, $0.002)
  WETH:  16666666n,           // ~0.1667    (8dp, $3000)
  WBTC:  833333n,             // ~0.0083    (8dp, $60000)
  BONZO: 1000000000000n,      // 1,000,000  (6dp, $0.0005)
};

const ERC20 = ["function balanceOf(address) view returns (uint256)"];

async function main() {
  await hre.run("compile");
  const book = JSON.parse(fs.readFileSync(path.join(__dirname, "hts_tokens.json")));
  const [signer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractAt("HtsTokenFactory", book.factory);
  console.log(`Signer: ${signer.address}\nFactory: ${book.factory}\n`);

  const syms = Object.keys(book.tokens);
  const addrs = syms.map((s) => book.tokens[s].address);
  const amounts = syms.map((s) => DRIP[s]);

  // 1) Deploy the per-token faucet.
  const Faucet = await hre.ethers.getContractFactory("CreodeFaucet");
  const faucet = await Faucet.deploy(addrs, amounts);
  await faucet.waitForDeployment();
  const faucetAddr = await faucet.getAddress();
  console.log(`New faucet: ${faucetAddr}\n`);

  // 2) Fund reserves; mint more of any token the factory is short on.
  for (const sym of syms) {
    const info = book.tokens[sym];
    const reserve = DRIP[sym] * CLAIMS_RESERVE;
    const token = new hre.ethers.Contract(info.address, ERC20, signer);
    const factoryBal = await token.balanceOf(book.factory);
    process.stdout.write(`${sym.padEnd(6)} reserve ${reserve} ... `);
    if (factoryBal < reserve) {
      const shortfall = reserve - factoryBal;
      await (await factory.mint(info.address, shortfall, GAS)).wait();
      process.stdout.write(`minted ${shortfall} ... `);
    }
    await (await factory.sendERC20(info.address, faucetAddr, reserve, GAS)).wait();
    console.log("funded");
  }

  // 3) Persist + export.
  const stack = JSON.parse(fs.readFileSync(path.join(__dirname, "hts_stack.json")));
  stack.faucet = faucetAddr;
  fs.writeFileSync(path.join(__dirname, "hts_stack.json"), JSON.stringify(stack, null, 2));
  const fArt = await hre.artifacts.readArtifact("CreodeFaucet");
  fs.writeFileSync(
    path.join(__dirname, "../frontend/src/contracts/CreodeFaucet.json"),
    JSON.stringify({ address: faucetAddr, abi: fArt.abi }, null, 2)
  );
  console.log(`\nFaucet: ${faucetAddr}  (saved + ABI exported)`);
}

main().catch((e) => { console.error("FAILED:", e.reason || e.shortMessage || e.message); process.exit(1); });
