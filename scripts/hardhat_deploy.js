import hre from "hardhat";

async function main() {
  console.log("Deploying Vault with Hardhat...");
  const Vault = await hre.ethers.getContractFactory("Vault");
  const vault = await Vault.deploy();

  await vault.waitForDeployment();

  console.log("--------------------------------------------------");
  console.log("🚀 DEPLOYMENT SUCCESSFUL");
  console.log("Contract Address:", await vault.getAddress());
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
