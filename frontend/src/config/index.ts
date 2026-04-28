/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Hardened configuration with transport fallback and SSR disabled to fix HashPack hanging.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { hedera, hederaTestnet } from 'viem/chains'
import { http, fallback } from 'viem'

export const projectId = 'e5ca5702a767d682a832959e7f1c57bb' 

export const networks = [hederaTestnet, hedera, mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  // Disable SSR to prevent hydration-based connection hangs
  ssr: false, 
  transports: {
    [hedera.id]: fallback([
      http('https://mainnet.hashio.io/api'),
      http()
    ]),
    [hederaTestnet.id]: fallback([
      http('https://testnet.hashio.io/api'),
      http()
    ])
  }
})

export const config = wagmiAdapter.wagmiConfig
