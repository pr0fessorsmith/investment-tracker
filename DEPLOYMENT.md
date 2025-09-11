# Deployment Guide

## Environment Variables for Production

When deploying to Vercel, you'll need to set these environment variables in your Vercel dashboard:

### Required Environment Variables

1. **NEXTAUTH_URL**
   - For Vercel: `https://your-app-name.vercel.app`
   - This will be your actual deployment URL

2. **NEXTAUTH_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Or use: `your-secret-key-here` (change to a secure random string)

3. **GOOGLE_CLIENT_ID**
   - From Google Cloud Console
   - Your existing value from .env.local

4. **GOOGLE_CLIENT_SECRET**
   - From Google Cloud Console  
   - Your existing value from .env.local

5. **NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY**
   - Your Alpha Vantage API key
   - Your existing value from .env.local

## Vercel Deployment Steps

1. **Push to GitHub** (already done above)

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `investment-tracker` repository

3. **Configure Environment Variables**:
   - In Vercel dashboard, go to your project
   - Navigate to Settings → Environment Variables
   - Add all the variables listed above

4. **Update Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to Credentials
   - Edit your OAuth client
   - Add authorized redirect URI: `https://your-app-name.vercel.app/api/auth/callback/google`

5. **Deploy**:
   - Vercel will automatically deploy
   - Your app will be live at `https://your-app-name.vercel.app`

## Post-Deployment

- Test Google authentication
- Verify Alpha Vantage API calls work
- Test all portfolio features
- Share your live URL!

## Troubleshooting

- **Authentication issues**: Check NEXTAUTH_URL and Google OAuth settings
- **API issues**: Verify Alpha Vantage API key in environment variables
- **Build issues**: Check the build logs in Vercel dashboard