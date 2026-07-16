/* * Developer: [Viqtorhvayx]
 * Script: One-Click Hedera Contract Deployer (Fixed)
 * Description: Compiles Vault.sol (with import resolution) and deploys to Hedera Testnet.
 *              Treasury address is passed as constructor argument.
 */

import { 
    Client, 
    PrivateKey, 
    ContractCreateFlow,
    ContractFunctionParameters,
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
const contractsDir = path.join(__dirname, '..', 'contracts');

// FIX #3: findImports callback so solc can resolve "./interfaces/IERC20.sol"
function findImports(importPath) {
    const fullPath = path.join(contractsDir, importPath);
    try {
        return { contents: fs.readFileSync(fullPath, 'utf8') };
    } catch (e) {
        return { error: `File not found: ${importPath}` };
    }
}

async function main() {
    // 1. VALIDATE CREDENTIALS
    const myAccountId = process.env.HEDERA_ACCOUNT_ID;
    const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;
    const treasuryAddress = process.env.TREASURY_WALLET;

    if (!myAccountId || !myPrivateKey) {
        console.error("ERROR: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env");
        process.exit(1);
    }

    if (!treasuryAddress || !treasuryAddress.startsWith('0x')) {
        console.error("ERROR: TREASURY_WALLET must be a valid EVM address (0x...) in .env");
        process.exit(1);
    }

    // 2. COMPILE THE CONTRACT
    console.log("Compiling CreodeVault.sol...");
    const contractPath = path.join(contractsDir, "CreodeVault.sol");
    const source = fs.readFileSync(contractPath, "utf8");

    const input = {
        language: 'Solidity',
        sources: {
            'CreodeVault.sol': { content: source },
        },
        settings: {
            outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } },
        },
    };

    // FIX #3: Pass findImports as the second argument
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    if (output.errors) {
        output.errors.forEach((err) => {
            if (err.severity === 'error') {
                console.error(err.formattedMessage);
            } else {
                console.warn(err.formattedMessage);
            }
        });
        if (output.errors.some(err => err.severity === 'error')) {
            process.exit(1);
        }
    }

    const contractData = output.contracts['CreodeVault.sol']['CreodeVault'];
    if (!contractData) {
        console.error("ERROR: Could not find CreodeVault in compile output.");
        process.exit(1);
    }

    const abi = contractData.abi;
    const bytecode = contractData.evm.bytecode.object;
    console.log("Compilation successful!");

    // 3. DEPLOY TO HEDERA
    const client = Client.forTestnet();
    client.setOperator(myAccountId, PrivateKey.fromStringECDSA(myPrivateKey));
    client.setDefaultMaxTransactionFee(new Hbar(100));

    console.log("Checking operator balance...");
    const balance = await new AccountBalanceQuery()
        .setAccountId(myAccountId)
        .execute(client);
    console.log(`Operator Balance: ${balance.hbars.toString()}`);

    console.log(`Deploying CreodeVault with treasury: ${treasuryAddress}`);

    // FIX #2: Pass the treasury address as a constructor parameter
    const contractCreate = new ContractCreateFlow()
        .setGas(3000000)
        .setBytecode(bytecode)
        .setConstructorParameters(
            new ContractFunctionParameters().addAddress(treasuryAddress)
        );

    const txResponse = await contractCreate.execute(client);
    const receipt = await txResponse.getReceipt(client);
    
    const newContractId = receipt.contractId;
    const evmAddress = `0x${newContractId.toSolidityAddress()}`;

    console.log("--------------------------------------------------");
    console.log("DEPLOYMENT SUCCESSFUL");
    console.log(`Contract ID:  ${newContractId}`);
    console.log(`EVM Address:  ${evmAddress}`);
    console.log("--------------------------------------------------");
    console.log(`\nNext step: Update .env NEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`);
    console.log(`Then run:   node scripts/init_tokens.js ${newContractId}`);

    // 4. SAVE ARTIFACTS FOR FRONTEND
    const artifactsDir = path.join(__dirname, "../frontend/src/contracts");
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const artifactPath = path.join(artifactsDir, "CreodeVault.json");
    fs.writeFileSync(artifactPath, JSON.stringify({ address: evmAddress, abi }, null, 2));
    console.log(`ABI and Address saved to: ${artifactPath}`);

    // 5. Auto-update .env NEXT_PUBLIC_VAULT_ADDRESS
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(
        /NEXT_PUBLIC_VAULT_ADDRESS=.*/,
        `NEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`
    );
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env: NEXT_PUBLIC_VAULT_ADDRESS=${evmAddress}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
