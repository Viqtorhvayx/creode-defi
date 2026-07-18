"use client";

/* * Developer: [Viqtorhvayx]
 * Component: AppKitProvider (Restored & Hardened)
 * Description: Restored the mounted guard and browser-safe initialization.
 *              Fixed: TypeScript 'any' casting for networks to satisfy WagmiAdapter.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hederaTestnet } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'e5ca5702a767d682a832959e7f1c57bb';
// Hedera Testnet only — an extra chain (e.g. Sepolia) just lets wallets sign on
// the wrong network, where the contracts have no code ("missing revert data").
const networks = [hederaTestnet] as any;

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
  },
});

// Browser-safe initialization
if (typeof window !== 'undefined') {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: 'CREODE Protocol',
      description: 'Advanced Saving and Peer-to-Peer Trading on Hedera.',
      url: 'https://frontend-weld-iota-18.vercel.app',
      icons: ['https://avatars.githubusercontent.com/u/179241380'],
    },
    enableVerify: false,
    features: {
      analytics: false,
    },
    themeMode: 'dark',
    themeVariables: {
      '--w3m-accent': '#00A8E8',
      '--w3m-border-radius-master': '2px',
    },
  } as any);
}

const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {mounted ? children : null}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export { wagmiAdapter };
