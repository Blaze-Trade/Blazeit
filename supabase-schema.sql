-- Blaze It MVP Database Schema
-- This file contains all the database tables needed for the Blaze It platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (wallet-based authentication)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  email TEXT,
  avatar_url TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00, -- Centralized balance for quest entry fees
  total_winnings DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tokens table (available for trading)
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(20,8) NOT NULL DEFAULT 0,
  change_24h DECIMAL(8,4) NOT NULL DEFAULT 0,
  market_cap DECIMAL(20,2) NOT NULL DEFAULT 0,
  logo_url TEXT,
  address TEXT, -- Blockchain contract address
  decimals INTEGER DEFAULT 8,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quests table (competitive trading quests)
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  entry_fee DECIMAL(10,2) NOT NULL,
  prize_pool DECIMAL(15,2) NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  max_participants INTEGER DEFAULT 100,
  current_participants INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('upcoming', 'active', 'ended')) DEFAULT 'upcoming',
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quest participants table (users who joined quests)
CREATE TABLE quest_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  entry_fee_paid DECIMAL(10,2) NOT NULL,
  final_rank INTEGER,
  prize_won DECIMAL(15,2) DEFAULT 0,
  UNIQUE(quest_id, user_id)
);

-- Quest portfolios table (user holdings within quests)
CREATE TABLE quest_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES tokens(id),
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  entry_price DECIMAL(20,8) NOT NULL,
  current_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(20,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id, token_id)
);

-- User portfolios table (real trading holdings)
CREATE TABLE user_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES tokens(id),
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  average_cost DECIMAL(20,8) NOT NULL,
  total_cost DECIMAL(20,2) NOT NULL DEFAULT 0,
  current_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token_id)
);

-- Watchlists table (user's watchlisted tokens)
CREATE TABLE watchlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_id UUID REFERENCES tokens(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token_id)
);

-- Transactions table (for centralized balance management)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES quests(id), -- NULL for non-quest transactions
  type TEXT CHECK (type IN ('quest_entry', 'prize_payout', 'deposit', 'withdrawal', 'trade_buy', 'trade_sell')) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  token_symbol TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  blockchain_tx_hash TEXT, -- For actual blockchain transactions
  metadata JSONB, -- Additional transaction data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token creation requests table
CREATE TABLE token_creation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  max_supply DECIMAL(20,0),
  target_supply DECIMAL(20,0),
  virtual_liquidity DECIMAL(10,2),
  curve_exponent INTEGER DEFAULT 2,
  mint_limit_per_address DECIMAL(20,0),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'deployed')) DEFAULT 'pending',
  blockchain_address TEXT, -- Set when deployed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard entries (calculated performance data)
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  portfolio_value DECIMAL(20,2) NOT NULL,
  pnl_percent DECIMAL(8,4) NOT NULL,
  total_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quest_id, user_id)
);

-- Indexes for better performance
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_active ON tokens(is_active);
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_quests_start_time ON quests(start_time);
CREATE INDEX idx_quest_participants_quest_id ON quest_participants(quest_id);
CREATE INDEX idx_quest_participants_user_id ON quest_participants(user_id);
CREATE INDEX idx_quest_portfolios_quest_user ON quest_portfolios(quest_id, user_id);
CREATE INDEX idx_user_portfolios_user_id ON user_portfolios(user_id);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_leaderboard_quest_rank ON leaderboard_entries(quest_id, rank);

-- Row Level Security (RLS) policies
-- Temporarily disable RLS for development (enable when proper auth is implemented)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quest_participants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quest_portfolios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE token_creation_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = wallet_address);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Users can insert their own data
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- Tokens are publicly readable
CREATE POLICY "Tokens are publicly readable" ON tokens FOR SELECT USING (true);

-- Quests are publicly readable
CREATE POLICY "Quests are publicly readable" ON quests FOR SELECT USING (true);

