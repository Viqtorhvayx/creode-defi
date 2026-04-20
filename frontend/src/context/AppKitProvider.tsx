'use client'

import React, { ReactNode, useEffect, useState } from 'react'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import { hederaTestnet } from '@reown/appkit/networks'

const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3'
const queryClient = new QueryClient()
const networks: [any, ...any[]] = [hederaTestnet]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

export function AppKitProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
  }, [])

  if (!mounted) return null

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
