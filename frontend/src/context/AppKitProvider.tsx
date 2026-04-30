"use client";

/* * Developer: [Viqtorhvayx]
 * Component: AppKitProvider (Unified Single Adapter)
 * Description: Single source of truth for Wagmi + Reown AppKit.
 *              Fixed: metadata.url, ssr: false, single adapter instance.
 */

import React, { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hederaTestnet, sepolia } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';

const projectId = 'e5ca5702a767d682a832959e7f1c57bb';

const networks = [hederaTestnet, sepolia] as [typeof hederaTestnet, ...any[]];

// Single Wagmi adapter instance — no duplicate in config/index.ts
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false, // Must be false — HashPack is browser-only
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [sepolia.id]: http(),
  },
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'CREODE Protocol',
    description: 'Advanced Saving, Lending, and Borrowing on Hedera.',
    url: 'https://frontend-weld-iota-18.vercel.app', // Fixed: exact Vercel domain
    icons: ['https://avatars.githubusercontent.com/u/179241380'],
  },
  enableVerify: false,
  features: {
    analytics: false, // Disabled to prevent 403 pulse errors
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00A8E8',
    '--w3m-border-radius-master': '2px',
  },
} as any);

const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Export wagmiConfig for any component that needs it directly
export { wagmiAdapter };
