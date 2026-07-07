import { PrivateKey } from "@hashgraph/sdk";
import "dotenv/config";

async function verifyKey() {
    const keyString = process.env.HEDERA_PRIVATE_KEY.startsWith("0x") 
        ? process.env.HEDERA_PRIVATE_KEY.slice(2) 
        : process.env.HEDERA_PRIVATE_KEY;
    
    try {
        const privKey = PrivateKey.fromStringECDSA(keyString);
        const pubKey = privKey.publicKey;
        const evmAddress = pubKey.toEvmAddress();
        console.log("Derived EVM Address:", evmAddress);
    } catch (err) {
        console.error("Key derivation failed:", err);
    }
}

verifyKey();
