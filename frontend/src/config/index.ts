/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Finalized configuration with verified Reown Project ID and EIP-6963 support.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { hedera, hederaTestnet } from 'viem/chains'
import { http } from 'viem'

// Verified Project ID from cloud.reown.com
export const projectId = 'e5ca5702a767d682a832959e7f1c57bb' 

export const networks = [hedera, hederaTestnet, mainnet, arbitrum]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true, 
  transports: {
    [hedera.id]: http('https://mainnet.hashio.io/api'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
