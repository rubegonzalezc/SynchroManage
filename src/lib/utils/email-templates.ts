/**
 * Email HTML template rendering functions.
 *
 * Each function returns an HTML string with a common structure
 * (SynchroManage branding header, content area, footer) and
 * type-specific fields for the notification.
 */

// ---------------------------------------------------------------------------
// Data interfaces
// ---------------------------------------------------------------------------

export interface ProjectAssignedData {
  recipientName: string
  projectName: string
  roles: string[] // e.g. ["Project Manager", "Desarrollador"]
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
  code: string // 6-digit code
}

export interface UserInvitedData {
  recipientName: string
  inviteUrl: string
  roles: string[]
}

// ---------------------------------------------------------------------------
// Common wrapper
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


// ---------------------------------------------------------------------------
// Template: Project Assigned
// ---------------------------------------------------------------------------

export function renderProjectAssignedEmail(data: ProjectAssignedData): string {
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

// ---------------------------------------------------------------------------
// Template: Task Assigned
// ---------------------------------------------------------------------------

export function renderTaskAssignedEmail(data: TaskAssignedData): string {
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

// ---------------------------------------------------------------------------
// Template: Password Reset
// ---------------------------------------------------------------------------

export function renderPasswordResetEmail(data: PasswordResetData): string {
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

// ---------------------------------------------------------------------------
// Template: User Invited
// ---------------------------------------------------------------------------

export function renderUserInvitedEmail(data: UserInvitedData): string {
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
