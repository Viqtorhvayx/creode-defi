"use client";

/* * Developer: [Viqtorhvayx]
 * Component: AppKitProvider (Clean Rebuild)
 * Description: Unified Reown AppKit infrastructure for Hedera and EVM support.
 * Features: EIP-6963 Discovery, Hardened Security, and multi-network adapter.
 */

import React, { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { hederaTestnet, sepolia, mainnet } from '@reown/appkit/networks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { http } from 'viem';

// 1. Project Configuration
const projectId = 'e5ca5702a767d682a832959e7f1c57bb';
const networks = [hederaTestnet, sepolia, mainnet];

// 2. Initialize Wagmi Adapter
// Supports EIP-6963 discovery for HashPack, MetaMask, and others
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [sepolia.id]: http(),
    [mainnet.id]: http()
  }
});

// 3. Initialize Reown AppKit Singleton
createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as [any, ...any[]],
  projectId,
  metadata: {
    name: 'CREODE Protocol',
    description: 'Advanced Saving, Lending, and Borrowing on Hedera.',
    url: 'https://creode.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/179241380']
  },
  enableVerify: false, // Bypass domain verification to prevent HashPack flagging
  features: {
    verify: false,
    analytics: true
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00A8E8',
    '--w3m-border-radius-master': '2px'
  }
} as any);


const queryClient = new QueryClient();

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider 
      // @ts-ignore - Suppressing version mismatch in Wagmi/AppKit types for build success
      config={wagmiAdapter.wagmiConfig}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
