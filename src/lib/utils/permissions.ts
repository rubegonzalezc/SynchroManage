import { createClient } from '@/lib/supabase/server'
import { RoleName, Permission, PERMISSIONS } from '@/lib/types/roles'

export async function getUserRole(): Promise<RoleName | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

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
