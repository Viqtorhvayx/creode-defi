'use client'

import React, { ReactNode } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import { hederaTestnet } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3' // Placeholder

// 2. Set up the QueryClient
const queryClient = new QueryClient()

// 3. Set up the networks
export const networks = [hederaTestnet]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

// 5. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: 'CREODE',
    description: 'Structured Credit Infrastructure',
    url: 'https://creode.defi',
    icons: ['https://avatars.githubusercontent.com/u/179241380']
  },
  features: {
    analytics: true
  }
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
