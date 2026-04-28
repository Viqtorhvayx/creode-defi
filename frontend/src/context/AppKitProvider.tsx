/**
 * @title AppKitProvider
 * @author Viqtorhvayx
 * @dev Hardened AppKit Provider with validated metadata and custom CREODE styling.
 */

'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, networks, wagmiAdapter } from '@/config'

const queryClient = new QueryClient()

// Create modal with validated metadata to prevent WalletConnect hanging
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'CREODE',
    description: 'Advanced Saving, Lending, and Borrowing platform on Hedera.',
    url: 'https://frontend-weld-iota-18.vercel.app', // Explicitly matched to deployment URL
    icons: ['https://avatars.githubusercontent.com/u/179241380']
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00A8E8',
    '--w3m-color-mix': '#00A8E8',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '1px'
  }
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
