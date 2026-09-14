// @deprecated — Usar src/lib/email/templates.ts en Next.js.
// Copia Deno-compatible sin imágenes cid: (usa URLs de Supabase Storage).

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

export interface UserInvitedData {
  recipientName: string
  inviteUrl: string
  roles: string[]
  expiresInHours?: number
}

export type EmailType = 'project_assigned' | 'task_assigned' | 'user_invited'
export type EmailData = ProjectAssignedData | TaskAssignedData | UserInvitedData

const FONT = "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif"
const DEFAULT_ASSETS_BASE =
  'https://njkweyaifgqyyosungju.supabase.co/storage/v1/object/public/uploads/email'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getAssetUrls(baseSiteUrl?: string) {
  const base = (baseSiteUrl || DEFAULT_ASSETS_BASE).replace(/\/$/, '')
  const assetsBase = base.includes('/storage/v1/object/public/uploads/email')
    ? base
    : DEFAULT_ASSETS_BASE

  return {
    logoUrl: `${assetsBase}/logotipo-v2.png`,
    iconUrl: `${assetsBase}/isotipo-blanco.png`,
    poweredByUrl: `${assetsBase}/powered-by.png`,
    appUrl: base.includes('localhost') ? 'https://synchrodev.cl' : base,
  }
}

interface LayoutParams {
  title: string
  greeting?: string
  body: string
  actionUrl?: string
  actionLabel?: string
  footerNote?: string
  showFallbackLink?: boolean
  disclaimerText?: string
  baseSiteUrl?: string
}

function renderLayout(params: LayoutParams): string {
  const {
    title,
    greeting = 'Hola,',
    body,
    actionUrl,
    actionLabel,
    footerNote,
    showFallbackLink = Boolean(actionUrl),
    disclaimerText = 'Este es un correo automático de SynchroManage. No respondas a este mensaje.',
    baseSiteUrl,
  } = params

  const { logoUrl, iconUrl, poweredByUrl, appUrl } = getAssetUrls(baseSiteUrl)
  const year = new Date().getFullYear()

  const ctaBlock =
    actionUrl && actionLabel
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;"><tr><td align="center" style="border-radius:12px;background-color:#2563eb;background-image:linear-gradient(135deg,#2563eb,#1d4ed8);"><a href="${actionUrl}" target="_blank" style="display:block;padding:16px 28px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT};border-radius:12px;">${actionLabel}</a></td></tr></table>`
      : ''

  const fallbackBlock =
    showFallbackLink && actionUrl
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;"><tr><td style="padding:16px 18px;"><p style="margin:0 0 8px 0;font-size:13px;line-height:1.5;color:#64748b;font-family:${FONT};">Si el botón no funciona, copia y pega este enlace en tu navegador:</p><p style="margin:0;font-size:12px;line-height:1.6;color:#2563eb;word-break:break-all;font-family:${FONT};"><a href="${actionUrl}" style="color:#2563eb;text-decoration:underline;">${actionUrl}</a></p></td></tr></table>`
      : ''

  const noticeBlock = footerNote
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;"><tr><td style="padding:14px 16px;"><p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;font-family:${FONT};">${footerNote}</p></td></tr></table>`
    : ''

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} — SynchroManage</title></head><body style="margin:0;padding:0;background-color:#eef2f7;font-family:${FONT};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef2f7;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-collapse:separate;"><tr><td style="background-color:#ffffff;border-radius:16px;border:1px solid #dbe3ee;box-shadow:0 12px 40px rgba(15,23,42,0.08);overflow:hidden;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1d4ed8 100%);padding:36px 28px 32px 28px;"><img src="${logoUrl}" alt="SynchroManage" width="140" style="display:block;margin:0 auto 18px auto;max-width:140px;width:140px;height:auto;border:0;" /><p style="margin:0;font-size:13px;line-height:1.5;color:#cbd5e1;font-family:${FONT};letter-spacing:0.04em;text-transform:uppercase;">Gestión de Proyectos Inteligente</p></td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:36px 32px 8px 32px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;"><tr><td style="width:48px;height:48px;border-radius:12px;background-color:#eff6ff;border:1px solid #bfdbfe;text-align:center;vertical-align:middle;"><img src="${iconUrl}" alt="" width="28" height="28" style="display:block;margin:10px auto;border:0;" /></td><td style="padding-left:14px;vertical-align:middle;"><p style="margin:0;font-size:12px;line-height:1.4;color:#64748b;font-family:${FONT};text-transform:uppercase;letter-spacing:0.06em;">SynchroManage</p><p style="margin:4px 0 0 0;font-size:22px;line-height:1.25;color:#0f172a;font-weight:700;font-family:${FONT};">${title}</p></td></tr></table><p style="margin:0 0 14px 0;font-size:16px;line-height:1.6;color:#334155;font-family:${FONT};">${greeting}</p><p style="margin:0 0 28px 0;font-size:16px;line-height:1.7;color:#475569;font-family:${FONT};">${body}</p>${ctaBlock}${fallbackBlock}${noticeBlock}</td></tr></table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:28px 32px 32px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;"><img src="${poweredByUrl}" alt="Powered by SynchroDev" width="110" style="display:block;margin:0 auto 14px auto;max-width:110px;width:110px;height:auto;border:0;" /><p style="margin:0 0 6px 0;font-size:12px;line-height:1.5;color:#94a3b8;font-family:${FONT};">&copy; ${year} SynchroManage. Todos los derechos reservados.</p><p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;font-family:${FONT};"><a href="${appUrl}" style="color:#64748b;text-decoration:none;">${appUrl.replace(/^https?:\/\//, '')}</a></p></td></tr></table></td></tr><tr><td style="padding:16px 8px 0 8px;text-align:center;"><p style="margin:0;font-size:11px;line-height:1.5;color:#94a3b8;font-family:${FONT};">${disclaimerText}</p></td></tr></table></td></tr></table></body></html>`
}

