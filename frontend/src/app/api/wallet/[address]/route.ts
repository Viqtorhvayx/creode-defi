import { NextResponse } from 'next/server';

/* * Developer: [Viqtorhvayx]
 * Route: /api/wallet/[address]
 * Description: Backend Identity & Balance Resolution Engine for Hedera.
 * Offloads Mirror Node complexity to the server for maximum reliability.
 */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    
    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const network = process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet';
    const cleanAddress = address.toLowerCase();
    const truncatedEVM = `${address.slice(0, 6)}...${address.slice(-4)}`;

    console.log(`[Backend API] Resolving: ${cleanAddress} on ${network}`);

    // Fetch account data from Mirror Node
    const mirrorRes = await fetch(`https://${network}.mirrornode.hedera.com/api/v1/accounts/${cleanAddress}`, {
      next: { revalidate: 5 } // Cache for 5 seconds
    });

    if (!mirrorRes.ok) {
      // If Mirror Node fails or account not found, return truncated EVM as fallback
      return NextResponse.json({
        accountId: cleanAddress.startsWith('0x') ? truncatedEVM : cleanAddress,
        balance: "0.00",
        walletType: cleanAddress.startsWith('0x') ? 'evm' : 'hashpack'
      });
    }

    const data = await mirrorRes.json();
    
    return NextResponse.json({
      accountId: data.account || (cleanAddress.startsWith('0x') ? truncatedEVM : cleanAddress),
      balance: data.balance?.balance ? (data.balance.balance / 100000000).toFixed(2) : "0.00",
      walletType: cleanAddress.startsWith('0x') ? 'evm' : 'hashpack'
    });

  } catch (error) {
    console.error("[Backend API] Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
