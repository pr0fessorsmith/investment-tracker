# 🚨 Migration Still Not Working? Follow This Checklist

## Step 1: Wait for Vercel to Deploy
After the push, wait 1-2 minutes for Vercel to rebuild and deploy.
Check: https://vercel.com/dashboard → Deployments → Should show "Building" or "Ready"

## Step 2: Use the Debug Tool
1. Go to your Vercel URL: `https://your-app.vercel.app/debug-vercel.html`
2. Click all the buttons:
   - 🔬 Check Environment
   - ☁️ Test Supabase Connection
   - 🔐 Check Authentication
   - 📦 Check Migration Status

This will tell you EXACTLY what's wrong.

## Step 3: Common Issues and Fixes

### Issue A: "Environment Variables Missing"
**Symptom:** Debug tool shows ❌ for NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY

**Fix:**
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Settings → Environment Variables
4. Add both variables (see ADD_ENV_VARS_TO_VERCEL.md)
5. Go to Deployments tab
6. Click ⋯ on latest deployment → Redeploy

### Issue B: "401 Unauthorized" when testing Supabase
**Symptom:** Debug tool shows "Status: 401" when testing connection

**Fix:** Your anon key is wrong
1. Go to: https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/settings/api
2. Copy the CORRECT "anon public" key
3. Update it in Vercel environment variables
4. Redeploy

### Issue C: "Migration Flag Set But Data Still Local"
**Symptom:** Migration says "already completed" but data not in Supabase

**Fix:** Click "Reset Migration Flag" button in the debug tool, then refresh

### Issue D: "Not Authenticated"
**Symptom:** No session token found

**Fix:** Sign in with Google first, then try migration

## Step 4: Manual Check in Browser Console

On your Vercel URL, open console (F12) and run:

```javascript
// Check environment variables
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

// Check if migration modal would show
console.log('Has local data:', !!localStorage.getItem('transactions'))
console.log('Migration completed:', localStorage.getItem('supabase_migration_completed'))
```

Expected output if everything is correct:
```
Supabase URL: https://nrniorjxafqmrakenmru.supabase.co
Anon Key: Set
Has local data: true
Migration completed: null
```

## Step 5: Force Migration Manually

If everything above checks out but migration modal doesn't appear:

1. Open browser console on your Vercel URL
2. Run:
```javascript
localStorage.removeItem('supabase_migration_completed')
location.reload()
```

## Step 6: Check Vercel Deployment Logs

1. Go to Vercel Dashboard
2. Click on your latest deployment
3. Look for any errors in the build logs
4. Check "Functions" tab for runtime errors

## Step 7: Verify Supabase Tables

1. Go to: https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/editor
2. Check if tables exist:
   - profiles
   - tags
   - transactions
   - transaction_tags
3. If missing, run the schema: Copy `supabase/schema.sql` → SQL Editor → Execute

## Still Not Working?

Share with me:
1. Screenshot of the debug tool results
2. Console logs from your Vercel URL
3. Screenshot of Vercel environment variables (blur the key values)
4. Any error messages you see

---

## Quick Success Path

✅ **Most Common Solution:**

1. Add env vars to Vercel (if not done)
2. Go to your Vercel URL + `/debug-vercel.html`
3. Click "Reset Migration Flag" if it's set
4. Go back to main page
5. Sign in with Google
6. Migration modal should appear!
