import hre from "hardhat";
import "dotenv/config";

const TOKENS = [
    {
        name: "HBAR (native)",
        address: "0x0000000000000000000000000000000000000000",
        minDeposit: 10_000_000_000,  // 100 HBAR (8 decimals)
        rate7D:  350,   // 3.50% APY
        rate30D: 550,   // 5.50% APY
        rate60D: 800,   // 8.00% APY
    },
    {
        name: "USDC",
        address: "0x000000000000000000000000000000000006f89a", // 0.0.456858
        minDeposit: 10_000_000,  // 10 USDC (6 decimals)
        rate7D:  400,   // 4.00% APY
        rate30D: 650,   // 6.50% APY
        rate60D: 900,   // 9.00% APY
    },
    {
        name: "USDT",
        address: "0x0000000000000000000000000000000000019c4c", // 0.0.105548
        minDeposit: 10_000_000,  // 10 USDT (6 decimals)
        rate7D:  400,
        rate30D: 650,
        rate60D: 900,
    },
    {
        name: "WETH",
        address: "0x00000000000000000000000000000000000D235E",
        minDeposit: 300_000,  // 0.003 WETH (8 decimals)
        rate7D:  350,   // 3.50% APY
        rate30D: 550,   // 5.50% APY
        rate60D: 800,   // 8.00% APY
    },
    {
        name: "WBTC",
        address: "0x00000000000000000000000000000000001008C6",
        minDeposit: 15_000,  // 0.00015 WBTC (8 decimals)
        rate7D:  350,
        rate30D: 550,
        rate60D: 800,
    },
    {
        name: "SAUCE",
        address: "0x00000000000000000000000000000000000b2ad5", // 0.0.731861
        minDeposit: 200_000_000,  // 200 SAUCE (6 decimals)
        rate7D:  800,   // 8.00% APY
        rate30D: 1400,  // 14.00% APY
        rate60D: 2200,  // 22.00% APY
    },
    {
        name: "PACK",
        address: "0x0000000000000000000000000000000000492a28", // 0.0.4794920
        minDeposit: 100_000_000_000, // 100,000 PACK (6 decimals)
        rate7D:  800,
        rate30D: 1400,
        rate60D: 2200,
    },
    {
        name: "BONZO",
        // !!! PLACEHOLDER — confirm the real Hedera EVM address before running against mainnet/testnet.
        address: "0x00000000000000000000000000000000016450E2",
        minDeposit: 200_000_000_000, // 200,000 BONZO (6 decimals)
        rate7D:  800,
        rate30D: 1400,
        rate60D: 2200,
    },
    {
        name: "JAM",
        address: "0x0000000000000000000000000000000000138334", // 0.0.1278772
        minDeposit: 2_000_000_000, // 2,000 JAM (6 decimals)
        rate7D:  800,
        rate30D: 1400,
        rate60D: 2200,
    },
];

async function main() {
    const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
    if (!vaultAddress || !vaultAddress.startsWith('0x')) {
        console.error("ERROR: NEXT_PUBLIC_VAULT_ADDRESS not found in .env. Please run deploy.js first.");
        process.exit(1);
    }

    const signers = await hre.ethers.getSigners();
    if (signers.length === 0) {
        console.error("ERROR: No signers found. Make sure HEDERA_PRIVATE_KEY is in .env");
        process.exit(1);
    }
    const deployer = signers[0];
    console.log(`Using deployer: ${deployer.address}`);

    const CreodeVault = await hre.ethers.getContractFactory("CreodeVault");
    const vault = CreodeVault.attach(vaultAddress);

    console.log(`Configuring tokens on contract: ${vaultAddress}\n`);

    for (const token of TOKENS) {
        console.log(`Configuring ${token.name}...`);
        try {
            const tx = await vault.configureToken(
                token.address,
                token.minDeposit,
                token.rate7D,
                token.rate30D,
                token.rate60D
            );
            await tx.wait();
            console.log(`  ✓ ${token.name} configured.`);
        } catch (err) {
            console.error(`  ✗ Failed to configure ${token.name}:`, err.message || err);
        }
    }

    console.log("\nAll tokens initialized. Vault is ready to accept deposits.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
