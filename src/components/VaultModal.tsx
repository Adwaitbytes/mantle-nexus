/**
 * Deposit/Withdraw Modal Component
 * Handles ERC-4626 vault interactions
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWallet } from '@/hooks/useWalletConnect'
import {
  useTokenBalance,
  useTokenAllowance,
  useTokenApprove,
  useVaultDeposit,
  useVaultWithdraw,
  useVaultUserData,
  useComplianceStatus,
} from '@/hooks/useContracts'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { type Address } from 'viem'
import {
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Info,
  Shield,
} from 'lucide-react'

interface VaultModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'deposit' | 'withdraw'
  vaultName: string
}

export function VaultModal({ isOpen, onClose, mode, vaultName }: VaultModalProps) {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'input' | 'approve' | 'confirm' | 'success'>('input')
  
  const { isConnected, address, connect } = useWallet()
  const { balance: tokenBalance, refetch: refetchBalance } = useTokenBalance(address as Address)
  const { shares, assetValue, refetch: refetchShares } = useVaultUserData(address as Address)
  const { isCompliant } = useComplianceStatus(address as Address)
  const { allowance, refetch: refetchAllowance } = useTokenAllowance(
    address as Address,
    CONTRACT_ADDRESSES.testnet.MeridianVault as Address
  )
  
  const { approve, isApproving, isSuccess: approveSuccess } = useTokenApprove()
  const { deposit, isDepositing, isSuccess: depositSuccess, hash: depositHash } = useVaultDeposit()
  const { redeem, isWithdrawing, isSuccess: withdrawSuccess, hash: withdrawHash } = useVaultWithdraw()

  const vaultAddress = CONTRACT_ADDRESSES.testnet.MeridianVault as Address

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setStep('input')
    }
  }, [isOpen])

  // Handle approve success
  useEffect(() => {
    if (approveSuccess && step === 'approve') {
      refetchAllowance()
      setStep('confirm')
    }
  }, [approveSuccess, step, refetchAllowance])

  // Handle deposit/withdraw success
  useEffect(() => {
    if ((depositSuccess || withdrawSuccess) && step === 'confirm') {
      setStep('success')
      refetchBalance()
      refetchShares()
    }
  }, [depositSuccess, withdrawSuccess, step, refetchBalance, refetchShares])

  const maxAmount = mode === 'deposit' ? tokenBalance : assetValue
  const needsApproval = mode === 'deposit' && parseFloat(allowance) < parseFloat(amount || '0')
  const isProcessing = isApproving || isDepositing || isWithdrawing

  const handleMax = () => {
    setAmount(maxAmount)
  }

  const handleAction = async () => {
    if (!address || !amount) return

    if (mode === 'deposit') {
      if (needsApproval) {
        setStep('approve')
        approve(vaultAddress, amount)
      } else {
        setStep('confirm')
        deposit(amount, address)
      }
    } else {
      setStep('confirm')
      redeem(shares, address, address)
    }
  }

  const handleApprove = () => {
    approve(vaultAddress, amount)
  }

  const handleDeposit = () => {
    if (!address) return
    deposit(amount, address)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <Card variant="glass" className="border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                {mode === 'deposit' ? (
                  <ArrowUpRight className="h-5 w-5 text-gain" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-yield" />
                )}
                {mode === 'deposit' ? 'Deposit' : 'Withdraw'}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Not connected */}
              {!isConnected && (
                <div className="text-center py-6">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">Connect wallet to continue</p>
                  <Button variant="hero" onClick={connect}>Connect Wallet</Button>
                </div>
              )}

              {/* Not compliant warning */}
              {isConnected && !isCompliant && mode === 'deposit' && (
                <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-500">KYC Required</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Complete identity verification to deposit to this vault.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Step */}
              {isConnected && step === 'input' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {mode === 'deposit' ? 'Deposit Amount' : 'Withdraw Amount'}
                      </span>
                      <span className="text-muted-foreground">
                        Balance: {parseFloat(maxAmount).toFixed(4)} {mode === 'deposit' ? 'MRDL' : 'mUSTB'}
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pr-20 text-lg"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 text-xs"
                        onClick={handleMax}
                      >
                        MAX
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-secondary/30 p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Vault</span>
                      <span className="text-foreground">{vaultName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">APY</span>
                      <span className="text-gain">5.24%</span>
                    </div>
                    {mode === 'deposit' && needsApproval && (
                      <div className="flex items-center gap-2 text-sm text-yellow-500">
                        <Info className="h-4 w-4" />
                        <span>Approval required before deposit</span>
                      </div>
                    )}
                  </div>

                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={handleAction}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(maxAmount) || (!isCompliant && mode === 'deposit')}
                  >
                    {mode === 'deposit' ? (needsApproval ? 'Approve & Deposit' : 'Deposit') : 'Withdraw'}
                  </Button>
                </>
              )}

              {/* Approve Step */}
              {step === 'approve' && (
                <div className="text-center py-6">
                  {isApproving ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                      <p className="font-medium">Approving tokens...</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Confirm the transaction in your wallet
                      </p>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-gain" />
                      <p className="font-medium">Approval confirmed!</p>
                      <Button variant="hero" className="mt-4" onClick={handleDeposit}>
                        Proceed to Deposit
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Confirm Step */}
              {step === 'confirm' && (
                <div className="text-center py-6">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                  <p className="font-medium">
                    {mode === 'deposit' ? 'Processing deposit...' : 'Processing withdrawal...'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Confirm the transaction in your wallet
                  </p>
                </div>
              )}

              {/* Success Step */}
              {step === 'success' && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-gain" />
                  </motion.div>
                  <p className="font-medium text-lg">
                    {mode === 'deposit' ? 'Deposit Successful!' : 'Withdrawal Successful!'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {amount} {mode === 'deposit' ? 'MRDL' : 'mUSTB'}
                  </p>
                  {(depositHash || withdrawHash) && (
                    <a
                      href={`https://sepolia.mantlescan.xyz/tx/${depositHash || withdrawHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm underline mt-2 inline-block"
                    >
                      View on Explorer
                    </a>
                  )}
                  <Button variant="outline" className="mt-4" onClick={onClose}>
                    Close
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
