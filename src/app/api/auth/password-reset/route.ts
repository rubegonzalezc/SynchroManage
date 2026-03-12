import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  generateVerificationCode,
  calculateExpiration,
} from '@/lib/utils/verification-code'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const GENERIC_MESSAGE =
  'Si el correo existe, recibirás un código de verificación'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
    }

    // Look up user in profiles by email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', email.trim().toLowerCase())
      .single()

    // If user not found, return generic 200 (don't reveal if email exists)
    if (!profile) {
      return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
    }

    // Generate 6-digit verification code
    const code = generateVerificationCode()
    const expiresAt = calculateExpiration()

    // Invalidate previous unused codes for this user
    await supabaseAdmin
      .from('password_reset_codes')
      .update({ used: true })
      .eq('user_id', profile.id)
      .eq('used', false)

    // Insert new code
    await supabaseAdmin.from('password_reset_codes').insert({
      user_id: profile.id,
      code,
      expires_at: expiresAt.toISOString(),
    })

    // Invoke Edge Function to send email
    try {
      await supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: profile.email,
          subject: 'Código de recuperación de contraseña - SynchroManage',
          type: 'password_reset',
          data: {
            recipientName: profile.full_name,
            code,
          },
        },
      })
    } catch (emailError) {
      // Email errors should not block the operation
      console.error('Error sending password reset email:', emailError)
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
  } catch (error) {
    console.error('Error in password reset request:', error)
    // Always return generic message even on errors
    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 })
  }
}
