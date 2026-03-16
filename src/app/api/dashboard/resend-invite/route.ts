import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { RoleName } from '@/lib/types/roles'

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
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Falta el identificador del usuario' }, { status: 400 })
    }

    // Crear cliente admin con service_role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar perfil del usuario con roles
    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Obtener roles del usuario desde user_roles
    const { data: userRolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, role:roles(name)')
      .eq('user_id', userId)

    const roleNames: RoleName[] = (userRolesData || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ur: any) => ur.role?.name as RoleName)
      .filter(Boolean)

    // Verificar que el usuario no ha confirmado su email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (authUser?.user?.email_confirmed_at) {
      return NextResponse.json({ error: 'El usuario ya confirmó su cuenta' }, { status: 400 })
    }

    const email = targetProfile.email || authUser?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://synchrodev.cl'

    // Regenerar enlace de invitación
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { full_name: targetProfile.full_name },
        redirectTo: `${appUrl}/auth/callback`,
      },
    })

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }

    const inviteUrl = linkData.properties?.action_link || `${appUrl}/auth/set-password`

    // Enviar correo de invitación via Edge Function
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-email', {
      body: {
        to: email,
        subject: 'Invitación a SynchroManage',
        type: 'user_invited',
        data: {
          recipientName: targetProfile.full_name || email,
          inviteUrl,
          roles: roleNames,
          expiresInHours: 24,
        },
      },
    })

    if (emailError) {
      console.error('Error sending resend invite email:', emailError)
    }

    // Registrar actividad
    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'invite_resent',
      entity_type: 'user',
      entity_id: userId,
      entity_name: targetProfile.full_name || email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error resending invite:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
