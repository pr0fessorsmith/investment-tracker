import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for client-side operations
 * This client automatically handles session management
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
