/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Hardened configuration for EIP-6963 support and Hashio RPC resolution.
 * NOTE: Replace the projectId with a valid ID from cloud.reown.com to fix 403 errors.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { hedera, hederaTestnet } from 'viem/chains'
import { http } from 'viem'

// IMPORTANT: Replace this placeholder to resolve the 403 Forbidden errors in console
export const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3' 

export const networks = [hedera, hederaTestnet, mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  // Enable EIP-6963 for multi-wallet discovery (fixes "ethereum getter" conflicts)
  ssr: true, 
  transports: {
    [hedera.id]: http('https://mainnet.hashio.io/api'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
