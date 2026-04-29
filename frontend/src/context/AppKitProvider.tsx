/**
 * @title AppKitProvider (v2.2 Force Update)
 * @author Viqtorhvayx
 * @dev Renamed application to force Reown bridge re-authentication.
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
  networks,
  projectId,
  metadata: {
    name: 'CREODE v2.2',
    description: 'Advanced DeFi platform on Hedera (Force Update v2.2).',
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
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
