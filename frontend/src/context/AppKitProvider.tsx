/**
 * @title AppKitProvider
 * @author Viqtorhvayx
 * @dev Reown AppKit Provider initialization with custom CREODE theme and multi-chain support.
 */

'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, networks, wagmiAdapter } from '@/config'

// Setup queryClient
const queryClient = new QueryClient()

// Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'CREODE',
    description: 'Advanced Saving, Lending, and Borrowing platform on Hedera.',
    url: 'https://creode.defi',
    icons: ['https://avatars.githubusercontent.com/u/179241380']
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00A8E8',
    '--w3m-color-mix': '#00A8E8',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '1px' // Industrial aesthetic
  },
  features: {
    analytics: true
  }
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
