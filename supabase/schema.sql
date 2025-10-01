-- Investment Tracker Database Schema
-- Created for Supabase integration
-- Supports multi-tenant SaaS architecture with Row-Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- This table extends Supabase auth.users with profile information
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TAGS TABLE
-- =====================================================
-- Stores user-defined tags for organizing investments
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    category TEXT CHECK (category IN ('broker', 'strategy', 'sector', 'custom')) DEFAULT 'custom',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
-- Stores all buy/sell transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
    shares DECIMAL(18, 8) NOT NULL CHECK (shares > 0),
    price DECIMAL(18, 2) NOT NULL CHECK (price > 0),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTION_TAGS TABLE (Many-to-Many relationship)
-- =====================================================
-- Links transactions to tags
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (transaction_id, tag_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
-- User-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);

-- Transaction queries
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON public.transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_symbol ON public.transactions(user_id, symbol);

-- Tag relationship queries
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction ON public.transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag ON public.transaction_tags(tag_id);

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- TAGS POLICIES
-- =====================================================
-- Users can view their own tags
CREATE POLICY "Users can view own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own tags
CREATE POLICY "Users can create own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tags
CREATE POLICY "Users can update own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own tags
CREATE POLICY "Users can delete own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "Users can create own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTION_TAGS POLICIES
-- =====================================================
-- Users can view tags for their own transactions
CREATE POLICY "Users can view own transaction tags"
    ON public.transaction_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = transaction_tags.transaction_id
            AND transactions.user_id = auth.uid()
        )
    );

-- Users can create tags for their own transactions
CREATE POLICY "Users can create own transaction tags"
    ON public.transaction_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = transaction_tags.transaction_id
            AND transactions.user_id = auth.uid()
        )
    );

-- Users can delete tags from their own transactions
CREATE POLICY "Users can delete own transaction tags"
    ON public.transaction_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.transactions
            WHERE transactions.id = transaction_tags.transaction_id
            AND transactions.user_id = auth.uid()
        )
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Function to get portfolio positions for a user
CREATE OR REPLACE FUNCTION get_portfolio_positions(user_uuid UUID)
RETURNS TABLE (
    symbol TEXT,
    total_shares DECIMAL,
    avg_price DECIMAL,
    total_invested DECIMAL,
    transaction_count BIGINT,
    first_purchase_date DATE,
    last_transaction_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.symbol,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) as total_shares,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE 0 END) / 
        NULLIF(SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE 0 END), 0) as avg_price,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE -t.shares * t.price END) as total_invested,
        COUNT(*)::BIGINT as transaction_count,
        MIN(t.date) as first_purchase_date,
        MAX(t.date) as last_transaction_date
    FROM public.transactions t
    WHERE t.user_id = user_uuid
    GROUP BY t.symbol
    HAVING SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) > 0
    ORDER BY t.symbol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DEFAULT TAGS (Optional)
-- =====================================================
-- This function creates default tags for a new user
CREATE OR REPLACE FUNCTION create_default_tags_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Broker tags
    INSERT INTO public.tags (user_id, name, color, category) VALUES
        (user_uuid, 'Robinhood', '#00C805', 'broker'),
        (user_uuid, 'Fidelity', '#00A650', 'broker'),
        (user_uuid, 'Charles Schwab', '#0077C8', 'broker'),
        (user_uuid, 'E*TRADE', '#6633CC', 'broker'),
        (user_uuid, 'TD Ameritrade', '#00A651', 'broker'),
        (user_uuid, 'Interactive Brokers', '#D71921', 'broker'),
        (user_uuid, 'Webull', '#0064FF', 'broker'),
        (user_uuid, 'Vanguard', '#C00000', 'broker')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Strategy tags
    INSERT INTO public.tags (user_id, name, color, category) VALUES
        (user_uuid, 'Long Term', '#10B981', 'strategy'),
        (user_uuid, 'Short Term', '#F59E0B', 'strategy'),
        (user_uuid, 'Day Trade', '#EF4444', 'strategy'),
        (user_uuid, 'Dividend', '#3B82F6', 'strategy'),
        (user_uuid, 'Growth', '#8B5CF6', 'strategy'),
        (user_uuid, 'Value', '#14B8A6', 'strategy'),
        (user_uuid, 'Swing Trade', '#F97316', 'strategy'),
        (user_uuid, 'Momentum', '#EC4899', 'strategy')
    ON CONFLICT (user_id, name) DO NOTHING;

    -- Sector tags
    INSERT INTO public.tags (user_id, name, color, category) VALUES
        (user_uuid, 'Technology', '#6366F1', 'sector'),
        (user_uuid, 'Healthcare', '#EF4444', 'sector'),
        (user_uuid, 'Finance', '#10B981', 'sector'),
        (user_uuid, 'Energy', '#F59E0B', 'sector'),
        (user_uuid, 'Consumer', '#8B5CF6', 'sector'),
        (user_uuid, 'Industrial', '#64748B', 'sector'),
        (user_uuid, 'Real Estate', '#14B8A6', 'sector'),
        (user_uuid, 'Crypto', '#F97316', 'sector')
    ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER TO CREATE PROFILE ON USER SIGNUP
-- =====================================================
-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create default tags for the new user
    PERFORM create_default_tags_for_user(NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.transactions TO authenticated;
GRANT ALL ON public.transaction_tags TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_portfolio_positions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_tags_for_user(UUID) TO authenticated;
