# 🚀 Add Environment Variables to Vercel

## Why Migration Doesn't Work on Vercel Yet

Your Vercel deployment is **missing the Supabase environment variables**, so:
- ❌ Supabase client returns `null`
- ❌ Migration can't connect to your database
- ❌ Cloud storage is disabled
- ✅ App still works with localStorage only

## Step-by-Step: Add Env Vars to Vercel

### Step 1: Go to Your Vercel Project Settings

1. Open: https://vercel.com/dashboard
2. Click on your project: **`investment-tracker`**
3. Click the **Settings** tab at the top
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Supabase URL

1. Click **Add New** button
2. Fill in:
   ```
   Key: NEXT_PUBLIC_SUPABASE_URL
   Value: https://nrniorjxafqmrakenmru.supabase.co
   ```
3. Select environments: ✅ **Production** ✅ **Preview** ✅ **Development**
4. Click **Save**

### Step 3: Add Supabase Anon Key

1. Click **Add New** button again
2. Fill in:
   ```
   Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybmlvcmp4YWZxbXJha2VubXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDUwNjYsImV4cCI6MjA3NDkyMTA2Nn0.08Uecm_mz2INzF8TpGvt4ElwB8xiorUKkGSPKeRoeeU
   ```
3. Select environments: ✅ **Production** ✅ **Preview** ✅ **Development**
4. Click **Save**

### Step 4: Redeploy

You have **two options**:

#### Option A: Trigger Automatic Redeploy (Recommended)
```bash
git commit --allow-empty -m "Trigger Vercel redeploy with Supabase env vars"
git push
```

#### Option B: Manual Redeploy in Vercel Dashboard
1. Go to the **Deployments** tab
2. Find the latest deployment
3. Click the three dots `⋯` button
4. Click **Redeploy**
5. Check ✅ **Use existing Build Cache**
6. Click **Redeploy**

### Step 5: Verify It Works

1. Wait for deployment to complete (1-2 minutes)
2. Visit your Vercel URL
3. Open browser console (F12)
4. Sign in with Google
5. You should see the migration modal OR the "Migrate to Cloud" button
6. Check console logs during migration - should show successful migration!

## What Should Happen After Adding Env Vars

### Before (Current State):
- ❌ Migration returns error or 0 items
- ❌ Data only in localStorage
- ❌ Can't sync across devices

### After (With Env Vars):
- ✅ Migration works and uploads data to Supabase
- ✅ Data syncs to cloud
- ✅ Can access from any device
- ✅ Real-time updates

## Troubleshooting

### If migration still fails after adding env vars:

1. **Check the Network tab** (F12 → Network):
   - Filter by "supabase"
   - Look for 401 or 403 errors
   - If you see 401, the anon key might be wrong

2. **Check Supabase RLS policies:**
   - Go to: https://supabase.com/dashboard/project/nrniorjxafqmrakenmru/auth/policies
   - Make sure policies exist for `tags`, `transactions`, `transaction_tags`

3. **Check console logs:**
   - Should see detailed migration progress
   - Look for specific error messages

4. **Verify env vars in Vercel:**
   - Settings → Environment Variables
   - Both variables should be listed
   - Click the eye icon to verify values are correct

## Quick Verification Command

After deployment, run this in browser console on your Vercel URL:
```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Anon Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
```

Should show:
```
Supabase URL: https://nrniorjxafqmrakenmru.supabase.co
Anon Key length: 249
```

---

## Summary Checklist

- [ ] Add `NEXT_PUBLIC_SUPABASE_URL` to Vercel
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vercel
- [ ] Redeploy (git push or manual)
- [ ] Test migration on Vercel URL
- [ ] Check Supabase tables for data
- [ ] Celebrate! 🎉
