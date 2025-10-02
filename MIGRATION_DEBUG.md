# Migration Debugging Guide

## What's Been Fixed

1. **Added Comprehensive Logging** - The migration process now logs every step to the browser console
2. **Authentication Check** - Migration now verifies Supabase is available before starting
3. **Manual Migration Button** - Added a "Migrate to Cloud" button in the portfolio view (only shows when authenticated and local data exists)
4. **Public isAvailable()** - Services can now check if Supabase is configured

## How to Debug the Migration Issue

### Step 1: Open Browser Developer Tools
1. Open your app in the browser
2. Press `F12` or right-click → "Inspect"
3. Click on the **Console** tab

### Step 2: Check Authentication
In the console, type:
```javascript
localStorage.getItem('investment-tags')
localStorage.getItem('transactions')
```

This will show if you have local data. You should see JSON data.

### Step 3: Trigger Migration
1. Make sure you're signed in with Google
2. Look for the blue "Migrate to Cloud" button near the tag filter in the portfolio section
3. Click it to open the migration dialog
4. Click "Start Migration"

### Step 4: Watch the Console Logs

You should see detailed logs like:
```
🔄 Starting tag migration...
📊 Found X tags in localStorage: [...]
🏷️ Processing tag: Broker (id)
  ✅ Created: abc123
✅ Tags migrated: X/Y
🔄 Starting transaction migration...
📊 Found X transactions in localStorage: [...]
💼 Processing transaction: AAPL (BUY) - 10 shares
  ↳ Mapped tags: 1 → 1
  ✅ Created transaction: xyz789
✅ Transactions migrated: X/Y
```

### Step 5: Common Issues and Solutions

#### Issue: "Cloud storage not available"
**Solution**: Make sure you're signed in with Google and Supabase environment variables are set.

#### Issue: Tags migrated: 0/X
**Possible causes**:
- Supabase is not responding (check network tab for 401/403 errors)
- RLS policies blocking inserts (check Supabase dashboard logs)
- Authentication token not being sent

**Debug**: In console, run:
```javascript
// Check if signed in
document.cookie.includes('next-auth.session-token')

// Check Supabase client
// (This will only work after migration starts)
```

#### Issue: Transactions migrated: 0/X but tags worked
**Possible causes**:
- Transaction structure mismatch
- Foreign key constraint errors (tags not created)

**Solution**: Check the console for specific error messages from SupabaseTransactionService

### Step 6: Manual Testing

You can also test migration directly in the console:

```javascript
// Import the migration service
import { DataMigration } from './services/supabase/dataMigration'

// Check local data
DataMigration.hasLocalStorageData()

// Run migration
const result = await DataMigration.migrateToSupabase()
console.log(result)
```

### Step 7: Check Supabase Database

1. Go to https://supabase.com
2. Open your project dashboard
3. Click "Table Editor" in the sidebar
4. Check the tables:
   - `profiles` - Should have your user profile
   - `tags` - Should have your migrated tags
   - `transactions` - Should have your migrated transactions
   - `transaction_tags` - Should have tag relationships

### Step 8: Check RLS Policies

If tables are empty after "successful" migration:
1. In Supabase dashboard, go to "Authentication" → "Policies"
2. For each table (`tags`, `transactions`, `transaction_tags`), verify:
   - ✅ SELECT: Enabled for authenticated users
   - ✅ INSERT: Enabled for authenticated users
   - ✅ UPDATE: Enabled for authenticated users (own data)
   - ✅ DELETE: Enabled for authenticated users (own data)

### Expected Console Output (Successful Migration)

```
🔄 Starting tag migration...
📊 Found 5 tags in localStorage: [...]
🏷️ Processing tag: Interactive Brokers (predefined-broker-1)
  ↳ Predefined tag, looking for equivalent in Supabase...
  ⚠️ No equivalent found
🏷️ Processing tag: Day Trading (custom-strategy-1)
  ↳ Creating custom tag...
  ✅ Created: e7f8a9b0-1234-5678-9abc-def123456789
✅ Tags migrated: 1/5
🔄 Starting transaction migration...
📊 Found 10 transactions in localStorage: [...]
💼 Processing transaction: AAPL (BUY) - 10 shares
  ↳ Mapped tags: 1 → 1
  ✅ Created transaction: a1b2c3d4-5678-90ef-ghij-klmnopqrstuv
✅ Transactions migrated: 10/10
```

### Next Steps

After you try the migration again:
1. Copy the console logs (right-click → "Save as...")
2. Check the Supabase tables
3. Report back with:
   - What the console logs showed
   - What error messages appeared (if any)
   - What's in your Supabase tables
