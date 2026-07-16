/* * Developer: [Viqtorhvayx]
 * Script: Token Initializer
 * Description: Calls configureToken() on the deployed CreodeVault for each
 *              supported token. Must be run once after every fresh deployment.
 * Usage: node scripts/init_tokens.js <contractId>
 *        e.g. node scripts/init_tokens.js 0.0.1234567
 */

import {
    Client,
    PrivateKey,
    ContractExecuteTransaction,
    ContractFunctionParameters,
    ContractId,
    Hbar,
} from "@hashgraph/sdk";
import "dotenv/config";

// ─── Token EVM Addresses on Hedera Testnet ───────────────────────────────────
// These are the EVM-compatible 0x addresses for each HTS token.
// address(0) is used for native HBAR.
const TOKENS = [
    {
        name: "HBAR (native)",
        address: "0x0000000000000000000000000000000000000000",
        minDeposit: 100_0000_0000,  // 100 HBAR in tinybars (8 decimals)
        rate7D:  350,   // 3.50% APY
        rate30D: 550,   // 5.50% APY
        rate60D: 800,   // 8.00% APY
    },
    {
        name: "USDC",
        address: "0x0000000000000000000000000000000006F89AC", // 0.0.456858
        minDeposit: 10_000_000,  // 10 USDC (6 decimals)
        rate7D:  400,   // 4.00% APY
        rate30D: 650,   // 6.50% APY
        rate60D: 900,   // 9.00% APY
    },
    {
        name: "USDT",
        address: "0x0000000000000000000000000000000006602D4", // 0.0.105548
        minDeposit: 10_000_000,  // 10 USDT (6 decimals)
        rate7D:  400,
        rate30D: 650,
        rate60D: 900,
    },
    {
        name: "SAUCE",
        address: "0x00000000000000000000000000000000000B2FD5", // 0.0.731861
        minDeposit: 100_000_000,  // 100 SAUCE (6 decimals)
        rate7D:  800,   // 8.00% APY
        rate30D: 1400,  // 14.00% APY
        rate60D: 2200,  // 22.00% APY
    },
    {
        name: "PACK",
        address: "0x0000000000000000000000000000000049356A8", // 0.0.4794920
        minDeposit: 1_000_000_000, // 1000 PACK (6 decimals)
        rate7D:  800,
        rate30D: 1400,
        rate60D: 2200,
    },
    {
        name: "JAM",
        address: "0x000000000000000000000000000000000137D14", // 0.0.1278772
        minDeposit: 100_000_000,
        rate7D:  800,
        rate30D: 1400,
        rate60D: 2200,
    },
];

async function main() {
    const contractIdArg = process.argv[2];
    if (!contractIdArg) {
        console.error("Usage: node scripts/init_tokens.js <contractId>");
        console.error("Example: node scripts/init_tokens.js 0.0.1234567");
        process.exit(1);
    }

    const myAccountId = process.env.HEDERA_ACCOUNT_ID;
    const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        console.error("ERROR: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env");
        process.exit(1);
    }

    const client = Client.forTestnet();
    client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
    client.setDefaultMaxTransactionFee(new Hbar(10));

    const contractId = ContractId.fromString(contractIdArg);
    console.log(`Configuring tokens on contract: ${contractId}\n`);

    for (const token of TOKENS) {
        console.log(`Configuring ${token.name}...`);
        try {
            const tx = await new ContractExecuteTransaction()
                .setContractId(contractId)
                .setGas(200_000)
                .setFunction(
                    "configureToken",
                    new ContractFunctionParameters()
                        .addAddress(token.address)
                        .addUint256(token.minDeposit)
                        .addUint256(token.rate7D)
                        .addUint256(token.rate30D)
                        .addUint256(token.rate60D)
                )
                .execute(client);

            const receipt = await tx.getReceipt(client);
            console.log(`  ✓ ${token.name} configured. Status: ${receipt.status}`);
        } catch (err) {
            console.error(`  ✗ Failed to configure ${token.name}:`, err.message);
        }
    }

    console.log("\nAll tokens initialized. Vault is ready to accept deposits.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
