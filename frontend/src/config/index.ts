/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Hardened configuration using official viem chains to fix HashPack handshake hangs.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { hedera, hederaTestnet } from 'viem/chains'
import { http } from 'viem'

export const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3'

// Official Hedera Chain Definitions
export const networks = [hedera, hederaTestnet, mainnet, arbitrum]

// Set up Wagmi Adapter with official chains and Hashio transports
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [hedera.id]: http('https://mainnet.hashio.io/api'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
