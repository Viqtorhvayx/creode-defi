/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Hardened configuration with EIP-6963 discovery to resolve MetaMask/HashPack collisions.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, hedera, hederaTestnet } from '@reown/appkit/networks'
import { http, fallback } from 'viem'

// Verified Project ID from cloud.reown.com
export const projectId = 'e5ca5702a767d682a832959e7f1c57bb' 

export const networks = [hederaTestnet, hedera, mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  // EIP-6963 discovery is enabled by default in WagmiAdapter 
  // but we set ssr: false to ensure immediate injection
  ssr: false, 
  transports: {
    [hedera.id]: fallback([http('https://mainnet.hashio.io/api'), http()]),
    [hederaTestnet.id]: fallback([http('https://testnet.hashio.io/api'), http()])
  }
})

export const config = wagmiAdapter.wagmiConfig
