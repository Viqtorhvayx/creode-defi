import { Client, AccountBalanceQuery } from "@hashgraph/sdk";
import "dotenv/config";

async function checkBalance() {
    const client = Client.forTestnet();
    client.setOperator(process.env.HEDERA_ACCOUNT_ID, process.env.HEDERA_PRIVATE_KEY);
    
    try {
        const balance = await new AccountBalanceQuery()
            .setAccountId(process.env.HEDERA_ACCOUNT_ID)
            .execute(client);
        console.log(`Balance for ${process.env.HEDERA_ACCOUNT_ID}: ${balance.hbars.toString()}`);
    } catch (err) {
        console.error("Balance check failed:", err);
    }
}

checkBalance();
