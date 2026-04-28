/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Explicitly configured RPCs for Hedera using Hashio for high-performance wallet resolution.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, hedera, hederaTestnet } from '@reown/appkit/networks'
import { http } from 'wagmi'

export const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3'

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [hederaTestnet, hedera, mainnet, arbitrum]

// Set up Wagmi Adapter with explicit Hashio Transports
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [hedera.id]: http('https://mainnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
