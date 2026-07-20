import "dotenv/config";
import fs from "fs";
import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const factoryArt = require("../artifacts/contracts/hts/HtsTokenFactory.sol/HtsTokenFactory.json");
const faucetArt = require("../frontend/src/contracts/CreodeFaucet.json");

const RPC = "https://testnet.hashio.io/api";
const p = new ethers.JsonRpcProvider(RPC);
const w = new ethers.Wallet(process.env.HEDERA_PRIVATE_KEY, p);

// DOVU test token — mirrors the real Hedera DOVU (~$0.0013). 6dp like our other HTS test tokens.
const DOVU = { name: "Dovu", symbol: "DOVU", decimals: 6, supplyWhole: 10_000_000n };
const DRIP = 400_000_000_000n; // ~400,000 DOVU (~$500) per claim, 6dp
const CLAIMS_RESERVE = 50n;

// Existing faucet drip amounts (from deploy_faucet_v2.js) so setTokens keeps them intact.
const EXISTING_DRIP = {
  USDC: 500000000n, USDT: 500000000n, SAUCE: 16666666666n, PACK: 5000000000000n,
  JAM: 250000000000n, WETH: 16666666n, WBTC: 833333n, BONZO: 1000000000000n,
};

const ERC20 = ["function balanceOf(address) view returns (uint256)"];
const GAS = { gasLimit: 2_000_000 };

async function main() {
  console.log("Treasury/owner:", w.address);
  const book = JSON.parse(fs.readFileSync(new URL("./hts_tokens.json", import.meta.url)));
  const factory = new ethers.Contract(book.factory, factoryArt.abi, w);
  console.log("Factory:", book.factory);

  // 1) Create the DOVU HTS token.
  const initialSupply = DOVU.supplyWhole * 10n ** BigInt(DOVU.decimals);
  process.stdout.write(`Creating HTS ${DOVU.symbol} (${DOVU.name}, ${DOVU.decimals}dp)... `);
  const tx = await factory.createToken(DOVU.name, DOVU.symbol, DOVU.decimals, initialSupply, {
    value: ethers.parseEther("25"), gasLimit: 2_500_000,
  });
  const rc = await tx.wait();
  let addr = null;
  for (const log of rc.logs) {
    try { const pl = factory.interface.parseLog(log); if (pl && pl.name === "TokenCreated") addr = pl.args.token; } catch {}
  }
  if (!addr) throw new Error("could not read TokenCreated address");
  const tokenId = `0.0.${BigInt(addr).toString()}`;
  console.log(`✓ ${addr}  (${tokenId})`);

  // 2) Fund the faucet reserve with DOVU (mint if short, then sendERC20).
  const faucetAddr = faucetArt.address;
  const reserve = DRIP * CLAIMS_RESERVE;
  const token = new ethers.Contract(addr, ERC20, w);
  const factoryBal = await token.balanceOf(book.factory);
  if (factoryBal < reserve) {
    const short = reserve - factoryBal;
    process.stdout.write(`minting ${short} extra DOVU... `);
    await (await factory.mint(addr, short, GAS)).wait();
    console.log("done");
  }
  process.stdout.write(`funding faucet ${faucetAddr} with ${reserve} DOVU... `);
  await (await factory.sendERC20(addr, faucetAddr, reserve, GAS)).wait();
  console.log("done");

  // 3) Register DOVU on the faucet (full token list so drips stay configured).
  const faucet = new ethers.Contract(faucetAddr, faucetArt.abi, w);
  const syms = Object.keys(book.tokens);
  const addrs = syms.map((s) => book.tokens[s].address).concat([addr]);
  const amounts = syms.map((s) => EXISTING_DRIP[s]).concat([DRIP]);
  process.stdout.write("faucet.setTokens(+DOVU)... ");
  await (await faucet.setTokens(addrs, amounts, GAS)).wait();
  console.log("done");

  // 4) Persist to hts_tokens.json + p2p_config.json.
  book.tokens.DOVU = { address: addr, tokenId, decimals: DOVU.decimals, name: DOVU.name };
  fs.writeFileSync(new URL("./hts_tokens.json", import.meta.url), JSON.stringify(book, null, 2));

  const cfgUrl = new URL("../frontend/src/contracts/p2p_config.json", import.meta.url);
  const cfg = JSON.parse(fs.readFileSync(cfgUrl));
  cfg.tokens.DOVU = { sym: "DOVU", address: addr, decimals: DOVU.decimals };
  if (!cfg.pairs.some((pr) => pr.base === "DOVU" && pr.quote === "USDC")) {
    cfg.pairs.push({ base: "DOVU", quote: "USDC" });
  }
  fs.writeFileSync(cfgUrl, JSON.stringify(cfg, null, 2));

  console.log("\nDOVU:", addr, tokenId);
  console.log("Updated hts_tokens.json + p2p_config.json");
}
main().catch((e) => { console.error(e?.shortMessage || e?.reason || e); process.exit(1); });
