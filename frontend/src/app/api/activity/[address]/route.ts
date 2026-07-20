import { NextResponse } from 'next/server';
import cfg from '../../../../contracts/p2p_config.json';

/* Route: /api/activity/{address}?before={timestamp}
 * Real transaction history for a wallet from the Hedera Mirror Node, normalized
 * for the Activity tab. Each item carries a HashScan link. */

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
const MIRROR = `https://${NETWORK}.mirrornode.hedera.com/api/v1`;

// Known Creode contracts (resolved account ids) for friendly labels.
const KNOWN: Record<string, string> = {
  '0.0.9645948': 'Creode P2P',
  '0.0.9632779': 'Test Faucet',
  '0.0.9627837': 'Creode Vault',
  '0.0.9644961': 'Yield Vault',
  '0.0.9644956': 'Treasury Swap',
  '0.0.9644233': 'Swap Router',
};

const TYPE_LABEL: Record<string, string> = {
  CRYPTOTRANSFER: 'Transfer',
  CONTRACTCALL: 'Contract Call',
  CONTRACTCREATEINSTANCE: 'Deploy',
  ETHEREUMTRANSACTION: 'Contract Call',
  TOKENASSOCIATE: 'Associate Token',
  TOKENMINT: 'Mint',
  TOKENBURN: 'Burn',
  CRYPTOAPPROVEALLOWANCE: 'Approve',
  TOKENCREATION: 'Create Token',
  CRYPTOCREATEACCOUNT: 'Create Account',
};

// token_id (0.0.x) -> { sym, decimals } from the deployed token set.
const TOKENS = (cfg as any).tokens as Record<string, { sym: string; address: string; decimals: number }>;
const tokenById: Record<string, { sym: string; decimals: number }> = {};
for (const t of Object.values(TOKENS)) {
  if (!t.address || /^0x0+$/.test(t.address)) continue;
  tokenById[`0.0.${BigInt(t.address).toString()}`] = { sym: t.sym, decimals: t.decimals };
}

const fmt = (v: number) =>
  Math.abs(v) >= 1 ? v.toLocaleString(undefined, { maximumFractionDigits: 4 }) : v.toLocaleString(undefined, { maximumFractionDigits: 7 });

export async function GET(request: Request, { params }: { params: Promise<{ address: string }> }) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const before = searchParams.get('before');

    // Resolve EVM address / alias -> Hedera account id.
    const acctRes = await fetch(`${MIRROR}/accounts/${address.toLowerCase()}`, { next: { revalidate: 5 } });
    if (!acctRes.ok) return NextResponse.json({ accountId: null, transactions: [], next: null });
    const acct = await acctRes.json();
    const accountId: string = acct.account;
    if (!accountId) return NextResponse.json({ accountId: null, transactions: [], next: null });

    let url = `${MIRROR}/transactions?account.id=${accountId}&limit=25&order=desc`;
    if (before) url += `&timestamp=lt:${before}`;
    const txRes = await fetch(url, { next: { revalidate: 5 } });
    const data = await txRes.json();
    const raw: any[] = data.transactions || [];

    const transactions = raw.map((t) => {
      const name: string = t.name;
      const entity: string | null = t.entity_id;
      const known = entity && KNOWN[entity];
      const type = name === 'CONTRACTCALL' && known ? known : (TYPE_LABEL[name] || name);

      // Net token movement for this account (largest by magnitude).
      let amount: { value: number; sym: string } | null = null;
      const tokDelta: Record<string, number> = {};
      for (const tt of t.token_transfers || []) {
        if (tt.account !== accountId) continue;
        tokDelta[tt.token_id] = (tokDelta[tt.token_id] || 0) + Number(tt.amount);
      }
      let bestSym = '', bestVal = 0;
      for (const [id, rawAmt] of Object.entries(tokDelta)) {
        const meta = tokenById[id];
        const human = meta ? rawAmt / 10 ** meta.decimals : rawAmt;
        if (Math.abs(human) > Math.abs(bestVal)) { bestVal = human; bestSym = meta?.sym || id; }
      }
      if (bestSym) {
        amount = { value: bestVal, sym: bestSym };
      } else {
        // Fall back to net HBAR change for this account.
        let tiny = 0;
        for (const tr of t.transfers || []) if (tr.account === accountId) tiny += Number(tr.amount);
        if (tiny !== 0) amount = { value: tiny / 1e8, sym: 'HBAR' };
      }

      const detail = known || (amount ? amount.sym : name === 'CRYPTOTRANSFER' ? 'HBAR' : '—');
      const ts: string = t.consensus_timestamp;
      return {
        txId: t.transaction_id,
        type,
        detail,
        amount: amount ? { value: amount.value, display: `${amount.value >= 0 ? '+' : ''}${fmt(amount.value)}`, sym: amount.sym } : null,
        fee: (Number(t.charged_tx_fee) || 0) / 1e8,
        timestamp: Math.floor(Number(ts)),
        status: t.result === 'SUCCESS' ? 'success' : 'failed',
        result: t.result,
        hashscanUrl: `https://hashscan.io/${NETWORK}/transaction/${ts}`,
      };
    });

    const next = data.links?.next && raw.length ? raw[raw.length - 1].consensus_timestamp : null;
    return NextResponse.json({ accountId, transactions, next });
  } catch (e) {
    console.error('[api/activity]', e);
    return NextResponse.json({ accountId: null, transactions: [], next: null }, { status: 200 });
  }
}
