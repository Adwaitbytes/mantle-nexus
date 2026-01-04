/**
 * Enhanced Wallet Hook using Wagmi
 * Provides wallet connection, network switching, and account management
 */

import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { useCallback, useMemo } from 'react'
import { mantleTestnet, mantleMainnet } from '@/lib/web3Config'

export interface WalletState {
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  balance: string
  isConnecting: boolean
  isCorrectNetwork: boolean
  networkName: string
}

export interface UseWalletReturn extends WalletState {
  connect: () => void
  disconnect: () => void
  switchToMantle: () => Promise<void>
  openModal: () => void
  shortAddress: string
}

export function useWallet(): UseWalletReturn {
  const { address, isConnected, isConnecting } = useAccount()
  const chainId = useChainId()
  const { disconnect: wagmiDisconnect } = useDisconnect()
  const { switchChainAsync } = useSwitchChain()
  const { open } = useAppKit()
  
  // Get balance
  const { data: balanceData } = useBalance({
    address: address,
  })

  // Check if on Mantle network
  const isCorrectNetwork = useMemo(() => {
    return chainId === mantleTestnet.id || chainId === mantleMainnet.id
  }, [chainId])

  // Get network name
  const networkName = useMemo(() => {
    if (chainId === mantleTestnet.id) return 'Mantle Sepolia'
    if (chainId === mantleMainnet.id) return 'Mantle'
    return 'Unknown Network'
  }, [chainId])

  // Format balance
  const balance = useMemo(() => {
    if (!balanceData) return '0'
    return Number(balanceData.formatted).toFixed(4)
  }, [balanceData])

  // Short address for display
  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])

  // Open WalletConnect modal
  const connect = useCallback(() => {
    open()
  }, [open])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    wagmiDisconnect()
  }, [wagmiDisconnect])

  // Switch to Mantle network
  const switchToMantle = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: mantleTestnet.id })
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }, [switchChainAsync])

  // Open modal (for account management)
  const openModal = useCallback(() => {
    open({ view: 'Account' })
  }, [open])

  return {
    isConnected,
    address,
    chainId,
    balance,
    isConnecting,
    isCorrectNetwork,
    networkName,
    connect,
    disconnect,
    switchToMantle,
    openModal,
    shortAddress,
  }
}
