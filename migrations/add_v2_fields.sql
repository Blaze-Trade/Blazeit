-- Launchpad V2 Database Migration
-- Adds support for Bancor bonding curve, DEX migration, and enhanced metadata

-- Add V2 fields to tokens table
ALTER TABLE public.tokens
  -- Bancor Curve Parameters
  ADD COLUMN IF NOT EXISTS reserve_ratio INTEGER DEFAULT 50 CHECK (reserve_ratio >= 1 AND reserve_ratio <= 100),
  ADD COLUMN IF NOT EXISTS reserve_balance NUMERIC(20,8) DEFAULT 0 CHECK (reserve_balance >= 0),
  ADD COLUMN IF NOT EXISTS initial_reserve_apt NUMERIC(20,8) DEFAULT 0.1,

  -- Migration Settings
  ADD COLUMN IF NOT EXISTS market_cap_threshold_usd INTEGER DEFAULT 75000 CHECK (market_cap_threshold_usd > 0),
  ADD COLUMN IF NOT EXISTS migration_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS migration_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hyperion_pool_address TEXT,

  -- Trading Status
  ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS bonding_curve_active BOOLEAN DEFAULT true,

  -- Social Links (JSONB for flexibility)
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.tokens.reserve_ratio IS 'Bancor reserve ratio (1-100%), higher = more stable price';
COMMENT ON COLUMN public.tokens.reserve_balance IS 'Current APT balance in bonding curve reserve';
COMMENT ON COLUMN public.tokens.initial_reserve_apt IS 'Initial APT used to bootstrap the bonding curve';
COMMENT ON COLUMN public.tokens.market_cap_threshold_usd IS 'Market cap in USD at which token migrates to DEX (default $75,000)';
COMMENT ON COLUMN public.tokens.migration_completed IS 'Whether token has migrated from bonding curve to Hyperion DEX';
COMMENT ON COLUMN public.tokens.migration_timestamp IS 'When the token was migrated to DEX';
COMMENT ON COLUMN public.tokens.hyperion_pool_address IS 'Hyperion DEX pool address after migration';
COMMENT ON COLUMN public.tokens.trading_enabled IS 'Whether trading is enabled for this token';
COMMENT ON COLUMN public.tokens.bonding_curve_active IS 'Whether bonding curve is active (false after migration)';
COMMENT ON COLUMN public.tokens.social_links IS 'Social media links (website, twitter, telegram, discord) stored as JSON';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tokens_migration_completed ON public.tokens(migration_completed);
CREATE INDEX IF NOT EXISTS idx_tokens_bonding_curve_active ON public.tokens(bonding_curve_active);
CREATE INDEX IF NOT EXISTS idx_tokens_reserve_balance ON public.tokens(reserve_balance);

-- Add trigger to update updated_at automatically (if not already exists)
-- This ensures tokens.updated_at is set whenever reserve_balance changes

