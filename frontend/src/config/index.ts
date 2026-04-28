/**
 * @title Web3 Configuration
 * @author Viqtorhvayx
 * @dev Explicitly defined Hedera Chain IDs (295/296) for WalletConnect v2 parity and Hashio RPC resolution.
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { defineChain, http } from 'viem'

export const projectId = '7ac375b7ac375b7ac375b7ac375b7ac3'

// Explicit Hedera Testnet Definition (Chain ID: 296)
export const hederaTestnet = defineChain({
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
})

// Explicit Hedera Mainnet Definition (Chain ID: 295)
export const hederaMainnet = defineChain({
  id: 295,
  name: 'Hedera Mainnet',
  nativeCurrency: {
    name: 'HBAR',
    symbol: 'HBAR',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/mainnet' },
  },
  testnet: false,
})

export const networks = [hederaTestnet, hederaMainnet, mainnet, arbitrum]

// Set up Wagmi Adapter with explicit chain definitions and Hashio transports
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [hederaMainnet.id]: http('https://mainnet.hashio.io/api')
  }
})

export const config = wagmiAdapter.wagmiConfig
