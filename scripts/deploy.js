/* * Developer: [Viqtorhvayx]
 * Script: One-Click Hedera Contract Deployer
 * Description: Compiles Vault.sol and deploys directly to Hedera Testnet.
 */

import { 
    Client, 
    PrivateKey, 
    ContractCreateFlow,
    Hbar,
    AccountBalanceQuery
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import solc from "solc";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    // 1. CONFIGURE YOUR TESTNET CREDENTIALS HERE
    const myAccountId = process.env.HEDERA_ACCOUNT_ID;
    const myPrivateKey = process.env.HEDERA_PRIVATE_KEY.startsWith("0x") 
        ? process.env.HEDERA_PRIVATE_KEY.slice(2) 
        : process.env.HEDERA_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        console.error("ERROR: Please provide HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in your .env file or environment.");
        process.exit(1);
    }

    // 2. COMPILE THE CONTRACT
    console.log("Compiling Vault.sol...");
    const contractPath = path.join(__dirname, "../contracts/Vault.sol");
    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: 'Solidity',
        sources: {
            'Vault.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['abi', 'evm.bytecode'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        output.errors.forEach((err) => {
            console.error(err.formattedMessage);
        });
        if (output.errors.some(err => err.severity === 'error')) {
            process.exit(1);
        }
    }

    const contractData = output.contracts['Vault.sol']['Vault'];
    const bytecode = contractData.evm.bytecode.object;

    console.log("Compilation successful!");

    // 3. DEPLOY TO HEDERA
    const client = Client.forTestnet();
    client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
    client.setDefaultMaxTransactionFee(new Hbar(100)); // Ensure enough fee for file creation + deployment

    console.log("Checking operator balance...");
    const balance = await new AccountBalanceQuery()
        .setAccountId(myAccountId)
        .execute(client);
    console.log(`Operator Balance: ${balance.hbars.toString()}`);

    console.log("Deploying Vault to Hedera Testnet...");

    const contractCreate = new ContractCreateFlow()
        .setGas(2000000)
        .setBytecode(bytecode);

    const txResponse = await contractCreate.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    const newContractId = receipt.contractId;
    const evmAddress = newContractId.toSolidityAddress();

    console.log("--------------------------------------------------");
    console.log("🚀 DEPLOYMENT SUCCESSFUL");
    console.log(`Contract ID: ${newContractId}`);
    console.log(`EVM Address: 0x${evmAddress}`);
    console.log("--------------------------------------------------");
    console.log("Next Step: Copy the EVM Address above and paste it into useCreodeVault.ts");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
