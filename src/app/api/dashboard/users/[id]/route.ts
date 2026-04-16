import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidateTag } from 'next/cache'
import { NextResponse } from 'next/server'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// PUT - Actualizar usuario (nombre, roles, empresa)
// Solo admin puede ejecutar esto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseServer = await createServerClient()
    const { data: { user } } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo admin puede editar usuarios
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role:roles(name)')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roleName = (profile?.role as any)?.name
    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, role_ids, company_id, primary_role_id } = body

    if (!role_ids || role_ids.length === 0) {
      return NextResponse.json({ error: 'Debes asignar al menos un rol' }, { status: 400 })
    }

    const admin = getAdmin()

    // 1. Actualizar perfil con rol primario
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        full_name,
        role_id: primary_role_id || role_ids[0],
        company_id: company_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    // 2. Sincronizar user_roles: eliminar todos los existentes
    const { error: deleteError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // 3. Insertar los nuevos roles
    const newUserRoles = role_ids.map((roleId: number) => ({
      user_id: id,
      role_id: roleId,
    }))

    const { error: insertError } = await admin
      .from('user_roles')
      .insert(newUserRoles)

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    // Invalidar caché de usuarios
    revalidateTag('users')
    revalidateTag(`user-${id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
