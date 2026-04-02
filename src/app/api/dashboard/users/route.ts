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

const getCachedBasicUsers = unstable_cache(
  async () => {
    const admin = getSupabaseAdmin()

    const { data: allUserRoles } = await admin
      .from('user_roles')
      .select('user_id, role:roles(name)')

    const userRolesMap: Record<string, string[]> = {}
    if (allUserRoles) {
      for (const ur of allUserRoles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const urRoleName = (ur.role as any)?.name
        if (urRoleName) {
          if (!userRolesMap[ur.user_id]) userRolesMap[ur.user_id] = []
          userRolesMap[ur.user_id].push(urRoleName)
        }
      }
    }

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select(`id, full_name, email, avatar_url, role:roles(name)`)
      .order('full_name', { ascending: true })

    if (profilesError) throw new Error(profilesError.message)

    return profiles?.map(p => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackRole = (p.role as any)?.name
      const roles = userRolesMap[p.id] ?? (fallbackRole ? [fallbackRole] : [])
      return { ...p, roles }
    }) ?? []
  },
  ['users-basic-list'],
  { tags: ['users'], revalidate: 300 }
)

const getCachedAdminUsers = unstable_cache(
  async () => {
    const admin = getSupabaseAdmin()

    const { data: allUserRoles } = await admin
      .from('user_roles')
      .select('user_id, role:roles(name)')

    const userRolesMap: Record<string, string[]> = {}
    if (allUserRoles) {
      for (const ur of allUserRoles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const urRoleName = (ur.role as any)?.name
        if (urRoleName) {
          if (!userRolesMap[ur.user_id]) userRolesMap[ur.user_id] = []
          userRolesMap[ur.user_id].push(urRoleName)
        }
      }
    }

    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers()
    if (authError) throw new Error(authError.message)

    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select(`*, role:roles(id, name, description), company:companies(id, name)`)
      .order('created_at', { ascending: false })

    if (profilesError) throw new Error(profilesError.message)

    return profiles?.map(p => {
      const authUser = authUsers.users.find(u => u.id === p.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallbackRole = (p.role as any)?.name
      const roles = userRolesMap[p.id] ?? (fallbackRole ? [fallbackRole] : [])
      return {
        ...p,
        roles,
        email_confirmed: authUser?.email_confirmed_at ? true : false,
        last_sign_in: authUser?.last_sign_in_at || null,
      }
    }) ?? []
  },
  ['users-admin-list'],
  { tags: ['users'], revalidate: 120 }
)

export async function GET() {
  try {
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    const isAdmin = roleName === 'admin'

    if (isAdmin) {
      const users = await getCachedAdminUsers()
      return NextResponse.json({ users })
    }

    const users = await getCachedBasicUsers()
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
