// Supabase Edge Function: send-email
// Deno runtime — imports rendering from templates.ts

import { renderEmail } from './templates.ts'
import type { EmailType, EmailData } from './templates.ts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SendEmailRequest {
  to: string
  subject: string
  type: EmailType
  data: EmailData
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return typeof email === 'string' && email.length > 0 && EMAIL_REGEX.test(email)
}

const VALID_TYPES = ['project_assigned', 'task_assigned', 'password_reset', 'user_invited'] as const

function isValidNotificationType(type: string): boolean {
  return VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])
}

// ---------------------------------------------------------------------------
// CORS headers
// ---------------------------------------------------------------------------

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Edge Function handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: SendEmailRequest = await req.json()

    // --- Input validation ---------------------------------------------------
    if (!body.to || !isValidEmail(body.to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing "to" email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!body.type || !isValidNotificationType(body.type)) {
      return new Response(
        JSON.stringify({ error: `Invalid notification type: "${body.type}". Must be one of: ${VALID_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!body.subject) {
      return new Response(
        JSON.stringify({ error: 'Missing "subject" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (!body.data) {
      return new Response(
        JSON.stringify({ error: 'Missing "data" field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- Generate HTML ------------------------------------------------------
    const PUBLIC_SITE_URL = Deno.env.get('PUBLIC_SITE_URL')
    const html = renderEmail(body.type, body.data, PUBLIC_SITE_URL)

    // --- Send via Resend API ------------------------------------------------
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return new Response(
        JSON.stringify({ error: 'Email service is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'no-reply@synchrodev.cl',
        to: [body.to],
        subject: body.subject,
        html,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Resend API error:', JSON.stringify(resendData))
      return new Response(
        JSON.stringify({ error: resendData.message ?? 'Failed to send email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Unexpected error in send-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
