/**
 * @title AppKitProvider (Rebuild 2.0)
 * @author Viqtorhvayx
 * @dev Hardened provider initialization for Reown AppKit.
 */

'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, networks, wagmiAdapter } from '@/config'

const queryClient = new QueryClient()

createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata: {
    name: 'CREODE',
    description: 'Advanced Saving, Lending, and Borrowing platform on Hedera.',
    url: 'https://frontend-weld-iota-18.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/179241380']
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00A8E8',
    '--w3m-border-radius-master': '1px'
  }
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider 
      // @ts-ignore - Version mismatch in Wagmi/AppKit types
      config={wagmiAdapter.wagmiConfig}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
