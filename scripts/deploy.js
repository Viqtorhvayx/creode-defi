import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy CreodeXP
  const CreodeXP = await hre.ethers.getContractFactory("CreodeXP");
  const creodeXP = await CreodeXP.deploy();
  await creodeXP.waitForDeployment();
  const creodeXPAddress = await creodeXP.getAddress();
  console.log("CreodeXP deployed to:", creodeXPAddress);

  // 2. Deploy CreodeVault
  const Treasury = "0x0000000000000000000000000000000000000001"; // Placeholder Treasury
  const CreodeVault = await hre.ethers.getContractFactory("CreodeVault");
  const creodeVault = await CreodeVault.deploy(creodeXPAddress, Treasury);
  await creodeVault.waitForDeployment();
  const creodeVaultAddress = await creodeVault.getAddress();
  console.log("CreodeVault deployed to:", creodeVaultAddress);

  // Transfer ownership of CreodeXP to CreodeVault
  await creodeXP.transferOwnership(creodeVaultAddress);
  console.log("Ownership of CreodeXP transferred to CreodeVault");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
