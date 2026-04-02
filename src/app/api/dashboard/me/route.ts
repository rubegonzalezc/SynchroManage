import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getCachedProfile(userId: string) {
  return unstable_cache(
    async () => {
      const admin = getSupabaseAdmin()
      const { data: profile } = await admin
        .from('profiles')
        .select('id, full_name, avatar_url, role:roles(name)')
        .eq('id', userId)
        .single()
      return profile
    },
    [`me-profile-${userId}`],
    { tags: [`user-${userId}`], revalidate: 300 }
  )()
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const profile = await getCachedProfile(user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        ...profile
      }
    })
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
