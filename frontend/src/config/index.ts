/**
 * @title Web3 Configuration (v2.2 Force Update)
 * @author Viqtorhvayx
 * @dev Re-verified Project ID and transports to break through browser caching.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, hedera, hederaTestnet } from '@reown/appkit/networks'
import { http } from 'viem'

export const projectId = 'e5ca5702a767d682a832959e7f1c57bb' 

export const networks = [hederaTestnet, hedera, mainnet]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false, 
  transports: {
    [hedera.id]: http('https://mainnet.hashio.io/api'),
    [hederaTestnet.id]: http('https://testnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
