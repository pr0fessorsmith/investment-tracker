# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub (or create account)
4. Click "New Project"
5. Fill in:
   - **Name**: `investment-tracker`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you (e.g., US East, EU West)
   - **Pricing Plan**: Free
6. Click "Create new project" (takes ~2 minutes)

## Step 2: Run Database Schema

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. You should see success messages for all statements

## Step 3: Get API Credentials

1. Click "Settings" (gear icon) in left sidebar
2. Click "API" under Project Settings
3. You'll need two values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string starting with eyJ)

## Step 4: Configure Environment Variables

### Local Development (.env.local)

Create or update `.env.local` in your project root:

```bash
# Existing variables (keep these)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# NEW: Add Supabase variables
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...your-anon-key-here
```

### Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these NEW variables:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Production, Preview, Development (check all)
   
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your Supabase anon key
   - **Environment**: Production, Preview, Development (check all)

5. Click "Save"
6. Redeploy your app

## Step 5: Configure Supabase Authentication

Since you're using Google OAuth with NextAuth.js, we need to link it to Supabase:

1. In Supabase dashboard, go to "Authentication" → "Providers"
2. Scroll down to "Google"
3. Toggle "Enable Sign in with Google"
4. Use the same Google OAuth credentials:
   - **Client ID**: (same as your GOOGLE_CLIENT_ID)
   - **Client Secret**: (same as your GOOGLE_CLIENT_SECRET)
5. Add authorized redirect URL:
   - `https://xxxxx.supabase.co/auth/v1/callback`
6. Click "Save"

## Step 6: Verify Database Tables

1. In Supabase dashboard, click "Table Editor"
2. You should see these tables:
   - ✅ profiles
   - ✅ tags
   - ✅ transactions
   - ✅ transaction_tags

3. Click on each table to verify the structure

## Step 7: Test RLS Policies

1. Go to "Authentication" → "Policies"
2. You should see policies for each table
3. Verify that RLS is enabled (shield icon should be green)

## Database Schema Overview

### Tables

**profiles**
- Extends Supabase auth.users with profile info
- Created automatically on user signup

**tags**
- User-defined tags for organizing investments
- Categories: broker, strategy, sector, custom
- Each user has their own tags

**transactions**
- All buy/sell transactions
- Links to user via user_id

**transaction_tags**
- Many-to-many relationship
- Links transactions to tags

### Key Features

✅ **Row-Level Security**: Each user only sees their own data
✅ **Auto-timestamps**: created_at and updated_at maintained automatically
✅ **Default tags**: Predefined broker, strategy, and sector tags created on signup
✅ **Helper functions**: get_portfolio_positions() for aggregated data
✅ **Indexes**: Optimized queries for performance
✅ **Multi-tenant ready**: Perfect for SaaS with thousands of users

## Troubleshooting

### "permission denied for schema public"
- Make sure you ran the GRANT statements at the end of schema.sql

### "relation already exists"
- The script uses IF NOT EXISTS, so it's safe to re-run
- If you need to reset: go to SQL Editor and run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then re-run schema.sql

### RLS policies not working
- Verify RLS is enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
- Check that policies exist in Authentication → Policies

### Can't see data in Table Editor
- Table Editor shows admin view (no RLS)
- Test with actual API calls from your app
- Or temporarily disable RLS to view data

## Next Steps

After completing setup:
1. Run the app locally: `npm run dev`
2. Sign in with Google
3. Your profile and default tags will be created automatically
4. Add a transaction to test cloud storage
5. Open app in another browser/device to verify sync

## Migration from localStorage

The app will automatically detect existing localStorage data and offer to migrate it to Supabase on first login. This is a one-time operation and preserves all your existing data.

## Monitoring Usage (Free Tier Limits)

Go to "Settings" → "Usage" to monitor:
- Database size: 500 MB limit
- Active users: 50,000 monthly limit
- API requests: Unlimited
- Bandwidth: 5 GB limit

These limits are very generous for personal use and early SaaS validation!
