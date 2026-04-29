/**
 * @title Web3 Configuration (Strict Testnet)
 * @author Viqtorhvayx
 * @dev Locked Testnet configuration (Hedera Testnet & Sepolia) with EIP-6963 support.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia, hederaTestnet } from '@reown/appkit/networks'
import { http } from 'viem'

export const projectId = 'e5ca5702a767d682a832959e7f1c57bb' 

export const networks = [hederaTestnet, sepolia]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: false, 
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [sepolia.id]: http()
  }
})

export const config = wagmiAdapter.wagmiConfig
