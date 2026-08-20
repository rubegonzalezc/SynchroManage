import { formatSprintHuLabel, resolveSprintName } from '@/lib/utils/task-sprint-order'

export interface SprintOption {
  id: string
  name: string
  status?: string
  order_index?: number
}

export interface SprintTaskOption {
  id: string
  task_number: number | null
  title: string
  status?: string
  sprint_id: string | null
  sprint_order?: number | null
}

export type SprintTaskFilter = 'current' | 'backlog' | 'all' | { sprintId: string }

export interface SprintFilterOption {
  value: SprintTaskFilter
  label: string
}

export function resolveCurrentSprintId(
  sprints: SprintOption[],
  currentSprintId?: string | null
): string | null {
  if (currentSprintId) return currentSprintId
  return sprints.find((sprint) => sprint.status === 'active')?.id ?? null
}

export function buildSprintFilterOptions(
  sprints: SprintOption[],
  currentSprintId?: string | null
): SprintFilterOption[] {
  const resolvedCurrentId = resolveCurrentSprintId(sprints, currentSprintId)
  const options: SprintFilterOption[] = []

  if (resolvedCurrentId) {
    const current = sprints.find((sprint) => sprint.id === resolvedCurrentId)
    if (current) {
      options.push({ value: 'current', label: `${current.name} (actual)` })
    }
  }

  options.push({ value: 'backlog', label: 'Backlog' })

  const otherSprints = [...sprints]
    .filter((sprint) => sprint.id !== resolvedCurrentId)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

  for (const sprint of otherSprints) {
    options.push({ value: { sprintId: sprint.id }, label: sprint.name })
  }

  options.push({ value: 'all', label: 'Todos' })

  return options
}

export function getDefaultSprintFilter(
  sprints: SprintOption[],
  currentSprintId?: string | null
): SprintTaskFilter {
  const resolvedCurrentId = resolveCurrentSprintId(sprints, currentSprintId)
  return resolvedCurrentId ? 'current' : 'all'
}

export function isSameSprintFilter(a: SprintTaskFilter, b: SprintTaskFilter): boolean {
  if (typeof a === 'object' && typeof b === 'object') {
    return a.sprintId === b.sprintId
  }
  return a === b
}

export function filterTasksBySprint(
  tasks: SprintTaskOption[],
  filter: SprintTaskFilter,
  currentSprintId: string | null
): SprintTaskOption[] {
  switch (filter) {
    case 'current':
      if (!currentSprintId) return []
      return tasks.filter((task) => task.sprint_id === currentSprintId)
    case 'backlog':
      return tasks.filter((task) => !task.sprint_id)
    case 'all':
      return tasks
    default:
      return tasks.filter((task) => task.sprint_id === filter.sprintId)
  }
}

export function matchesSprintTaskSearch(task: SprintTaskOption, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (task.title.toLowerCase().includes(q)) return true

  const numeric = q.replace(/^#/, '')
  if (task.task_number != null) {
    if (String(task.task_number).includes(numeric)) return true
    if (`#${task.task_number}`.toLowerCase().includes(q)) return true
  }

  if (task.sprint_order != null) {
    const huLabel = formatSprintHuLabel(task.sprint_order)?.toLowerCase()
    if (huLabel && huLabel.includes(q)) return true

    const huMatch = q.match(/^hu-?(\d+)$/)
    if (huMatch && huMatch[1] === String(task.sprint_order)) return true

    if (String(task.sprint_order).includes(numeric)) return true
  }

  return false
}

export function formatSprintTaskDependencyLabel(
  task: SprintTaskOption,
  sprints: SprintOption[]
): string {
  const parts: string[] = []
  const sprintName = resolveSprintName(task.sprint_id, sprints)

  if (sprintName) {
    parts.push(sprintName)
  } else if (!task.sprint_id) {
    parts.push('Backlog')
  }

  const hu = formatSprintHuLabel(task.sprint_order)
  if (hu) parts.push(hu)

  parts.push(task.title)
  return parts.join(' · ')
}

export function formatSprintTaskDependencyTooltip(
  task: Pick<SprintTaskOption, 'task_number'>
): string | undefined {
  if (task.task_number == null) return undefined
  return `#${task.task_number}`
}
