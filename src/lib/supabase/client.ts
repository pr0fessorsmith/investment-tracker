import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side operations
 * This client automatically handles session management
 * Returns null if environment variables are not configured
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return null if env vars are not set (will use localStorage fallback)
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Using localStorage fallback.')
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
