/**
 * Wallet Button Component
 * Provides connect/disconnect functionality with AppKit modal
 */

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWalletConnect'
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WalletButtonProps {
  variant?: 'default' | 'compact'
}

export function WalletButton({ variant = 'default' }: WalletButtonProps) {
  const {
    isConnected,
    address,
    balance,
    isConnecting,
    isCorrectNetwork,
    networkName,
    connect,
    disconnect,
    switchToMantle,
    shortAddress,
  } = useWallet()

  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <Button
        variant="hero"
        size={variant === 'compact' ? 'sm' : 'default'}
        onClick={connect}
        disabled={isConnecting}
        className="gap-2"
      >
        <Wallet className="h-4 w-4" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  // Connected but wrong network
  if (!isCorrectNetwork) {
    return (
      <Button
        variant="destructive"
        size={variant === 'compact' ? 'sm' : 'default'}
        onClick={switchToMantle}
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        Switch to Mantle
      </Button>
    )
  }

  // Connected and on correct network
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 transition-colors hover:bg-secondary/50"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-gold">
            <Wallet className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {shortAddress}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {networkName}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {balance} MNT
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={copyAddress}>
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-gain" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {copied ? 'Copied!' : 'Copy Address'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => window.open(`https://sepolia.mantlescan.xyz/address/${address}`, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-risk">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
