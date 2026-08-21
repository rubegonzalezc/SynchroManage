import { TASK_STATUS_OPTIONS } from '@/components/dashboard/tasks/task-status-select'

export interface ActivityLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  details: Record<string, unknown> | null
  created_at: string
  user: {
    id: string
    full_name: string
    avatar_url: string | null
  } | null
}

const TASK_STATUS_LABELS = Object.fromEntries(
  TASK_STATUS_OPTIONS.map((option) => [option.value, option.label])
) as Record<string, string>

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  created: 'creó',
  updated: 'actualizó',
  deleted: 'eliminó',
  assigned: 'asignó',
  unassigned: 'desasignó',
  completed: 'completó',
  commented: 'comentó en',
  status_changed: 'cambió el estado',
  attached: 'adjuntó un archivo',
  detached: 'eliminó un archivo',
  reviewer_assigned: 'asignó revisor',
  reviewer_removed: 'removió revisor',
  sprint_changed: 'cambió el sprint',
  dependency_changed: 'actualizó dependencias',
}

export const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  project: 'el proyecto',
  change_control: 'el control de cambios',
  task: 'la tarea',
  bug: 'el bug',
  comment: 'un comentario',
  member: 'un miembro',
}

export function formatActivityRelativeDate(date: string): string {
  const now = new Date()
  const activityDate = new Date(date)
  const diffMs = now.getTime() - activityDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`

  return activityDate.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTaskStatus(status: unknown): string {
  if (typeof status !== 'string') return String(status ?? '')
  return TASK_STATUS_LABELS[status] ?? status
}

function formatDependencyList(items: unknown): string {
  if (!Array.isArray(items) || items.length === 0) return ''

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as { task_number?: number | null; title?: string }
      const prefix = record.task_number != null ? `#${record.task_number} ` : ''
      return `${prefix}${record.title ?? 'Tarea'}`
    })
    .filter(Boolean)
    .join(', ')
}

export function getTaskActivityDescription(activity: ActivityLogEntry): string {
  const details = activity.details

  switch (activity.action) {
    case 'created':
      return 'creó la tarea'
    case 'deleted':
      return 'eliminó la tarea'
    case 'updated':
      return 'actualizó la tarea'
    case 'status_changed':
      if (details?.from && details?.to) {
        return `cambió el estado de ${formatTaskStatus(details.from)} a ${formatTaskStatus(details.to)}`
      }
      return ACTIVITY_ACTION_LABELS.status_changed
    case 'assigned':
      return details?.assignee_name
        ? `asignó a ${details.assignee_name}`
        : ACTIVITY_ACTION_LABELS.assigned
    case 'unassigned':
      return details?.unassigned_user_name
        ? `desasignó a ${details.unassigned_user_name}`
        : ACTIVITY_ACTION_LABELS.unassigned
    case 'reviewer_assigned':
      return details?.reviewer_name
        ? `asignó revisor → ${details.reviewer_name}`
        : ACTIVITY_ACTION_LABELS.reviewer_assigned
    case 'reviewer_removed':
      return details?.reviewer_name
        ? `removió revisor (${details.reviewer_name})`
        : ACTIVITY_ACTION_LABELS.reviewer_removed
    case 'sprint_changed': {
      const fromName = details?.from_sprint_name ?? 'Sin sprint'
      const toName = details?.to_sprint_name ?? 'Sin sprint'
      return `cambió el sprint de ${fromName} a ${toName}`
    }
    case 'dependency_changed': {
      const added = formatDependencyList(details?.added)
      const removed = formatDependencyList(details?.removed)
      const parts: string[] = []
      if (added) parts.push(`añadió: ${added}`)
      if (removed) parts.push(`quitó: ${removed}`)
      return parts.length > 0 ? `actualizó dependencias (${parts.join(' · ')})` : ACTIVITY_ACTION_LABELS.dependency_changed
    }
    case 'attached':
      return details?.file_name
        ? `adjuntó el archivo ${details.file_name}`
        : ACTIVITY_ACTION_LABELS.attached
    case 'detached':
      return details?.file_name
        ? `eliminó el archivo ${details.file_name}`
        : ACTIVITY_ACTION_LABELS.detached
    default:
      return ACTIVITY_ACTION_LABELS[activity.action] || activity.action
  }
}

export function getActivityDescription(activity: ActivityLogEntry): string {
  if (activity.entity_type === 'task') {
    return getTaskActivityDescription(activity)
  }

  const action = ACTIVITY_ACTION_LABELS[activity.action] || activity.action
  const entity = ACTIVITY_ENTITY_LABELS[activity.entity_type] || activity.entity_type
  const entityName = activity.entity_name ? `"${activity.entity_name}"` : ''

  let extra = ''
  if (activity.details) {
    if (activity.action === 'status_changed' && activity.details.from && activity.details.to) {
      extra = ` de ${formatTaskStatus(activity.details.from)} a ${formatTaskStatus(activity.details.to)}`
    }
    if (activity.action === 'assigned' && activity.details.assignee_name) {
      extra = ` a ${activity.details.assignee_name}`
    }
    if (activity.action === 'unassigned' && activity.details.unassigned_user_name) {
      extra = ` a ${activity.details.unassigned_user_name}`
    }
    if (activity.action === 'reviewer_assigned' && activity.details.reviewer_name) {
      extra = ` → ${activity.details.reviewer_name}`
    }
    if (activity.action === 'reviewer_removed' && activity.details.reviewer_name) {
      extra = ` (${activity.details.reviewer_name})`
    }
    if ((activity.action === 'attached' || activity.action === 'detached') && activity.details.file_name) {
      extra = ` (${activity.details.file_name})`
    }
  }

  return `${action} ${entity} ${entityName}${extra}`.trim()
}
