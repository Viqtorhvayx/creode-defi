// Client-side helper: fire-and-forget HCS event logging. Called right after
// a transaction confirms on-chain. Never throws — a logging failure must
// never surface as an error on top of an already-successful transaction.
export async function logHcsEvent(evt: {
  type: string;
  detail: string;
  account: string;
  txHash?: string;
  amount?: string;
  sym?: string;
}): Promise<void> {
  try {
    await fetch('/api/hcs/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evt),
    });
  } catch {
    /* best-effort — ignore */
  }
}