-- Users can create quests
CREATE POLICY "Users can create quests" ON quests FOR INSERT WITH CHECK (true);

-- Quest participants can view their own participation
CREATE POLICY "Users can view own quest participation" ON quest_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = quest_participants.user_id AND users.wallet_address = auth.uid()::text)
);

-- Users can join quests
CREATE POLICY "Users can join quests" ON quest_participants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = quest_participants.user_id AND users.wallet_address = auth.uid()::text)
);

-- Quest portfolios are readable by participants
CREATE POLICY "Quest portfolios readable by participants" ON quest_portfolios FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = quest_portfolios.user_id AND users.wallet_address = auth.uid()::text)
);

-- Users can update their quest portfolios
CREATE POLICY "Users can update own quest portfolios" ON quest_portfolios FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = quest_portfolios.user_id AND users.wallet_address = auth.uid()::text)
);

-- User portfolios are readable by owner
CREATE POLICY "User portfolios readable by owner" ON user_portfolios FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_portfolios.user_id AND users.wallet_address = auth.uid()::text)
);

-- Users can update their own portfolios
CREATE POLICY "Users can update own portfolios" ON user_portfolios FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = user_portfolios.user_id AND users.wallet_address = auth.uid()::text)
);

-- Watchlists are readable by owner
CREATE POLICY "Watchlists readable by owner" ON watchlists FOR SELECT USING (true);

-- Users can manage their own watchlists
CREATE POLICY "Users can manage own watchlists" ON watchlists FOR ALL USING (true);

-- Transactions are readable by owner
CREATE POLICY "Transactions readable by owner" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = transactions.user_id AND users.wallet_address = auth.uid()::text)
);

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions" ON transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = transactions.user_id AND users.wallet_address = auth.uid()::text)
);

-- Token creation requests are readable by creator
CREATE POLICY "Token creation requests readable by creator" ON token_creation_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = token_creation_requests.creator_id AND users.wallet_address = auth.uid()::text)
);

-- Users can create token creation requests
CREATE POLICY "Users can create token requests" ON token_creation_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = token_creation_requests.creator_id AND users.wallet_address = auth.uid()::text)
);

-- Leaderboard entries are publicly readable
CREATE POLICY "Leaderboard entries are publicly readable" ON leaderboard_entries FOR SELECT USING (true);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE ON tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quest_portfolios_updated_at BEFORE UPDATE ON quest_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_portfolios_updated_at BEFORE UPDATE ON user_portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_token_creation_requests_updated_at BEFORE UPDATE ON token_creation_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial mock data
INSERT INTO tokens (symbol, name, price, change_24h, market_cap, logo_url, address, decimals) VALUES
('APT', 'Aptos', 8.83, 2.15, 3900000000, 'https://s2.coinmarketcap.com/static/img/coins/64x64/21794.png', '0x1::aptos_coin::AptosCoin', 8),
('SUI', 'Sui', 1.03, -1.45, 2400000000, 'https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png', '0x1::sui::Sui', 9),
('BTC', 'Bitcoin', 67500.00, 0.5, 1300000000000, 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', '0x1::bitcoin::Bitcoin', 8),
('ETH', 'Ethereum', 3500.00, 1.2, 420000000000, 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', '0x1::ethereum::Ethereum', 18),
('SOL', 'Solana', 150.00, -3.0, 69000000000, 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', '0x1::solana::Solana', 9);

INSERT INTO quests (name, entry_fee, prize_pool, duration_hours, start_time, end_time, status, current_participants) VALUES
('Aptos Arena: The Alpha Run', 10, 1000, 168, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '1 week', 'upcoming', 42),
('DeFi Degens: High-Risk Rumble', 50, 15000, 72, NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 days', 'upcoming', 121),
('Meme Coin Mayhem', 5, 500, 24, NOW() + INTERVAL '30 minutes', NOW() + INTERVAL '1 day', 'upcoming', 350),
('The Genesis Block Challenge', 100, 50000, 720, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 'active', 8);
