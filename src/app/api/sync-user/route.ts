import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to ensure user exists in Supabase
 * Called after NextAuth authentication
 */
export async function POST(request: Request) {
  try {
    // Get NextAuth session
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Upsert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: session.user.email, // Use email as ID
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting user:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (error) {
    console.error('Error in sync-user API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
