import { ethers } from "ethers";
import fs from "fs";
import "dotenv/config";

async function main() {
    const rpcUrl = "https://testnet.hashio.io/api";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const privateKey = process.env.HEDERA_PRIVATE_KEY.startsWith("0x") ? process.env.HEDERA_PRIVATE_KEY : "0x" + process.env.HEDERA_PRIVATE_KEY;
    const wallet = new ethers.Wallet(privateKey, provider);
    
    const vaultAddress = "0x0000000000000000000000000000000000873daf";
    const abiPath = "frontend/src/contracts/CreodeVault.json";
    const contractData = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const contract = new ethers.Contract(vaultAddress, contractData.abi, wallet);

    console.log("Checking maturity...");
    const vaultInfo = await contract.vaults(wallet.address);
    console.log("isMaturitySet:", vaultInfo.isMaturitySet);

    if (!vaultInfo.isMaturitySet) {
        console.log("Setting maturity...");
        try {
            const setTx = await contract.setMaturity(21n);
            await setTx.wait();
            console.log("Maturity set.");
        } catch (e) {
            console.error("Set Maturity failed:", e);
            return;
        }
    }

    console.log("Attempting deposit of 10 HBAR...");
    try {
        const amount = ethers.parseUnits("10", 8);
        const tx = await contract.deposit({ value: amount });
        const receipt = await tx.wait();
        console.log("Deposit successful:", receipt.hash);
    } catch (e) {
        console.error("Deposit failed:");
        console.error(e.reason || e.message || e);
    }
}

main().catch(console.error);
