# 🔴 401 Error Fix Guide

## Problem Identified
Your Supabase anon key is invalid (appears to be two JWT tokens concatenated), causing **401 Unauthorized** errors when trying to access Supabase.

## Step-by-Step Fix

### Step 1: Get the Correct Supabase Anon Key

1. Go to: https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/settings/api

2. Under "Project API keys", you'll see two keys:
   - **`anon` `public`** ← Use this one!
   - **`service_role` `secret`** ← Don't use this!

3. Click the **copy** icon next to the `anon public` key

4. The correct key should look like this (single JWT with exactly 2 dots):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybmlvcmp4YWZxbXJha2VubXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDUwNjYsImV4cCI6MjA3NDkyMTA2Nn0.XXXXXX
   ```

### Step 2: Update Your .env.local File

1. Open `.env.local` in your editor

2. Replace line 19 with the correct key:
   ```bash
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-the-correct-key-here>
   ```

3. Save the file

### Step 3: Reset the Migration Flag

1. Open `reset-migration.html` in your browser:
   - Right-click the file in VS Code
   - Choose "Open with Live Server" or "Open in Browser"

2. Click **"📊 Check LocalStorage Data"** to see your data

3. Click **"🔄 Reset Migration Flag"** to allow retry

### Step 4: Restart Your Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 5: Try Migration Again

1. Open http://localhost:3000 in browser
2. Open Console (F12)
3. Sign in with Google
4. The migration modal should appear OR click "Migrate to Cloud" button
5. Watch the console logs - you should now see successful migration!

### Expected Console Output (After Fix)

```
🔄 Starting tag migration...
📊 Found 5 tags in localStorage: [...]
🏷️ Processing tag: Interactive Brokers
  ↳ Creating custom tag...
  ✅ Created: abc-123-def
✅ Tags migrated: 5/5

🔄 Starting transaction migration...
📊 Found 10 transactions in localStorage: [...]
💼 Processing transaction: AAPL (BUY) - 10 shares
  ↳ Mapped tags: 1 → 1
  ✅ Created transaction: xyz-789-abc
✅ Transactions migrated: 10/10
```

## Verification

After migration completes:

1. **Check Supabase Dashboard:**
   - Go to https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/editor
   - Click on `tags` table → You should see your tags
   - Click on `transactions` table → You should see your transactions

2. **Refresh the app:**
   - Your data should now load from Supabase
   - Try opening the app on another browser (signed in with same Google account)
   - Your data should be there!

## If Still Getting 401

### Check Authentication:
```javascript
// In browser console:
document.cookie
```
Should show `next-auth.session-token`

### Check Supabase RLS Policies:
1. Go to: https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/auth/policies
2. Make sure policies are enabled for:
   - `tags` table: SELECT, INSERT, UPDATE, DELETE
   - `transactions` table: SELECT, INSERT, UPDATE, DELETE
   - `transaction_tags` table: SELECT, INSERT, DELETE

### Re-run the Schema Setup:
If tables or policies are missing:
1. Go to SQL Editor in Supabase
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it

## Need More Help?

Share:
1. The exact anon key you copied from Supabase (just first 50 characters)
2. Console logs from migration attempt
3. Any error messages in the Network tab (F12 → Network → filter "supabase")
