/**
 * Web3 Configuration for Meridian Protocol
 * Uses Reown AppKit (formerly WalletConnect) for wallet connections
 */

import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import type { AppKitNetwork } from '@reown/appkit/networks'
import { http } from 'viem'
import { cookieStorage, createStorage } from 'wagmi'

// WalletConnect Project ID - from environment variable
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '571b09c21b6975ccd5d0bbcf8cb322e1'

console.log("🔧 Initializing Web3 Config...");
console.log("📡 Project ID:", projectId ? "✅ Set" : "❌ Missing");

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

// Networks array - cast to mutable for AppKit compatibility
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mantleTestnet, mantleMainnet]

// Wagmi Adapter
console.log("🔌 Creating Wagmi Adapter...");
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
console.log("✅ Wagmi Adapter created");

// Metadata for WalletConnect
const metadata = {
  name: 'Meridian Protocol',
  description: 'Institutional RWA Yield Protocol on Mantle Network',
  url: 'https://meridian.finance',
  icons: ['https://meridian.finance/logo.png'],
}

// Create AppKit modal
console.log("🎨 Creating AppKit...");
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
console.log("✅ AppKit created successfully");

// Export config for wagmi provider
export const wagmiConfig = wagmiAdapter.wagmiConfig
console.log("✅ Web3 Config initialized successfully");
