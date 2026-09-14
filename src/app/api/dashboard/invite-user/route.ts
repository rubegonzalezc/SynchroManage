import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getPrimaryRole, type RoleName } from '@/lib/types/roles'
import { requireAppAdmin } from '@/lib/auth/require-app-admin'
import { inviteUserWithBetterAuth } from '@/lib/auth/user-management'
import { sendTransactionalEmail } from '@/lib/email/send'

export async function POST(request: Request) {
  try {
    const auth = await requireAppAdmin()
    if (auth.error) return auth.error

    const { user } = auth

    const body = await request.json()
    const { email, full_name, role_ids, role_id, company_id } = body

    if (!email || !full_name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    let resolvedRoleIds: number[] = []
    if (role_ids && Array.isArray(role_ids) && role_ids.length > 0) {
      resolvedRoleIds = role_ids.map(Number)
    } else if (role_id) {
      resolvedRoleIds = [parseInt(role_id)]
    } else {
      return NextResponse.json({ error: 'Debes seleccionar al menos un rol' }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: rolesData } = await supabaseAdmin
      .from('roles')
      .select('id, name')
      .in('id', resolvedRoleIds)

    const roleNames = (rolesData || []).map((r) => r.name as RoleName)
    const primaryRoleName = getPrimaryRole(roleNames)
    const primaryRoleId =
      rolesData?.find((r) => r.name === primaryRoleName)?.id || resolvedRoleIds[0]

    let invitedUserId: string
    let inviteUrl: string

    try {
      const result = await inviteUserWithBetterAuth({
        email,
        fullName: full_name,
        primaryRoleId,
        roleIds: resolvedRoleIds,
        companyId: company_id || null,
      })
      invitedUserId = result.userId
      inviteUrl = result.inviteUrl
    } catch (inviteError) {
      const message =
        inviteError instanceof Error ? inviteError.message : 'Error al invitar usuario'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    try {
      await sendTransactionalEmail({
        to: email,
        subject: 'Invitación a SynchroManage',
        type: 'user_invited',
        data: {
          recipientName: full_name,
          inviteUrl,
          roles: roleNames,
          expiresInHours: 24,
        },
      })
    } catch (emailError) {
      console.error('Error sending invite email:', emailError)
    }

    await supabaseAdmin.from('activity_log').insert({
      user_id: user.id,
      action: 'invited',
      entity_type: 'user',
      entity_id: invitedUserId,
      entity_name: full_name,
    })

    return NextResponse.json({
      success: true,
      user: { id: invitedUserId, email, full_name },
    })
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
