/**
 * Web3 Configuration for Meridian Protocol
 * Uses Reown AppKit (formerly WalletConnect) for wallet connections
 */

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'viem'
import { cookieStorage, createStorage } from 'wagmi'

// WalletConnect Project ID
const projectId = '571b09c21b6975ccd5d0bbcf8cb322e1'

// Mantle Networks Configuration
export const mantleTestnet = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantlescan', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
} as const

export const mantleMainnet = {
  id: 5000,
  name: 'Mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantlescan', url: 'https://mantlescan.xyz' },
  },
  testnet: false,
} as const

// Networks array
const networks = [mantleTestnet, mantleMainnet] as const

// Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: false,
  projectId,
  networks,
  transports: {
    [mantleTestnet.id]: http('https://rpc.sepolia.mantle.xyz'),
    [mantleMainnet.id]: http('https://rpc.mantle.xyz'),
  },
})

// Metadata for WalletConnect
const metadata = {
  name: 'Meridian Protocol',
  description: 'Institutional RWA Yield Protocol on Mantle Network',
  url: 'https://meridian.finance',
  icons: ['https://meridian.finance/logo.png'],
}

// Create AppKit modal
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: mantleTestnet,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#D4AF37',
    '--w3m-border-radius-master': '12px',
  },
})

// Export config for wagmi provider
export const wagmiConfig = wagmiAdapter.wagmiConfig
