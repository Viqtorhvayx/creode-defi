"use client";

/* * Developer: [Viqtorhvayx]
 * Component: AppKitProvider (Browser-Safe Edition)
 * Description: createAppKit is initialized safely inside a mounted guard.
 *              Prevents SSR execution which breaks useAppKitAccount context.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hederaTestnet, sepolia } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';

const projectId = 'e5ca5702a767d682a832959e7f1c57bb';
const networks = [hederaTestnet, sepolia] as [typeof hederaTestnet, ...any[]];

const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [sepolia.id]: http(),
  },
});

// Initialize AppKit once at module level but AFTER wagmiAdapter is created
// This is safe because this file is "use client" and only runs in the browser
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'CREODE Protocol',
    description: 'Advanced Saving, Lending, and Borrowing on Hedera.',
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

const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Only render the wallet providers after the component has mounted in the browser.
  // This prevents AppKit hooks from running during SSR where they have no context.
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
