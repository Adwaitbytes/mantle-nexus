-- ============================================
-- MERIDIAN PROTOCOL - SUPABASE DATABASE SCHEMA
-- ============================================
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- User Profiles (linked to wallet addresses)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected', 'expired')),
  kyc_verified_at TIMESTAMPTZ,
  kyc_expiry TIMESTAMPTZ,
  accreditation_type INTEGER DEFAULT 0,
  jurisdiction TEXT,
  risk_tolerance TEXT DEFAULT 'moderate' CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
  notification_preferences JSONB DEFAULT '{"email": false, "push": true, "transactions": true, "alerts": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transaction History
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('deposit', 'withdraw', 'redeem', 'transfer', 'approve')),
  vault_address TEXT,
  amount TEXT NOT NULL,
  shares TEXT,
  asset_symbol TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number INTEGER,
  gas_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Portfolio Snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  total_value_usd TEXT NOT NULL,
  positions JSONB NOT NULL,
  snapshot_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, snapshot_date)
);

-- User Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  asset_address TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_address, asset_address)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'kyc', 'alert', 'system', 'price')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('identity', 'address', 'accreditation', 'tax')),
  document_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT
);

-- Price History
CREATE TABLE IF NOT EXISTS price_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_address TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  price_usd TEXT NOT NULL,
  market_cap TEXT,
  volume_24h TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_wallet_date ON portfolio_snapshots(wallet_address, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_watchlist_wallet ON watchlist(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON notifications(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(wallet_address, read);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_wallet ON kyc_documents(wallet_address);
CREATE INDEX IF NOT EXISTS idx_price_history_asset ON price_history(asset_address, recorded_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running schema)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can insert own snapshots" ON portfolio_snapshots;
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can manage own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own documents" ON kyc_documents;
DROP POLICY IF EXISTS "Users can submit documents" ON kyc_documents;
DROP POLICY IF EXISTS "Anyone can view prices" ON price_history;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true);

-- Transactions: Users can only access their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (true);

-- Portfolio Snapshots: Users can only access their own snapshots
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own snapshots" ON portfolio_snapshots
  FOR INSERT WITH CHECK (true);

-- Watchlist: Users can only access their own watchlist
CREATE POLICY "Users can view own watchlist" ON watchlist
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own watchlist" ON watchlist
  FOR ALL USING (true);

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (true);

-- KYC Documents: Users can only access their own documents
CREATE POLICY "Users can view own documents" ON kyc_documents
  FOR SELECT USING (true);

CREATE POLICY "Users can submit documents" ON kyc_documents
  FOR INSERT WITH CHECK (true);

-- Price History: Everyone can read
CREATE POLICY "Anyone can view prices" ON price_history
  FOR SELECT USING (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for transactions and notifications (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Uncomment to insert sample data
/*
INSERT INTO price_history (asset_address, asset_symbol, price_usd) VALUES
  ('0xD40BF1C403b289186d676D7B9a6Ce654998D306F', 'MRDL', '1.00'),
  ('0x005017f38a44AB883c0D04EF8cf7CB3570afd703', 'mUSTB', '1.00');
*/
