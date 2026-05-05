import { Client, AccountBalanceQuery } from "@hashgraph/sdk";
import "dotenv/config";

async function checkBalance() {
    const client = Client.forTestnet();
    const myAccountId = "0.0.8665513";
    const myPrivateKey = process.env.HEDERA_PRIVATE_KEY;
    
    client.setOperator(myAccountId, myPrivateKey);

    try {
        const balance = await new AccountBalanceQuery()
            .setAccountId(myAccountId)
            .execute(client);
        console.log(`Balance for ${myAccountId}: ${balance.hbars.toString()}`);
    } catch (error) {
        console.error(`Error checking balance for ${myAccountId}:`, error);
    }
    process.exit(0);
}

checkBalance();
