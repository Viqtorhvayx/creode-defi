/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Configuration for Reown AppKit and Wagmi with multi-chain support (EVM & Hedera).
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, hedera, hederaTestnet } from '@reown/appkit/networks'

// Get projectId from https://cloud.reown.com
export const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3' // Placeholder provided by user

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [mainnet, arbitrum, hedera, hederaTestnet]

// Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
