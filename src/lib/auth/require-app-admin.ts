import { NextResponse } from 'next/server'
import { getApiUser } from './server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function requireAppAdmin() {
  const user = await getApiUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }) }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role:roles(name)')
    .eq('id', user.id)
    .single()

  const roleName = (profile?.role as { name?: string } | null)?.name
  if (roleName !== 'admin') {
    return { error: NextResponse.json({ error: 'No tienes permisos' }, { status: 403 }) }
  }

  return { user, admin }
}
