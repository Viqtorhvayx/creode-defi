const { ethers } = require('ethers');
const fs = require('fs');
const d = ethers.Wallet.createRandom();
const t = ethers.Wallet.createRandom();
const env = `HEDERA_PRIVATE_KEY=${d.privateKey}
DEPLOYER_ADDRESS=${d.address}
TREASURY_WALLET=${t.address}
TREASURY_PRIVATE_KEY=${t.privateKey}
NEXT_PUBLIC_VAULT_ADDRESS=
`;
fs.writeFileSync('.env', env);
console.log('Generated .env');
console.log('Deployer:', d.address);
console.log('Treasury:', t.address);
