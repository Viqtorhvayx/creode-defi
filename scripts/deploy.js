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
    const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;

    if (!myAccountId || !myPrivateKey) {
        console.error("ERROR: Please provide HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in your .env file or environment.");
        process.exit(1);
    }

    // 2. COMPILE THE CONTRACT
    console.log("Compiling CreodeVault.sol...");
    const contractPath = path.join(__dirname, "../contracts/CreodeVault.sol");
    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: 'Solidity',
        sources: {
            'CreodeVault.sol': {
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

    const contractData = output.contracts['CreodeVault.sol']['CreodeVault'];
    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;

    console.log("Compilation successful!");

    // 3. DEPLOY TO HEDERA
    const client = Client.forTestnet();
    // Use fromString to handle Hex, DER, or Mnemonic
    client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
    client.setDefaultMaxTransactionFee(new Hbar(100));

    console.log("Checking operator balance...");
    const balance = await new AccountBalanceQuery()
        .setAccountId(myAccountId)
        .execute(client);
    console.log(`Operator Balance: ${balance.hbars.toString()}`);

    console.log("Deploying CreodeVault to Hedera Testnet...");

    const contractCreate = new ContractCreateFlow()
        .setGas(3000000)
        .setBytecode(bytecode);

    const txResponse = await contractCreate.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    const newContractId = receipt.contractId;
    const evmAddress = `0x${newContractId.toSolidityAddress()}`;

    console.log("--------------------------------------------------");
    console.log("🚀 DEPLOYMENT SUCCESSFUL");
    console.log(`Contract ID: ${newContractId}`);
    console.log(`EVM Address: ${evmAddress}`);
    console.log("--------------------------------------------------");

    // 4. SAVE ARTIFACTS FOR FRONTEND
    const artifactsDir = path.join(__dirname, "../frontend/src/contracts");
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const artifactPath = path.join(artifactsDir, "CreodeVault.json");
    fs.writeFileSync(artifactPath, JSON.stringify({
        address: evmAddress,
        abi: abi
    }, null, 2));

    console.log(`ABI and Address saved to: ${artifactPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
