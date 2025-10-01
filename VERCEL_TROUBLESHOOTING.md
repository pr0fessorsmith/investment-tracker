# Vercel Deployment Troubleshooting Guide

## Changes Made
1. **Simplified vercel.json** - Removed outdated `builds` configuration (Next.js 14+ doesn't need it)
2. **Added deployment-check.json** - Visit `https://your-domain.vercel.app/deployment-check.json` to verify deployment

## Common Vercel Deployment Issues

### 1. Check Deployment Version
After the new deployment completes, visit:
```
https://your-domain.vercel.app/deployment-check.json
```

If you see `"deploymentVersion": "tag-system-v2"`, the deployment is working.

### 2. Vercel Dashboard Checks
- **Go to**: https://vercel.com/dashboard
- **Check Project Settings > Git**:
  - ✅ Verify it's connected to: `pr0fessorsmith/investment-tracker`
  - ✅ Verify branch is set to: `main`
  - ✅ Check "Production Branch" is set to `main`

### 3. Build Logs
- Go to your project in Vercel
- Click on the latest deployment
- Check the "Build Logs" tab for any errors
- Look for the build output showing all files including:
  - `src/services/tagService.ts`
  - `src/components/TagManager.tsx`

### 4. Environment Variables
Make sure these are set in Vercel Dashboard > Settings > Environment Variables:
- `NEXTAUTH_URL` - Your production URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET` - A secure random string
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `ALPHA_VANTAGE_API_KEY` - Your Alpha Vantage API key

**IMPORTANT**: After adding/updating environment variables, you MUST redeploy!

### 5. Hard Refresh / Clear Cache
Sometimes browsers cache old versions:
- **Chrome/Edge**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox**: `Ctrl + Shift + R`
- **Safari**: `Cmd + Shift + R`

Or try:
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### 6. Check if Vercel is Actually Building
- Vercel should auto-deploy when you push to `main`
- Check the "Deployments" tab to see if a new deployment started
- If not, click "Redeploy" and select "Use existing Build Cache: OFF"

### 7. Framework Preset
In Vercel Dashboard > Settings > General:
- Framework Preset should be: **Next.js**
- Build Command: Leave as default or set to `npm run build`
- Output Directory: Leave as default (Next.js auto-detects)

### 8. Node.js Version
In Vercel Dashboard > Settings > General:
- Check Node.js Version is set to `18.x` or higher

## Debugging Steps

### Step 1: Verify Local Build Works
```bash
npm run build
npm start
```
Visit http://localhost:3000 - if tags work here, it's a deployment issue.

### Step 2: Check What Was Deployed
Visit your deployed app and check the browser console (F12):
- Look for any JavaScript errors
- Check Network tab for any 404s or failed requests

### Step 3: Force Fresh Deploy
1. Go to Vercel Dashboard
2. Click "Redeploy"
3. **Uncheck** "Use existing Build Cache"
4. Click "Redeploy"

### Step 4: Check Git Integration
```bash
git log --oneline -5
```
Should show commit: `f2b19a3 Fix Vercel deployment configuration`

## Tag System Files to Verify
After deployment, these features should work:
- [ ] "Manage Tags" button visible in navigation
- [ ] Tag input field in Add Transaction form
- [ ] Tag autocomplete shows broker options
- [ ] Tag filter panel in portfolio view
- [ ] Tags displayed on position cards

## Still Not Working?

### Check Vercel Build Output
The build should show these files being compiled:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    129 kB          226 kB
```

### Verify Package Installation
Check if the build log shows:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

### Contact Support Path
If nothing works:
1. Check Vercel deployment logs for specific errors
2. Verify all environment variables are set correctly
3. Try disconnecting and reconnecting the GitHub integration
4. Create a support ticket with Vercel including:
   - Deployment URL
   - Build logs
   - Git commit hash: `f2b19a3`

## Quick Verification Checklist
- [ ] Latest commit `f2b19a3` is pushed to GitHub
- [ ] Vercel dashboard shows new deployment started
- [ ] Build completed successfully (green checkmark)
- [ ] Environment variables are all set
- [ ] Visited deployment-check.json endpoint
- [ ] Hard refreshed browser cache
- [ ] Checked browser console for errors

## Expected Timeline
- **Push to GitHub**: Immediate
- **Vercel detects change**: ~10-30 seconds
- **Build starts**: ~30 seconds
- **Build completes**: ~2-5 minutes
- **Live deployment**: Immediate after build

Total: Usually 3-6 minutes from push to live deployment.
