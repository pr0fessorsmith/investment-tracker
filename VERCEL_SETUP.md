# Vercel Environment Variables Setup

## 🎉 Your Deployment is Now Ready!

The code has been fixed to handle missing Supabase environment variables gracefully. The build succeeds even without them configured.

## ⚠️ IMPORTANT: Migration Won't Work Until You Add Env Vars

If you're testing on your Vercel URL and migration doesn't work, it's because **Supabase environment variables are not configured yet** in Vercel.

### What Works Now (Without Env Vars):
- ✅ App builds and deploys successfully
- ✅ App runs without errors
- ✅ localStorage works (data stored locally in browser)

### What Doesn't Work (Without Env Vars):
- ❌ Cloud storage disabled
- ❌ Migration won't upload data
- ❌ Google Auth works but data doesn't sync
- ❌ Can't access data from other devices

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Copy Your Supabase Credentials

From your `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://nrniorjxafqmrakenmru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybmlvcmp4YWZxbXJha2VubXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDUwNjYsImV4cCI6MjA3NDkyMTA2Nn0.08Uecm_mz2INzF8TpGvt4ElwB8xiorUKkGSPKeRoeeU
```

### Step 2: Add to Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Click your **`investment-tracker`** project
3. Click **Settings** → **Environment Variables**
4. Add both variables (click "Add New" for each):

   **Variable 1:**
   - Key: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://nrniorjxafqmrakenmru.supabase.co`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybmlvcmp4YWZxbXJha2VubXJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDUwNjYsImV4cCI6MjA3NDkyMTA2Nn0.08Uecm_mz2INzF8TpGvt4ElwB8xiorUKkGSPKeRoeeU`
   - Environments: ✅ Production ✅ Preview ✅ Development

### Step 3: Redeploy

```bash
# Trigger automatic redeploy
git commit --allow-empty -m "Trigger Vercel redeploy with Supabase env vars"
git push
```

OR manually redeploy in Vercel dashboard (Deployments → ⋯ → Redeploy)

---

## 📋 Detailed Instructions

### Adding Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (`investment-tracker`)
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. Add each variable:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: (paste your Supabase URL)
   - **Environments**: Check all three boxes (Production, Preview, Development)
   - Click **Save**
   
   - **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: (paste your Supabase anon key)
   - **Environments**: Check all three boxes (Production, Preview, Development)
   - Click **Save**

### Redeploy

After adding the environment variables:
1. Go to the **Deployments** tab
2. Click the three dots `...` on the latest deployment
3. Click **Redeploy**

OR simply push a new commit and Vercel will automatically redeploy.

## What Happens Now?

### Without Environment Variables (Current State):
✅ App builds successfully
✅ App runs without errors
✅ Users can use localStorage (data stored locally in browser)
❌ Cloud storage disabled
❌ Google Auth won't sync data
❌ Migration won't upload to cloud

### With Environment Variables (After Setup):
✅ App builds successfully
✅ App runs without errors
✅ Users can use localStorage (unauthenticated)
✅ Cloud storage enabled for authenticated users
✅ Google Auth works with data sync
✅ Data syncs across devices
✅ Migration tool uploads data to Supabase

## Testing

After adding environment variables and redeploying:
1. Visit your Vercel URL
2. Click "Sign in with Google"
3. After login, you should see the migration modal if you had local data
4. Create a new transaction - it will be saved to Supabase
5. Open the app on another device with the same Google account - your data will be there!

## Verification

Check if env vars are working:
1. Open browser console on your Vercel URL (F12)
2. Run:
   ```javascript
   console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
   console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
   ```
3. Should show your Supabase URL and key length of 249

## Support

If you encounter issues:
- Check Vercel deployment logs for errors
- Verify environment variables are set correctly
- Check Supabase dashboard for database activity
- Look at browser console for any client-side errors
- See `ADD_ENV_VARS_TO_VERCEL.md` for detailed troubleshooting
