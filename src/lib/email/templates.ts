import { escapeHtml, renderEmailLayout } from './layout'

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

function formatRoles(roles: string[]): string {
  return roles.map((role) => escapeHtml(role)).join(', ')
}

export function renderProjectAssignedEmail(
  data: ProjectAssignedData,
  baseSiteUrl?: string
): string {
  const rolesText = formatRoles(data.roles)

  return renderEmailLayout({
    title: 'Asignación de Proyecto',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Has sido asignado al proyecto <strong style="color:#0f172a;">${escapeHtml(data.projectName)}</strong> con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.`,
    actionUrl: data.projectUrl,
    actionLabel: 'Ver Proyecto',
    footerNote:
      'Recibiste este correo porque fuiste asignado a un proyecto en SynchroManage.',
    baseSiteUrl,
  })
}

export function renderTaskAssignedEmail(
  data: TaskAssignedData,
  baseSiteUrl?: string
): string {
  return renderEmailLayout({
    title: 'Asignación de Tarea',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Se te ha asignado la tarea <strong style="color:#0f172a;">${escapeHtml(data.taskName)}</strong> en el proyecto <strong style="color:#0f172a;">${escapeHtml(data.projectName)}</strong> con prioridad <strong style="color:#0f172a;">${escapeHtml(data.priority)}</strong>.`,
    actionUrl: data.taskUrl,
    actionLabel: 'Ver Tarea',
    footerNote:
      'Recibiste este correo porque se te asignó una tarea en SynchroManage.',
    baseSiteUrl,
  })
}

export function renderUserInvitedEmail(
  data: UserInvitedData,
  baseSiteUrl?: string
): string {
  const rolesText = formatRoles(data.roles)
  const expiresInHours = data.expiresInHours ?? 24

  return renderEmailLayout({
    title: 'Invitación a SynchroManage',
    greeting: `Hola ${escapeHtml(data.recipientName)},`,
    body: `Has sido invitado a unirte a SynchroManage con los siguientes roles: <strong style="color:#0f172a;">${rolesText}</strong>.`,
    actionUrl: data.inviteUrl,
    actionLabel: 'Aceptar Invitación',
    footerNote: `Este enlace de invitación expira en ${expiresInHours} horas. Si no esperabas esta invitación, puedes ignorar este correo.`,
    baseSiteUrl,
  })
}

export function renderEmail(
  type: EmailType,
  data: EmailData,
  baseSiteUrl?: string
): string {
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
