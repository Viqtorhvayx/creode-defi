/* * Developer: [Viqtorhvayx]
 * Script: One-Click Hedera Contract Deployer
 * Description: Deploys Vault.sol directly to Hedera Testnet using the Hashgraph SDK.
 */

const { 
    Client, 
    PrivateKey, 
    ContractCreateFlow 
} = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. CONFIGURE YOUR TESTNET CREDENTIALS HERE
    const myAccountId = "YOUR_TESTNET_ACCOUNT_ID"; // e.g. 0.0.12345
    const myPrivateKey = "YOUR_TESTNET_PRIVATE_KEY";

    if (!myAccountId || !myPrivateKey || myAccountId === "YOUR_TESTNET_ACCOUNT_ID") {
        console.error("ERROR: Please provide your Hedera Account ID and Private Key in deploy.js");
        process.exit(1);
    }

    const client = Client.forTestnet();
    client.setOperator(myAccountId, PrivateKey.fromString(myPrivateKey));

    // 2. READ THE BYTECODE
    // Note: You must compile Vault.sol to get the .bin file first.
    // Use 'solcjs --bin contracts/Vault.sol' to generate it.
    const bytecodePath = path.join(__dirname, "../contracts/Vault.bin");
    
    if (!fs.existsSync(bytecodePath)) {
        console.error("ERROR: Vault.bin not found. Please compile the contract first using:");
        console.log("npx solcjs --bin contracts/Vault.sol --base-path .");
        process.exit(1);
    }

    const contractBytecode = fs.readFileSync(bytecodePath);

    console.log("Deploying Vault to Hedera Testnet...");

    // ContractCreateFlow handles the multi-step process (file create + contract create)
    const contractCreate = new ContractCreateFlow()
        .setGas(500000)
        .setBytecode(contractBytecode);

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
