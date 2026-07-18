import hre from "hardhat";

async function main() {
  await hre.run("compile");
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const Factory = await hre.ethers.getContractFactory("HtsTokenFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const fAddr = await factory.getAddress();
  console.log(`Factory: ${fAddr}`);

  // Fund the factory with HBAR so it can cover the HTS creation fee + auto-renew.
  console.log("Funding factory with 40 HBAR...");
  await (await deployer.sendTransaction({ to: fAddr, value: hre.ethers.parseEther("40") })).wait();

  // Create ONE proof token. Attach HBAR value for the creation fee.
  console.log("Creating HTS token TUSDC via precompile...");
  const tx = await factory.createToken("USD Coin", "USDC", 6, 1_000_000_000n, {
    value: hre.ethers.parseEther("30"),
    gasLimit: 900000,
  });
  const rcpt = await tx.wait();

  // Parse the TokenCreated event for the new token address.
  let tokenAddr = null;
  for (const log of rcpt.logs) {
    try {
      const parsed = factory.interface.parseLog(log);
      if (parsed && parsed.name === "TokenCreated") tokenAddr = parsed.args.token;
    } catch {}
  }
  console.log(`\n✅ Token created at EVM address: ${tokenAddr}`);
  if (tokenAddr) {
    const num = BigInt(tokenAddr);
    console.log(`   Hedera token id: 0.0.${num.toString()}`);
  }
}

main().catch((e) => { console.error("FAILED:", e.reason || e.shortMessage || e.message); process.exit(1); });
