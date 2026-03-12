import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getPrimaryRole, type RoleName } from '@/lib/types/roles'

export async function POST(request: Request) {
  try {
    // Verificar que el usuario actual es admin
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
    if (roleName !== 'admin') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role_ids, role_id, company_id } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    // Soportar tanto role_ids (multi) como role_id (legacy)
    let resolvedRoleIds: number[] = []
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      resolvedRoleIds = role_ids.map(Number)
    } else if (role_id) {
      resolvedRoleIds = [parseInt(role_id)]
    } else {
      return NextResponse.json({ error: 'Debes seleccionar al menos un rol' }, { status: 400 })
    }

    // Crear cliente admin con service_role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Obtener nombres de roles para determinar el primario
    const { data: rolesData } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .in('id', resolvedRoleIds)

    const roleNames = (rolesData || []).map(r => r.name as RoleName)
    const primaryRoleName = getPrimaryRole(roleNames)
    const primaryRoleId = rolesData?.find(r => r.name === primaryRoleName)?.id || resolvedRoleIds[0]

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://produccion.d10wccaqn7i0qo.amplifyapp.com'

    // generateLink con type 'invite' crea el usuario Y genera el link en un solo paso
    // No envía correo de Supabase, solo retorna el link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { full_name },
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 400 })
    }

    const invitedUser = linkData.user
    const inviteUrl = linkData.properties?.action_link || `${appUrl}/auth/set-password`

    // Enviar correo de invitación via Resend (Edge Function)
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Invitación a SynchroManage',
        type: 'user_invited',
        data: {
          recipientName: full_name,
          inviteUrl,
          roles: roleNames,
        },
      },
    })

    if (emailError) {
      console.error('Error sending invite email:', emailError)
      // No fallar la invitación por error de correo, el usuario ya fue creado
    }

    if (invitedUser) {
      // Actualizar perfil con nombre, rol primario y empresa
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name,
          role_id: primaryRoleId,
          company_id: company_id || null,
        })
        .eq('id', invitedUser.id)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      // Insertar registros en user_roles para cada rol
      const userRolesInsert = resolvedRoleIds.map(rid => ({
        user_id: invitedUser.id,
        role_id: rid,
      }))

      const { error: userRolesError } = await supabaseAdmin
        .from('user_roles')
        .insert(userRolesInsert)

      if (userRolesError) {
        console.error('Error inserting user_roles:', userRolesError)
      }

      // Registrar actividad
      await supabaseAdmin.from('activity_log').insert({
        user_id: user.id,
        action: 'invited',
        entity_type: 'user',
        entity_id: invitedUser.id,
        entity_name: full_name,
      })
    }

    return NextResponse.json({ success: true, user: invitedUser })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
