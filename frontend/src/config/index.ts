/**
 * @title Web3 Configuration (Rebuild 2.0)
 * @author Viqtorhvayx
 * @dev Hardened configuration using official chains and optimized transports.
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
  ssr: false, // Prevents hydration collisions
  transports: {
    [hedera.id]: fallback([http('https://mainnet.hashio.io/api'), http()]),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
