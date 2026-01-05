/**
 * Contract Interaction Hooks
 * Provides read/write functions for all Meridian contracts
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { parseEther, formatEther, type Address } from 'viem'
import { useMemo } from 'react'
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts'
import { mantleTestnet } from '@/lib/web3Config'

// Get addresses for current network (testnet)
const addresses = CONTRACT_ADDRESSES.testnet

// ============================================
// MERIDIAN TOKEN HOOKS
// ============================================

export function useTokenBalance(address: Address | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.MeridianToken as Address,
    abi: ABIS.MeridianToken,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mantleTestnet.id,
    query: {
      enabled: !!address && !!addresses.MeridianToken,
    },
  })

  return {
    balance: data ? formatEther(data as bigint) : '0',
    balanceRaw: data as bigint | undefined,
    isLoading,
    refetch,
  }
}

export function useTokenAllowance(owner: Address | undefined, spender: Address) {
  const { data, isLoading, refetch } = useReadContract({
    address: addresses.MeridianToken as Address,
    abi: ABIS.MeridianToken,
    functionName: 'allowance',
    args: owner ? [owner, spender] : undefined,
    chainId: mantleTestnet.id,
    query: {
      enabled: !!owner && !!addresses.MeridianToken,
    },
  })

  return {
    allowance: data ? formatEther(data as bigint) : '0',
    allowanceRaw: data as bigint | undefined,
    isLoading,
    refetch,
  }
}

export function useTokenApprove() {
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const approve = async (spender: Address, amount: string) => {
    if (!userAddress) throw new Error('No wallet connected')
    await writeContractAsync({
      address: addresses.MeridianToken as Address,
      abi: ABIS.MeridianToken as any,
      functionName: 'approve',
      args: [spender, parseEther(amount)],
      account: userAddress,
      chain: { id: mantleTestnet.id } as any,
    })
  }

  return {
    approve,
    isApproving: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// ============================================
// MERIDIAN VAULT HOOKS
// ============================================

export function useVaultData() {
  const { data: totalAssets } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'totalAssets',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.MeridianVault },
  })

  const { data: totalSupply } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'totalSupply',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.MeridianVault },
  })

  const { data: availableLiquidity } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'availableLiquidity',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.MeridianVault },
  })

  const { data: vaultName } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'name',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.MeridianVault },
  })

  const { data: vaultSymbol } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'symbol',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.MeridianVault },
  })

  return {
    totalAssets: totalAssets ? formatEther(totalAssets as bigint) : '0',
    totalSupply: totalSupply ? formatEther(totalSupply as bigint) : '0',
    availableLiquidity: availableLiquidity ? formatEther(availableLiquidity as bigint) : '0',
    vaultName: vaultName as string || 'Meridian Vault',
    vaultSymbol: vaultSymbol as string || 'mUSTB',
  }
}

export function useVaultUserData(address: Address | undefined) {
  const { data: shares, refetch: refetchShares } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!address && !!addresses.MeridianVault },
  })

  const { data: maxWithdraw } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'maxWithdraw',
    args: address ? [address] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!address && !!addresses.MeridianVault },
  })

  const { data: convertedAssets } = useReadContract({
    address: addresses.MeridianVault as Address,
    abi: ABIS.MeridianVault,
    functionName: 'convertToAssets',
    args: shares ? [shares] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!shares && !!addresses.MeridianVault },
  })

  return {
    shares: shares ? formatEther(shares as bigint) : '0',
    sharesRaw: shares as bigint | undefined,
    assetValue: convertedAssets ? formatEther(convertedAssets as bigint) : '0',
    maxWithdraw: maxWithdraw ? formatEther(maxWithdraw as bigint) : '0',
    refetch: refetchShares,
  }
}

export function useVaultDeposit() {
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const deposit = async (amount: string, receiver: Address) => {
    if (!userAddress) throw new Error('No wallet connected')
    await writeContractAsync({
      address: addresses.MeridianVault as Address,
      abi: ABIS.MeridianVault as any,
      functionName: 'deposit',
      args: [parseEther(amount), receiver],
      account: userAddress,
      chain: { id: mantleTestnet.id } as any,
    })
  }

  return {
    deposit,
    isDepositing: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

export function useVaultWithdraw() {
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const withdraw = async (amount: string, receiver: Address, owner: Address) => {
    if (!userAddress) throw new Error('No wallet connected')
    await writeContractAsync({
      address: addresses.MeridianVault as Address,
      abi: ABIS.MeridianVault as any,
      functionName: 'withdraw',
      args: [parseEther(amount), receiver, owner],
      account: userAddress,
      chain: { id: mantleTestnet.id } as any,
    })
  }

  const redeem = async (shares: string, receiver: Address, owner: Address) => {
    if (!userAddress) throw new Error('No wallet connected')
    await writeContractAsync({
      address: addresses.MeridianVault as Address,
      abi: ABIS.MeridianVault as any,
      functionName: 'redeem',
      args: [parseEther(shares), receiver, owner],
      account: userAddress,
      chain: { id: mantleTestnet.id } as any,
    })
  }

  return {
    withdraw,
    redeem,
    isWithdrawing: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  }
}

// ============================================
// COMPLIANCE HOOKS
// ============================================

export function useComplianceStatus(address: Address | undefined) {
  const { data: canInteract, isLoading, refetch } = useReadContract({
    address: addresses.ComplianceRegistry as Address,
    abi: ABIS.ComplianceRegistry,
    functionName: 'canInteract',
    args: address ? [address, addresses.MeridianVault as Address] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!address && !!addresses.ComplianceRegistry },
  })

  return {
    isCompliant: canInteract as boolean || false,
    isLoading,
    refetch,
  }
}

export function useKYCStatus(address: Address | undefined) {
  const { data: isVerified, isLoading, refetch } = useReadContract({
    address: addresses.ZKKYCVerifier as Address,
    abi: ABIS.ZKKYCVerifier,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!address && !!addresses.ZKKYCVerifier },
  })

  const { data: accreditation } = useReadContract({
    address: addresses.ZKKYCVerifier as Address,
    abi: ABIS.ZKKYCVerifier,
    functionName: 'getAccreditation',
    args: address ? [address] : undefined,
    chainId: mantleTestnet.id,
    query: { enabled: !!address && !!addresses.ZKKYCVerifier },
  })

  return {
    isVerified: isVerified as boolean || false,
    accreditationType: accreditation as number || 0,
    isLoading,
    refetch,
  }
}

// ============================================
// YIELD AGGREGATOR HOOKS
// ============================================

export function useAggregatorData() {
  const { data: tvl } = useReadContract({
    address: addresses.YieldAggregator as Address,
    abi: ABIS.YieldAggregator,
    functionName: 'totalValueLocked',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.YieldAggregator },
  })

  const { data: pendingYield } = useReadContract({
    address: addresses.YieldAggregator as Address,
    abi: ABIS.YieldAggregator,
    functionName: 'pendingYield',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.YieldAggregator },
  })

  const { data: needsRebalance } = useReadContract({
    address: addresses.YieldAggregator as Address,
    abi: ABIS.YieldAggregator,
    functionName: 'needsRebalance',
    chainId: mantleTestnet.id,
    query: { enabled: !!addresses.YieldAggregator },
  })

  return {
    totalValueLocked: tvl ? formatEther(tvl as bigint) : '0',
    pendingYield: pendingYield ? formatEther(pendingYield as bigint) : '0',
    needsRebalance: needsRebalance as boolean || false,
  }
}
