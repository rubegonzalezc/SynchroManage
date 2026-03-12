import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || typeof email !== 'string' || !code || typeof code !== 'string') {
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

    // Query password_reset_codes for a valid, non-expired, unused code
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

    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error('Error verifying password reset code:', error)
    return NextResponse.json(
      { error: 'Error al verificar el código' },
      { status: 500 }
    )
  }
}
