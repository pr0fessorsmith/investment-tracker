-- SECURE Schema for NextAuth Integration
-- This schema properly isolates user data with RLS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE (NextAuth compatible)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- User's email from NextAuth
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
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
-- TRANSACTION_TAGS TABLE (Junction Table)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transaction_tags (
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (transaction_id, tag_id)
);

-- =====================================================
-- SECURE ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transaction tags" ON public.transaction_tags;
DROP POLICY IF EXISTS "Users can insert own transaction tags" ON public.transaction_tags;
DROP POLICY IF EXISTS "Users can delete own transaction tags" ON public.transaction_tags;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (id = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow user creation (for auto-migration)
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (id = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- TAGS TABLE POLICIES (User Isolation)
-- =====================================================
-- Users can only view their own tags
CREATE POLICY "Users can view own tags"
    ON public.tags FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only insert tags with their own user_id
CREATE POLICY "Users can insert own tags"
    ON public.tags FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only update their own tags
CREATE POLICY "Users can update own tags"
    ON public.tags FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only delete their own tags
CREATE POLICY "Users can delete own tags"
    ON public.tags FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- TRANSACTIONS TABLE POLICIES (User Isolation)
-- =====================================================
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions"
    ON public.transactions FOR SELECT
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only insert transactions with their own user_id
CREATE POLICY "Users can insert own transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only update their own transactions
CREATE POLICY "Users can update own transactions"
    ON public.transactions FOR UPDATE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- Users can only delete their own transactions
CREATE POLICY "Users can delete own transactions"
    ON public.transactions FOR DELETE
    USING (user_id = current_setting('request.jwt.claims', true)::json->>'email');

-- =====================================================
-- TRANSACTION_TAGS POLICIES (Through Transaction Ownership)
-- =====================================================
-- Users can only view transaction_tags for their own transactions
CREATE POLICY "Users can view own transaction tags"
    ON public.transaction_tags FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.transactions
        WHERE transactions.id = transaction_tags.transaction_id
        AND transactions.user_id = current_setting('request.jwt.claims', true)::json->>'email'
    ));

-- Users can only insert transaction_tags for their own transactions
CREATE POLICY "Users can insert own transaction tags"
    ON public.transaction_tags FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.transactions
        WHERE transactions.id = transaction_tags.transaction_id
        AND transactions.user_id = current_setting('request.jwt.claims', true)::json->>'email'
    ));

-- Users can only delete transaction_tags for their own transactions
CREATE POLICY "Users can delete own transaction tags"
    ON public.transaction_tags FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.transactions
        WHERE transactions.id = transaction_tags.transaction_id
        AND transactions.user_id = current_setting('request.jwt.claims', true)::json->>'email'
    ));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_category ON public.tags(category);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_symbol ON public.transactions(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_transaction_id ON public.transaction_tags(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag_id ON public.transaction_tags(tag_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Get portfolio positions for a user (secured)
CREATE OR REPLACE FUNCTION get_portfolio_positions(user_email TEXT)
RETURNS TABLE (
    symbol TEXT,
    total_shares DECIMAL,
    average_price DECIMAL,
    total_invested DECIMAL,
    transaction_count BIGINT,
    first_purchase_date DATE,
    last_transaction_date DATE
) AS $$
BEGIN
    -- Security: Only return data for the requesting user
    IF user_email != current_setting('request.jwt.claims', true)::json->>'email' THEN
        RAISE EXCEPTION 'Unauthorized access attempt';
    END IF;

    RETURN QUERY
    SELECT 
        t.symbol,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) as total_shares,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE 0 END) / 
            NULLIF(SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE 0 END), 0) as average_price,
        SUM(CASE WHEN t.type = 'buy' THEN t.shares * t.price ELSE -t.shares * t.price END) as total_invested,
        COUNT(*)::BIGINT as transaction_count,
        MIN(t.date) as first_purchase_date,
        MAX(t.date) as last_transaction_date
    FROM public.transactions t
    INNER JOIN public.users u ON t.user_id = u.id
    WHERE u.email = user_email
    GROUP BY t.symbol
    HAVING SUM(CASE WHEN t.type = 'buy' THEN t.shares ELSE -t.shares END) > 0
    ORDER BY t.symbol;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables (RLS will enforce user isolation)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_tags TO authenticated, anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_portfolio_positions(TEXT) TO authenticated, anon;
