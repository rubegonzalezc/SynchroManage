// Supabase Edge Function: send-email
// Deno runtime — self-contained, no imports from src/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProjectAssignedData {
  recipientName: string
  projectName: string
  roles: string[]
  projectUrl: string
}

interface TaskAssignedData {
  recipientName: string
  taskName: string
  projectName: string
  priority: string
  taskUrl: string
}

interface PasswordResetData {
  recipientName: string
  code: string
}

interface UserInvitedData {
  recipientName: string
  inviteUrl: string
  roles: string[]
}

interface SendEmailRequest {
  to: string
  subject: string
  type: 'project_assigned' | 'task_assigned' | 'password_reset' | 'user_invited'
  data: ProjectAssignedData | TaskAssignedData | PasswordResetData | UserInvitedData
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
// HTML template helpers (duplicated from src/lib/utils/email-templates.ts)
// ---------------------------------------------------------------------------

function wrapInLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#2563eb;padding:24px;text-align:center;">
            <span style="font-size:24px;font-weight:bold;color:#ffffff;">SynchroManage</span>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:32px 24px;">
${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f9fafb;padding:16px 24px;text-align:center;font-size:12px;color:#6b7280;">
            &copy; ${new Date().getFullYear()} SynchroManage. Todos los derechos reservados.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}


function renderProjectAssignedEmail(data: ProjectAssignedData): string {
  const rolesText = data.roles.join(', ')

  const content = `
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hola <strong>${data.recipientName}</strong>,
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 16px;">
              Has sido asignado/a al proyecto <strong>${data.projectName}</strong> con el rol: <strong>${rolesText}</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr><td align="center" style="background-color:#2563eb;border-radius:6px;">
                <a href="${data.projectUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                  Ver Proyecto
                </a>
              </td></tr>
            </table>`

  return wrapInLayout(content)
}

function renderTaskAssignedEmail(data: TaskAssignedData): string {
  const content = `
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hola <strong>${data.recipientName}</strong>,
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 8px;">
              Se te ha asignado la tarea <strong>${data.taskName}</strong> en el proyecto <strong>${data.projectName}</strong>.
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 16px;">
              Prioridad: <strong>${data.priority}</strong>
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr><td align="center" style="background-color:#2563eb;border-radius:6px;">
                <a href="${data.taskUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                  Ver Tarea
                </a>
              </td></tr>
            </table>`

  return wrapInLayout(content)
}

function renderPasswordResetEmail(data: PasswordResetData): string {
  const content = `
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hola <strong>${data.recipientName}</strong>,
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 16px;">
              Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:
            </p>
            <table cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
              <tr><td align="center">
                <span style="display:inline-block;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;background-color:#eff6ff;padding:16px 32px;border-radius:8px;border:2px solid #bfdbfe;">
                  ${data.code}
                </span>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#6b7280;margin:0;text-align:center;">
              Este código expira en 15 minutos.
            </p>`

  return wrapInLayout(content)
}

function renderUserInvitedEmail(data: UserInvitedData): string {
  const rolesText = data.roles.join(', ')

  const content = `
            <p style="font-size:16px;color:#111827;margin:0 0 16px;">
              Hola <strong>${data.recipientName}</strong>,
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 16px;">
              Has sido invitado/a a unirte a <strong>SynchroManage</strong> con el rol: <strong>${rolesText}</strong>.
            </p>
            <p style="font-size:14px;color:#374151;margin:0 0 16px;">
              Haz clic en el siguiente botón para establecer tu contraseña y acceder a la plataforma:
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
              <tr><td align="center" style="background-color:#2563eb;border-radius:6px;">
                <a href="${data.inviteUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;">
                  Aceptar Invitación
                </a>
              </td></tr>
            </table>
            <p style="font-size:13px;color:#6b7280;margin:0;text-align:center;">
              Si no esperabas esta invitación, puedes ignorar este correo.
            </p>`

  return wrapInLayout(content)
}

function renderEmail(
  type: SendEmailRequest['type'],
  data: SendEmailRequest['data'],
): string {
  switch (type) {
    case 'project_assigned':
      return renderProjectAssignedEmail(data as ProjectAssignedData)
    case 'task_assigned':
      return renderTaskAssignedEmail(data as TaskAssignedData)
    case 'password_reset':
      return renderPasswordResetEmail(data as PasswordResetData)
    case 'user_invited':
      return renderUserInvitedEmail(data as UserInvitedData)
  }
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
    const html = renderEmail(body.type, body.data)

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
