import hre from "hardhat";
import "dotenv/config";

/**
 * Run this ONCE per HTS token (and again if the allowance runs low) using the
 * TREASURY wallet's own private key — NOT the deployer key.
 *
 * CreodeVault now pulls accrued yield straight out of the Treasury account for
 * HTS tokens via `IERC20(token).transferFrom(treasury, user, yieldAmount)` on
 * withdraw(). That only works if the Treasury has approved the Vault contract
 * to spend its tokens. This script sets/refreshes that approval.
 *
 * Native HBAR is NOT covered by this script — HBAR yield still pays out of the
 * Vault's own balance (see the contract-level comment in CreodeVault.sol for why).
 *
 * Usage:
 *   TREASURY_PRIVATE_KEY=... node scripts/approve_treasury_yield.js
 *
 * Requires in .env:
 *   NEXT_PUBLIC_VAULT_ADDRESS   - the deployed CreodeVault address
 *   TREASURY_PRIVATE_KEY        - the Treasury wallet's private key
 */

// Same HTS token list as scripts/init_tokens.js (native HBAR intentionally excluded).
const HTS_TOKENS = [
    { name: "USDC",  address: "0x000000000000000000000000000000000006f89a" },
    { name: "USDT",  address: "0x0000000000000000000000000000000000019c4c" },
    { name: "WETH",  address: "0x00000000000000000000000000000000000D235E" },
    { name: "WBTC",  address: "0x00000000000000000000000000000000001008C6" },
    { name: "SAUCE", address: "0x00000000000000000000000000000000000b2ad5" },
    { name: "PACK",  address: "0x0000000000000000000000000000000000492a28" },
    // !!! PLACEHOLDER — confirm the real Hedera EVM address before relying on this.
    { name: "BONZO", address: "0x00000000000000000000000000000000016450E2" },
    { name: "JAM",   address: "0x0000000000000000000000000000000000138334" },
];

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
];

// Effectively-unlimited allowance so the Treasury doesn't need to keep re-approving.
const MAX_ALLOWANCE = (1n << 256n) - 1n;

async function main() {
    const vaultAddress = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
    if (!vaultAddress || !vaultAddress.startsWith('0x')) {
        console.error("ERROR: NEXT_PUBLIC_VAULT_ADDRESS not found in .env.");
        process.exit(1);
    }

    if (!process.env.TREASURY_PRIVATE_KEY) {
        console.error("ERROR: TREASURY_PRIVATE_KEY not found in .env. This must be the Treasury wallet's key, not the deployer's.");
        process.exit(1);
    }

    const provider = hre.ethers.provider;
    const treasurySigner = new hre.ethers.Wallet(process.env.TREASURY_PRIVATE_KEY, provider);
    console.log(`Using Treasury account: ${treasurySigner.address}`);
    console.log(`Approving Vault contract: ${vaultAddress}\n`);

    for (const token of HTS_TOKENS) {
        const contract = new hre.ethers.Contract(token.address, ERC20_ABI, treasurySigner);
        console.log(`Approving ${token.name}...`);
        try {
            const tx = await contract.approve(vaultAddress, MAX_ALLOWANCE);
            await tx.wait();
            console.log(`  ✓ ${token.name} approved.`);
        } catch (err) {
            console.error(`  ✗ Failed to approve ${token.name}:`, err.message || err);
        }
    }

    console.log("\nDone. The Vault can now pull yield for these tokens from the Treasury, as long as the Treasury actually holds enough balance to cover it.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
