/**
 * Database Types for Supabase
 * Generated based on Meridian Protocol requirements
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // User profiles linked to wallet addresses
      profiles: {
        Row: {
          id: string
          wallet_address: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          kyc_status: string
          kyc_verified_at: string | null
          kyc_expiry: string | null
          accreditation_type: number
          jurisdiction: string | null
          risk_tolerance: string
          notification_preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          kyc_expiry?: string | null
          accreditation_type?: number
          jurisdiction?: string | null
          risk_tolerance?: string
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          kyc_status?: string
          kyc_verified_at?: string | null
          kyc_expiry?: string | null
          accreditation_type?: number
          jurisdiction?: string | null
          risk_tolerance?: string
          notification_preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      
      // Transaction history for deposits, withdrawals, transfers
      transactions: {
        Row: {
          id: string
          wallet_address: string
          tx_hash: string
          tx_type: string
          vault_address: string | null
          amount: string
          shares: string | null
          asset_symbol: string
          status: string
          block_number: number | null
          gas_used: string | null
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          wallet_address: string
          tx_hash: string
          tx_type: string
          vault_address?: string | null
          amount: string
          shares?: string | null
          asset_symbol: string
          status?: string
          block_number?: number | null
          gas_used?: string | null
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string
          tx_hash?: string
          tx_type?: string
          vault_address?: string | null
          amount?: string
          shares?: string | null
          asset_symbol?: string
          status?: string
          block_number?: number | null
          gas_used?: string | null
          created_at?: string
          confirmed_at?: string | null
        }
        Relationships: []
      }
      
      // Portfolio snapshots for historical tracking
      portfolio_snapshots: {
        Row: {
          id: string
          wallet_address: string
          total_value_usd: string
          positions: Json
          snapshot_date: string
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          total_value_usd: string
          positions: Json
          snapshot_date: string
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          total_value_usd?: string
          positions?: Json
          snapshot_date?: string
          created_at?: string
        }
        Relationships: []
      }
      
      // User watchlist for assets/vaults
      watchlist: {
        Row: {
          id: string
          wallet_address: string
          asset_address: string
          asset_symbol: string
          asset_name: string
          added_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          asset_address: string
          asset_symbol: string
          asset_name: string
          added_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          asset_address?: string
          asset_symbol?: string
          asset_name?: string
          added_at?: string
        }
        Relationships: []
      }
      
      // Notifications/alerts for users
      notifications: {
        Row: {
          id: string
          wallet_address: string
          type: string
          title: string
          message: string
          read: boolean
          data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          wallet_address: string
          type: string
          title: string
          message: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          wallet_address?: string
          type?: string
          title?: string
          message?: string
          read?: boolean
          data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      
      // KYC documents and verification records
      kyc_documents: {
        Row: {
          id: string
          wallet_address: string
          document_type: string
          document_name: string
          file_url: string | null
          status: string
          submitted_at: string
          reviewed_at: string | null
          reviewer_notes: string | null
        }
        Insert: {
          id?: string
          wallet_address: string
          document_type: string
          document_name: string
          file_url?: string | null
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
        }
        Update: {
          id?: string
          wallet_address?: string
          document_type?: string
          document_name?: string
          file_url?: string | null
          status?: string
          submitted_at?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
        }
        Relationships: []
      }
      
      // Price history for assets
      price_history: {
        Row: {
          id: string
          asset_address: string
          asset_symbol: string
          price_usd: string
          market_cap: string | null
          volume_24h: string | null
          recorded_at: string
        }
        Insert: {
          id?: string
          asset_address: string
          asset_symbol: string
          price_usd: string
          market_cap?: string | null
          volume_24h?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          asset_address?: string
          asset_symbol?: string
          price_usd?: string
          market_cap?: string | null
          volume_24h?: string | null
          recorded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      kyc_status: 'pending' | 'verified' | 'rejected' | 'expired'
      tx_type: 'deposit' | 'withdraw' | 'redeem' | 'transfer' | 'approve'
      tx_status: 'pending' | 'confirmed' | 'failed'
      document_type: 'identity' | 'address' | 'accreditation' | 'tax'
      document_status: 'pending' | 'approved' | 'rejected'
      notification_type: 'transaction' | 'kyc' | 'alert' | 'system' | 'price'
      risk_tolerance: 'conservative' | 'moderate' | 'aggressive'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for Supabase operations
type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Transaction = Database['public']['Tables']['transactions']['Row']
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
export type TransactionUpdate = Database['public']['Tables']['transactions']['Update']

export type PortfolioSnapshot = Database['public']['Tables']['portfolio_snapshots']['Row']
export type PortfolioSnapshotInsert = Database['public']['Tables']['portfolio_snapshots']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

export type KYCDocument = Database['public']['Tables']['kyc_documents']['Row']
export type KYCDocumentInsert = Database['public']['Tables']['kyc_documents']['Insert']

export type WatchlistItem = Database['public']['Tables']['watchlist']['Row']
export type WatchlistInsert = Database['public']['Tables']['watchlist']['Insert']

// Type guards
export type KycStatus = 'pending' | 'verified' | 'rejected' | 'expired'
export type TxType = 'deposit' | 'withdraw' | 'redeem' | 'transfer' | 'approve'
export type TxStatus = 'pending' | 'confirmed' | 'failed'
export type DocumentType = 'identity' | 'address' | 'accreditation' | 'tax'
export type DocumentStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'transaction' | 'kyc' | 'alert' | 'system' | 'price'
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'
