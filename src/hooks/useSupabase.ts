/**
 * Supabase Hooks
 * React hooks for interacting with Supabase backend
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { 
  Profile, 
  ProfileInsert, 
  ProfileUpdate, 
  Transaction, 
  TransactionInsert,
  Notification,
  KYCDocument,
  WatchlistItem,
  PortfolioSnapshot
} from '@/types/database'

// ============================================
// USER PROFILE HOOK
// ============================================

export interface UseProfileReturn {
  profile: Profile | null
  isLoading: boolean
  error: string | null
  createProfile: (walletAddress: string, data?: Partial<ProfileInsert>) => Promise<Profile | null>
  updateProfile: (updates: ProfileUpdate) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useProfile(walletAddress: string | undefined): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setProfile(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      setProfile(data)
    } catch (err) {
      const error = err as Error
      console.error('Failed to fetch profile:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const createProfile = useCallback(async (
    walletAddress: string, 
    data?: Partial<ProfileInsert>
  ): Promise<Profile | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
          kyc_status: 'pending',
          accreditation_type: 0,
          risk_tolerance: 'moderate',
          notification_preferences: {
            email: false,
            push: true,
            transactions: true,
            alerts: true,
          },
          ...data,
        })
        .select()
        .single()

      if (error) throw error

      setProfile(newProfile)
      return newProfile
    } catch (err) {
      const error = err as Error
      console.error('Failed to create profile:', error)
      setError(error.message)
      return null
    }
  }, [])

  const updateProfile = useCallback(async (updates: ProfileUpdate): Promise<boolean> => {
    if (!walletAddress || !isSupabaseConfigured()) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('wallet_address', walletAddress.toLowerCase())

      if (error) throw error

      await fetchProfile()
      return true
    } catch (err) {
      const error = err as Error
      console.error('Failed to update profile:', error)
      setError(error.message)
      return false
    }
  }, [walletAddress, fetchProfile])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    isLoading,
    error,
    createProfile,
    updateProfile,
    refetch: fetchProfile,
  }
}

// ============================================
// TRANSACTION HISTORY HOOK
// ============================================

export interface UseTransactionsReturn {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  addTransaction: (tx: Omit<TransactionInsert, 'wallet_address'>) => Promise<Transaction | null>
  updateTransactionStatus: (txHash: string, status: Transaction['status'], blockNumber?: number) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useTransactions(walletAddress: string | undefined, limit = 50): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setTransactions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (fetchError) throw fetchError

      setTransactions(data || [])
    } catch (err) {
      const error = err as Error
      console.error('Failed to fetch transactions:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress, limit])

  const addTransaction = useCallback(async (
    tx: Omit<TransactionInsert, 'wallet_address'>
  ): Promise<Transaction | null> => {
    if (!walletAddress || !isSupabaseConfigured()) return null

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...tx,
          wallet_address: walletAddress.toLowerCase(),
        })
        .select()
        .single()

      if (error) throw error

      setTransactions(prev => [data, ...prev])
      return data
    } catch (err) {
      const error = err as Error
      console.error('Failed to add transaction:', error)
      setError(error.message)
      return null
    }
  }, [walletAddress])

  const updateTransactionStatus = useCallback(async (
    txHash: string, 
    status: Transaction['status'],
    blockNumber?: number
  ): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status, 
          block_number: blockNumber,
          confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
        })
        .eq('tx_hash', txHash)

      if (error) throw error

      await fetchTransactions()
      return true
    } catch (err) {
      const error = err as Error
      console.error('Failed to update transaction:', error)
      setError(error.message)
      return false
    }
  }, [fetchTransactions])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Real-time subscription for transaction updates
  useEffect(() => {
    if (!walletAddress || !isSupabaseConfigured()) return

    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `wallet_address=eq.${walletAddress.toLowerCase()}`,
        },
        () => {
          fetchTransactions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [walletAddress, fetchTransactions])

  return {
    transactions,
    isLoading,
    error,
    addTransaction,
    updateTransactionStatus,
    refetch: fetchTransactions,
  }
}

// ============================================
// NOTIFICATIONS HOOK
// ============================================

export interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<Notification | null>
  refetch: () => Promise<void>
}

export function useNotifications(walletAddress: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setNotifications([])
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setNotifications(data || [])
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      return true
    } catch (err) {
      console.error('Failed to mark as read:', err)
      return false
    }
  }, [])

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!walletAddress || !isSupabaseConfigured()) return false

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      return true
    } catch (err) {
      console.error('Failed to mark all as read:', err)
      return false
    }
  }, [walletAddress])

  const addNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'created_at' | 'read'>
  ): Promise<Notification | null> => {
    if (!isSupabaseConfigured()) return null

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({ ...notification, read: false })
        .select()
        .single()

      if (error) throw error

      setNotifications(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Failed to add notification:', err)
      return null
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!walletAddress || !isSupabaseConfigured()) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `wallet_address=eq.${walletAddress.toLowerCase()}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [walletAddress])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refetch: fetchNotifications,
  }
}

// ============================================
// WATCHLIST HOOK
// ============================================

export interface UseWatchlistReturn {
  watchlist: WatchlistItem[]
  isLoading: boolean
  addToWatchlist: (asset: Omit<WatchlistItem, 'id' | 'wallet_address' | 'added_at'>) => Promise<boolean>
  removeFromWatchlist: (assetAddress: string) => Promise<boolean>
  isWatched: (assetAddress: string) => boolean
  refetch: () => Promise<void>
}

export function useWatchlist(walletAddress: string | undefined): UseWatchlistReturn {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchWatchlist = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setWatchlist([])
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('added_at', { ascending: false })

      if (error) throw error

      setWatchlist(data || [])
    } catch (err) {
      console.error('Failed to fetch watchlist:', err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const addToWatchlist = useCallback(async (
    asset: Omit<WatchlistItem, 'id' | 'wallet_address' | 'added_at'>
  ): Promise<boolean> => {
    if (!walletAddress || !isSupabaseConfigured()) return false

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          ...asset,
          wallet_address: walletAddress.toLowerCase(),
        })
        .select()
        .single()

      if (error) throw error

      setWatchlist(prev => [data, ...prev])
      return true
    } catch (err) {
      console.error('Failed to add to watchlist:', err)
      return false
    }
  }, [walletAddress])

  const removeFromWatchlist = useCallback(async (assetAddress: string): Promise<boolean> => {
    if (!walletAddress || !isSupabaseConfigured()) return false

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('asset_address', assetAddress.toLowerCase())

      if (error) throw error

      setWatchlist(prev => prev.filter(w => w.asset_address.toLowerCase() !== assetAddress.toLowerCase()))
      return true
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
      return false
    }
  }, [walletAddress])

  const isWatched = useCallback((assetAddress: string): boolean => {
    return watchlist.some(w => w.asset_address.toLowerCase() === assetAddress.toLowerCase())
  }, [watchlist])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  return {
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    isWatched,
    refetch: fetchWatchlist,
  }
}

// ============================================
// KYC DOCUMENTS HOOK
// ============================================

export interface UseKYCDocumentsReturn {
  documents: KYCDocument[]
  isLoading: boolean
  submitDocument: (doc: Omit<KYCDocument, 'id' | 'wallet_address' | 'submitted_at' | 'reviewed_at' | 'reviewer_notes' | 'status'>) => Promise<KYCDocument | null>
  refetch: () => Promise<void>
}

export function useKYCDocuments(walletAddress: string | undefined): UseKYCDocumentsReturn {
  const [documents, setDocuments] = useState<KYCDocument[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchDocuments = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setDocuments([])
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('submitted_at', { ascending: false })

      if (error) throw error

      setDocuments(data || [])
    } catch (err) {
      console.error('Failed to fetch KYC documents:', err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const submitDocument = useCallback(async (
    doc: Omit<KYCDocument, 'id' | 'wallet_address' | 'submitted_at' | 'reviewed_at' | 'reviewer_notes' | 'status'>
  ): Promise<KYCDocument | null> => {
    if (!walletAddress || !isSupabaseConfigured()) return null

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .insert({
          ...doc,
          wallet_address: walletAddress.toLowerCase(),
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error

      setDocuments(prev => [data, ...prev])
      return data
    } catch (err) {
      console.error('Failed to submit document:', err)
      return null
    }
  }, [walletAddress])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  return {
    documents,
    isLoading,
    submitDocument,
    refetch: fetchDocuments,
  }
}

// ============================================
// PORTFOLIO SNAPSHOTS HOOK
// ============================================

export interface UsePortfolioHistoryReturn {
  snapshots: PortfolioSnapshot[]
  isLoading: boolean
  saveSnapshot: (totalValue: string, positions: unknown[]) => Promise<boolean>
  refetch: () => Promise<void>
}

export function usePortfolioHistory(walletAddress: string | undefined): UsePortfolioHistoryReturn {
  const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchSnapshots = useCallback(async () => {
    if (!walletAddress || !isSupabaseConfigured()) {
      setSnapshots([])
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .order('snapshot_date', { ascending: false })
        .limit(365) // Last year of daily snapshots

      if (error) throw error

      setSnapshots(data || [])
    } catch (err) {
      console.error('Failed to fetch portfolio history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const saveSnapshot = useCallback(async (
    totalValue: string, 
    positions: unknown[]
  ): Promise<boolean> => {
    if (!walletAddress || !isSupabaseConfigured()) return false

    const today = new Date().toISOString().split('T')[0]

    try {
      // Upsert to avoid duplicates for same day
      const { error } = await supabase
        .from('portfolio_snapshots')
        .upsert({
          wallet_address: walletAddress.toLowerCase(),
          total_value_usd: totalValue,
          positions: positions as any,
          snapshot_date: today,
        }, {
          onConflict: 'wallet_address,snapshot_date',
        })

      if (error) throw error

      await fetchSnapshots()
      return true
    } catch (err) {
      console.error('Failed to save snapshot:', err)
      return false
    }
  }, [walletAddress, fetchSnapshots])

  useEffect(() => {
    fetchSnapshots()
  }, [fetchSnapshots])

  return {
    snapshots,
    isLoading,
    saveSnapshot,
    refetch: fetchSnapshots,
  }
}

// ============================================
// COMBINED USER DATA HOOK
// ============================================

export interface UseUserDataReturn {
  profile: Profile | null
  transactions: Transaction[]
  notifications: Notification[]
  unreadNotifications: number
  watchlist: WatchlistItem[]
  kycDocuments: KYCDocument[]
  isLoading: boolean
  isConfigured: boolean
  ensureProfile: () => Promise<Profile | null>
}

export function useUserData(walletAddress: string | undefined): UseUserDataReturn {
  const { profile, isLoading: profileLoading, createProfile } = useProfile(walletAddress)
  const { transactions, isLoading: txLoading } = useTransactions(walletAddress)
  const { notifications, unreadCount } = useNotifications(walletAddress)
  const { watchlist } = useWatchlist(walletAddress)
  const { documents } = useKYCDocuments(walletAddress)

  const ensureProfile = useCallback(async (): Promise<Profile | null> => {
    if (profile) return profile
    if (!walletAddress) return null
    return createProfile(walletAddress)
  }, [profile, walletAddress, createProfile])

  return {
    profile,
    transactions,
    notifications,
    unreadNotifications: unreadCount,
    watchlist,
    kycDocuments: documents,
    isLoading: profileLoading || txLoading,
    isConfigured: isSupabaseConfigured(),
    ensureProfile,
  }
}
