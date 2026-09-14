import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { RoleName } from '@/lib/types/roles'
import { requireAppAdmin } from '@/lib/auth/require-app-admin'
import {
  createPasswordSetupLink,
  getAuthUserStatus,
} from '@/lib/auth/user-management'
import { sendTransactionalEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  try {
    const auth = await requireAppAdmin()
    if (auth.error) return auth.error

    const { user } = auth
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Falta el identificador del usuario' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: targetProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const { data: userRolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role_id, role:roles(name)')
      .eq('user_id', userId)

    const roleNames: RoleName[] = (userRolesData || [])
      .map((ur) => (ur.role as { name?: string } | null)?.name as RoleName)
      .filter(Boolean)

    const authStatus = await getAuthUserStatus(userId)

    if (!authStatus) {
      return NextResponse.json({ error: 'Usuario de autenticación no encontrado' }, { status: 404 })
    }

    if (authStatus.emailVerified) {
      return NextResponse.json({ error: 'El usuario ya confirmó su cuenta' }, { status: 400 })
    }

    const email = targetProfile.email || authStatus.email
    if (!email) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const inviteUrl = await createPasswordSetupLink(userId)

    try {
      await sendTransactionalEmail({
        to: email,
        subject: 'Invitación a SynchroManage',
        type: 'user_invited',
        data: {
          recipientName: targetProfile.full_name || email,
          inviteUrl,
          roles: roleNames,
          expiresInHours: 24,
        },
      })
    } catch (emailError) {
      console.error('Error sending resend invite email:', emailError)
    }

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
