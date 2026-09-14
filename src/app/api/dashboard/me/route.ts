import { createClient } from '@supabase/supabase-js'
import { revalidateTag, unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { getApiUser } from '@/lib/auth/server'

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
    const user = await getApiUser()

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

export async function PATCH(request: Request) {
  try {
    const user = await getApiUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, avatar_url } = body as {
      full_name?: string | null
      avatar_url?: string | null
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if (full_name !== undefined) updates.full_name = full_name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, full_name, avatar_url, role:roles(name)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    revalidateTag(`user-${user.id}`, 'max')

    return NextResponse.json({
      user: {
        ...data,
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
