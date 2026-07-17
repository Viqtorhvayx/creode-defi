import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Compiling contracts...");
    await hre.run("compile");

    const treasuryAddress = process.env.TREASURY_WALLET;
    if (!treasuryAddress || !treasuryAddress.startsWith('0x')) {
        console.error("ERROR: TREASURY_WALLET must be set in .env");
        process.exit(1);
    }

    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        console.error("ERROR: No signers found. Make sure HEDERA_PRIVATE_KEY is in .env");
        process.exit(1);
    }
    const deployer = signers[0];
    
    console.log(`Deploying CreodeVault with operator: ${deployer.address}`);
    console.log(`Using treasury: ${treasuryAddress}`);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log(`Operator Balance: ${hre.ethers.formatEther(balance)} HBAR`);

    if (balance === 0n) {
        console.error(`ERROR: Operator balance is 0. Please fund ${deployer.address} at https://faucet.hedera.com/`);
        process.exit(1);
    }

    // Admin (DEFAULT_ADMIN_ROLE) defaults to the deployer; override with ADMIN_WALLET
    // (e.g. a multi-sig) in .env for production.
    const adminAddress = process.env.ADMIN_WALLET && process.env.ADMIN_WALLET.startsWith('0x')
        ? process.env.ADMIN_WALLET
        : deployer.address;
    console.log(`Using admin (DEFAULT_ADMIN_ROLE): ${adminAddress}`);

    const CreodeVault = await hre.ethers.getContractFactory("CreodeVault");

    // Deploying... constructor(address _admin, address _treasury)
    const vault = await CreodeVault.deploy(adminAddress, treasuryAddress);
    await vault.waitForDeployment();
    
    const evmAddress = await vault.getAddress();

    console.log("--------------------------------------------------");
    console.log("DEPLOYMENT SUCCESSFUL");
    console.log(`EVM Address:  ${evmAddress}`);
    console.log("--------------------------------------------------");
    console.log(`\nNext step: Run node scripts/init_tokens.js ${evmAddress}`);

    // Save artifacts for frontend
    const artifactsDir = path.join(__dirname, "../frontend/src/contracts");
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const artifactPath = path.join(artifactsDir, "CreodeVault.json");
    
    // Extract ABI
    const artifact = await hre.artifacts.readArtifact("CreodeVault");
    fs.writeFileSync(artifactPath, JSON.stringify({ address: evmAddress, abi: artifact.abi }, null, 2));
    console.log(`ABI and Address saved to: ${artifactPath}`);

    // Auto-update .env NEXT_PUBLIC_VAULT_ADDRESS
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('NEXT_PUBLIC_VAULT_ADDRESS=')) {
            envContent = envContent.replace(
                /NEXT_PUBLIC_VAULT_ADDRESS=.*/,
                `NEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`
            );
        } else {
            envContent += `\nNEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log(`Updated .env: NEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
