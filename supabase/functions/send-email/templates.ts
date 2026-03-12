// supabase/functions/send-email/templates.ts
// Pure rendering module — no Deno runtime dependencies.
// Importable from both the Edge Function (Deno) and tests (Node.js / Vitest).

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ProjectAssignedData {
  recipientName: string
  projectName: string
  roles: string[]
  projectUrl: string
}

export interface TaskAssignedData {
  recipientName: string
  taskName: string
  projectName: string
  priority: string
  taskUrl: string
}

export interface PasswordResetData {
  recipientName: string
  code: string
}

export interface UserInvitedData {
  recipientName: string
  inviteUrl: string
  roles: string[]
}

export type EmailType = 'project_assigned' | 'task_assigned' | 'password_reset' | 'user_invited'

export type EmailData = ProjectAssignedData | TaskAssignedData | PasswordResetData | UserInvitedData

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_SITE_URL = 'https://synchrodev.cl'

// ---------------------------------------------------------------------------
// Asset URL helpers
// ---------------------------------------------------------------------------

export function getAssetUrls(baseSiteUrl?: string): { logoUrl: string; poweredByUrl: string } {
  const base = baseSiteUrl || DEFAULT_SITE_URL
  return {
    logoUrl: `${base}/logo/logotipo-v2.png`,
    poweredByUrl: `${base}/logo/powered-by.png`,
  }
}

// ---------------------------------------------------------------------------
// Layout wrapper
// ---------------------------------------------------------------------------

export function wrapInLayout(content: string, baseSiteUrl?: string): string {
  const { logoUrl, poweredByUrl } = getAssetUrls(baseSiteUrl)
  const currentYear = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SynchroManage</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:24px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
        <!-- HEADER -->
        <tr>
          <td align="center" style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a,#1e3a5f);padding:32px;">
            <img src="${logoUrl}" alt="SynchroManage" style="max-width:120px;display:block;margin:0 auto 16px auto;" />
            <p style="margin:0;font-size:24px;font-weight:bold;color:#ffffff;font-family:'Segoe UI',Roboto,Arial,sans-serif;">SynchroManage</p>
            <p style="margin:8px 0 0 0;font-size:13px;color:#94a3b8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Gestión de Proyectos Inteligente</p>
          </td>
        </tr>
        <!-- CONTENT -->
        <tr>
          <td style="padding:32px 24px;font-family:'Segoe UI',Roboto,Arial,sans-serif;color:#334155;">
            ${content}
          </td>
        </tr>
        <!-- SEPARATOR -->
        <tr>
          <td style="padding:0 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-top:1px solid #e2e8f0;font-size:0;line-height:0;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- FOOTER -->
        <tr>
          <td align="center" style="background-color:#f8fafc;padding:24px;">
            <img src="${poweredByUrl}" alt="Powered By" style="max-width:100px;display:block;margin:0 auto 12px auto;" />
            <p style="margin:0;font-size:12px;color:#94a3b8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">&copy; ${currentYear} SynchroManage. Todos los derechos reservados.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}


// ---------------------------------------------------------------------------
// Template: Project Assigned
// ---------------------------------------------------------------------------

export function renderProjectAssignedEmail(data: ProjectAssignedData, baseSiteUrl?: string): string {
  const rolesText = data.roles.join(', ')

  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Asignación de Proyecto</h2>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Hola ${data.recipientName},</p>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Has sido asignado al proyecto <strong style="color:#0f172a;">${data.projectName}</strong> con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);">
      <a href="${data.projectUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Ver Proyecto</a>
    </td>
  </tr>
</table>`

  return wrapInLayout(content, baseSiteUrl)
}

// ---------------------------------------------------------------------------
// Template: Task Assigned
// ---------------------------------------------------------------------------

export function renderTaskAssignedEmail(data: TaskAssignedData, baseSiteUrl?: string): string {
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Asignación de Tarea</h2>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Hola ${data.recipientName},</p>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Se te ha asignado la tarea <strong style="color:#0f172a;">${data.taskName}</strong> en el proyecto <strong style="color:#0f172a;">${data.projectName}</strong> con prioridad <strong style="color:#0f172a;">${data.priority}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);">
      <a href="${data.taskUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Ver Tarea</a>
    </td>
  </tr>
</table>`

  return wrapInLayout(content, baseSiteUrl)
}

// ---------------------------------------------------------------------------
// Template: Password Reset
// ---------------------------------------------------------------------------

export function renderPasswordResetEmail(data: PasswordResetData, baseSiteUrl?: string): string {
  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Restablecimiento de Contraseña</h2>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Hola ${data.recipientName},</p>
<p style="margin:0 0 24px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código de verificación:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
  <tr>
    <td align="center" style="background:#eff6ff;border:2px solid #bfdbfe;border-radius:8px;padding:16px;font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;color:#1e40af;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
      ${data.code}
    </td>
  </tr>
</table>
<p style="margin:0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Este código expira en <strong style="color:#0f172a;">15 minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo.</p>`

  return wrapInLayout(content, baseSiteUrl)
}


// ---------------------------------------------------------------------------
// Template: User Invited
// ---------------------------------------------------------------------------

export function renderUserInvitedEmail(data: UserInvitedData, baseSiteUrl?: string): string {
  const rolesText = data.roles.join(', ')

  const content = `
<h2 style="margin:0 0 16px 0;font-size:20px;font-weight:bold;color:#0f172a;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Invitación a SynchroManage</h2>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Hola ${data.recipientName},</p>
<p style="margin:0 0 16px 0;font-size:15px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Has sido invitado a unirte a SynchroManage con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);">
      <a href="${data.inviteUrl}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Aceptar Invitación</a>
    </td>
  </tr>
</table>
<p style="margin:0;font-size:13px;color:#334155;line-height:1.6;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Si no esperabas esta invitación, puedes ignorar este correo.</p>`

  return wrapInLayout(content, baseSiteUrl)
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

export function renderEmail(type: EmailType, data: EmailData, baseSiteUrl?: string): string {
  switch (type) {
    case 'project_assigned':
      return renderProjectAssignedEmail(data as ProjectAssignedData, baseSiteUrl)
    case 'task_assigned':
      return renderTaskAssignedEmail(data as TaskAssignedData, baseSiteUrl)
    case 'password_reset':
      return renderPasswordResetEmail(data as PasswordResetData, baseSiteUrl)
    case 'user_invited':
      return renderUserInvitedEmail(data as UserInvitedData, baseSiteUrl)
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
