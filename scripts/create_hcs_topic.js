// One-time setup: create the Hedera Consensus Service (HCS) topic Creode logs
// protocol events to (deposits, P2P fills, governance votes). Run once; the
// resulting topic ID is committed to frontend/src/contracts/hcs_config.json
// so both the logging API route and the read-back UI point at the same topic.
import { Client, PrivateKey, AccountId, TopicCreateTransaction } from '@hashgraph/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) {
    console.error('ERROR: HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env');
    process.exit(1);
  }

  const operatorKey = PrivateKey.fromStringECDSA(privateKey);
  const client = Client.forTestnet().setOperator(AccountId.fromString(accountId), operatorKey);

  console.log(`Creating HCS topic with operator ${accountId}...`);
  const tx = await new TopicCreateTransaction()
    .setTopicMemo('Creode Protocol Event Log (deposits, P2P fills, governance)')
    .setAdminKey(operatorKey.publicKey)
    .setSubmitKey(operatorKey.publicKey) // only our backend (holding this key) may log events
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId.toString();
  console.log(`Topic created: ${topicId}`);
  console.log(`View on HashScan: https://hashscan.io/testnet/topic/${topicId}`);

  const outPath = path.join(__dirname, '../frontend/src/contracts/hcs_config.json');
  fs.writeFileSync(outPath, JSON.stringify({
    topicId,
    network: 'testnet',
    memo: 'Creode Protocol Event Log (deposits, P2P fills, governance)',
  }, null, 2) + '\n');
  console.log(`Written to ${outPath}`);

  client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
