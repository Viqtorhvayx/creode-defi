// Server-side helpers for Hedera Consensus Service (HCS) protocol event
// logging. Creode submits a message to a dedicated HCS topic whenever a
// user's Vault deposit/exit, P2P order fill, or governance vote confirms
// on-chain — giving the protocol a tamper-evident, independently-verifiable
// audit trail that isn't tied to any single Mirror Node provider.
//
// Topic creation and message submission both require the native Hedera SDK
// talking gRPC to consensus nodes (there is no EVM/JSON-RPC equivalent for
// HCS, unlike HTS). This file must only run server-side (API routes) —
// never imported from client components — since it needs the operator
// private key.
import { Client, PrivateKey, AccountId, TopicMessageSubmitTransaction, TopicCreateTransaction } from '@hashgraph/sdk';
import hcsConfig from '../contracts/hcs_config.json';

export const HCS_TOPIC_ID: string = (hcsConfig as any).topicId || '';
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const MIRROR = `https://${NETWORK}.mirrornode.hedera.com/api/v1`;

function getOperatorClient(): Client {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  if (!accountId || !privateKey) throw new Error('HEDERA_ACCOUNT_ID / HEDERA_PRIVATE_KEY not configured on the server');
  const key = PrivateKey.fromStringECDSA(privateKey);
  return Client.forTestnet().setOperator(AccountId.fromString(accountId), key);
}

export interface ProtocolEvent {
  type: string;          // e.g. "Vault Deposit", "P2P Fill", "Governance Vote"
  detail: string;        // human-readable summary
  account: string;       // the acting wallet (EVM address)
  txHash?: string;       // the underlying contract-call transaction hash
  amount?: string;
  sym?: string;
}

/** Submit one protocol event to the HCS topic. Best-effort — callers should
 *  never let a logging failure block or roll back the real transaction. */
export async function logEvent(evt: ProtocolEvent): Promise<{ sequenceNumber: number; consensusTimestamp: string } | null> {
  if (!HCS_TOPIC_ID) return null;
  const client = getOperatorClient();
  try {
    const message = JSON.stringify({ ...evt, ts: Math.floor(Date.now() / 1000) });
    const tx = await new TopicMessageSubmitTransaction({ topicId: HCS_TOPIC_ID, message }).execute(client);
    const receipt = await tx.getReceipt(client);
    const record = await tx.getRecord(client);
    return {
      sequenceNumber: Number(receipt.topicSequenceNumber),
      consensusTimestamp: record.consensusTimestamp.toString(),
    };
  } finally {
    client.close();
  }
}

/** One-time setup: create the topic if it doesn't exist yet. Guarded by the
 *  caller (the /api/hcs/setup route checks HCS_TOPIC_ID is still empty). */
export async function createTopic(): Promise<string> {
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const client = getOperatorClient();
  try {
    const key = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);
    const tx = await new TopicCreateTransaction()
      .setTopicMemo('Creode Protocol Event Log (deposits, P2P fills, governance)')
      .setAdminKey(key.publicKey)
      .setSubmitKey(key.publicKey)
      .execute(client);
    const receipt = await tx.getReceipt(client);
    return receipt.topicId!.toString();
  } finally {
    client.close();
  }
}

export interface LoggedEvent extends ProtocolEvent {
  sequenceNumber: number;
  consensusTimestamp: string;
  ts: number;
}

/** Read back recent topic messages via the Mirror Node (plain HTTPS REST —
 *  no gRPC needed for reads), newest first. */
export async function fetchTopicMessages(limit = 25): Promise<LoggedEvent[]> {
  if (!HCS_TOPIC_ID) return [];
  const res = await fetch(`${MIRROR}/topics/${HCS_TOPIC_ID}/messages?limit=${limit}&order=desc`, { next: { revalidate: 5 } });
  if (!res.ok) return [];
  const data = await res.json();
  const out: LoggedEvent[] = [];
  for (const m of data.messages || []) {
    try {
      const decoded = JSON.parse(Buffer.from(m.message, 'base64').toString('utf8'));
      out.push({ ...decoded, sequenceNumber: m.sequence_number, consensusTimestamp: m.consensus_timestamp });
    } catch { /* skip malformed entries */ }
  }
  return out;
}
