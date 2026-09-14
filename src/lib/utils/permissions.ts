import { createClient } from '@supabase/supabase-js'
import { getApiUser } from '@/lib/auth/server'
import { RoleName, Permission, PERMISSIONS } from '@/lib/types/roles'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getUserRole(): Promise<RoleName | null> {
  const user = await getApiUser()
  if (!user) return null

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.role as any)?.name as RoleName ?? null
}

export async function hasPermission(permission: Permission): Promise<boolean> {
  const role = await getUserRole()
  if (!role) return false
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}

export async function requirePermission(permission: Permission): Promise<void> {
  const allowed = await hasPermission(permission)
  if (!allowed) {
    throw new Error('No tienes permisos para realizar esta acción')
  }
}

export async function isAdmin(): Promise<boolean> {
  return (await getUserRole()) === 'admin'
}