export function renderProjectAssignedEmail(data: ProjectAssignedData, baseSiteUrl?: string): string {
  const rolesText = data.roles.map(escapeHtml).join(', ')
  return renderLayout({
    title: 'Asignación de Proyecto',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Has sido asignado al proyecto <strong style="color:#0f172a;">${escapeHtml(data.projectName)}</strong> con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.`,
    actionUrl: data.projectUrl,
    actionLabel: 'Ver Proyecto',
    footerNote: 'Recibiste este correo porque fuiste asignado a un proyecto en SynchroManage.',
    baseSiteUrl,
  })
}

export function renderTaskAssignedEmail(data: TaskAssignedData, baseSiteUrl?: string): string {
  return renderLayout({
    title: 'Asignación de Tarea',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Se te ha asignado la tarea <strong style="color:#0f172a;">${escapeHtml(data.taskName)}</strong> en el proyecto <strong style="color:#0f172a;">${escapeHtml(data.projectName)}</strong> con prioridad <strong style="color:#0f172a;">${escapeHtml(data.priority)}</strong>.`,
    actionUrl: data.taskUrl,
    actionLabel: 'Ver Tarea',
    footerNote: 'Recibiste este correo porque se te asignó una tarea en SynchroManage.',
    baseSiteUrl,
  })
}

export function renderUserInvitedEmail(data: UserInvitedData, baseSiteUrl?: string): string {
  const rolesText = data.roles.map(escapeHtml).join(', ')
  const expiresInHours = data.expiresInHours ?? 24
  return renderLayout({
    title: 'Invitación a SynchroManage',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Has sido invitado a unirte a SynchroManage con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.`,
    actionUrl: data.inviteUrl,
    actionLabel: 'Aceptar Invitación',
    footerNote: `Este enlace de invitación expira en ${expiresInHours} horas. Si no esperabas esta invitación, puedes ignorar este correo.`,
    baseSiteUrl,
  })
}

export function renderEmail(type: EmailType, data: EmailData, baseSiteUrl?: string): string {
  switch (type) {
    case 'project_assigned':
      return renderProjectAssignedEmail(data as ProjectAssignedData, baseSiteUrl)
    case 'task_assigned':
      return renderTaskAssignedEmail(data as TaskAssignedData, baseSiteUrl)
    case 'user_invited':
      return renderUserInvitedEmail(data as UserInvitedData, baseSiteUrl)
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}
