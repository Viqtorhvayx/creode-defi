import { PrivateKey } from "@hashgraph/sdk";
import "dotenv/config";

async function verifyKey() {
    const keyString = process.env.HEDERA_PRIVATE_KEY;
    try {
        const privateKey = PrivateKey.fromStringECDSA(keyString);
        console.log(`Derived Public Key: 0x${privateKey.publicKey.toString()}`);
    } catch (error) {
        console.error("Error deriving key:", error);
    }
}

verifyKey();
