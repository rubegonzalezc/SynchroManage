export const DUPLICATE_TASK_INITIAL_STATUSES = ['backlog', 'todo'] as const

export type DuplicateTaskInitialStatus = (typeof DUPLICATE_TASK_INITIAL_STATUSES)[number]

/** Título de la copia con sufijo «(copia)». */
export function buildDuplicateTaskTitle(sourceTitle: string): string {
  const trimmed = sourceTitle.trim()
  if (!trimmed) return '(copia)'
  if (/\(copia\)\s*$/i.test(trimmed)) return trimmed
  return `${trimmed} (copia)`
}

/** Estado inicial de la copia: `backlog` por defecto o `todo` si el body lo pide. */
export function resolveDuplicateTaskStatus(status: unknown): DuplicateTaskInitialStatus {
  if (status === 'todo') return 'todo'
  return 'backlog'
}

export function isAllowedDuplicateTaskStatus(
  status: string
): status is DuplicateTaskInitialStatus {
  return (DUPLICATE_TASK_INITIAL_STATUSES as readonly string[]).includes(status)
}

export interface DuplicateTaskSourceFields {
  project_id: string
  title: string
  description: string | null
  category: string | null
  priority: string | null
  sprint_id: string | null
}

export interface BuildDuplicateTaskInsertOptions {
  source: DuplicateTaskSourceFields
  status: DuplicateTaskInitialStatus
  position: number
  sprintOrder: number | null
  primaryAssigneeId: string | null
}

/** Campos insertables para la tarea duplicada (sin dependencias, bugs ni metadatos de la original). */
export function buildDuplicateTaskInsertPayload(options: BuildDuplicateTaskInsertOptions) {
  const { source, status, position, sprintOrder, primaryAssigneeId } = options

  return {
    project_id: source.project_id,
    title: buildDuplicateTaskTitle(source.title),
    description: source.description,
    status,
    priority: source.priority || 'medium',
    category: source.category || 'task',
    assignee_id: primaryAssigneeId,
    reviewer_id: null,
    due_date: null,
    position,
    sprint_id: source.sprint_id,
    sprint_order: sprintOrder,
    branch_name: null,
    complexity: null,
    depends_on_task_id: null,
  }
}
