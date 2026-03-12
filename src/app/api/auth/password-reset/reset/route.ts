import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json()

    // Validate all fields are present
    if (
      !email || typeof email !== 'string' ||
      !code || typeof code !== 'string' ||
      !password || typeof password !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Look up user in profiles by email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Re-verify code: query password_reset_codes for matching user_id, code, used = false, expires_at > now()
    const { data: resetCode } = await supabaseAdmin
      .from('password_reset_codes')
      .select('id')
      .eq('user_id', profile.id)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!resetCode) {
      return NextResponse.json(
        { error: 'Código inválido o expirado' },
        { status: 400 }
      )
    }

    // Change password using supabaseAdmin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Error al cambiar la contraseña' },
        { status: 500 }
      )
    }

    // Delete the used code
    await supabaseAdmin
      .from('password_reset_codes')
      .delete()
      .eq('id', resetCode.id)

    return NextResponse.json(
      { message: 'Contraseña actualizada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in password reset:', error)
    return NextResponse.json(
      { error: 'Error al cambiar la contraseña' },
      { status: 500 }
    )
  }
}
