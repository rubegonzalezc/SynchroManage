import {
  normalizeSprintOrder,
  resolveSprintDisplayLabel,
  type SprintNameRef,
} from '@/lib/utils/task-sprint-order'

export interface TaskSprintGroup<T> {
  id: string | null
  label: string
  orderIndex: number
  tasks: T[]
}

export interface TaskWithSprintMeta {
  sprint_id?: string | null
  sprint_order?: number | null
  task_number?: number | null
}

export function compareTasksBySprintOrder(
  a: TaskWithSprintMeta,
  b: TaskWithSprintMeta
): number {
  const orderA = normalizeSprintOrder(a.sprint_order) ?? Number.MAX_SAFE_INTEGER
  const orderB = normalizeSprintOrder(b.sprint_order) ?? Number.MAX_SAFE_INTEGER
  if (orderA !== orderB) return orderA - orderB
  return (a.task_number ?? 0) - (b.task_number ?? 0)
}

export function sortTasksBySprintOrder<T extends TaskWithSprintMeta>(tasks: T[]): T[] {
  return [...tasks].sort(compareTasksBySprintOrder)
}

export function groupTasksBySprint<T extends TaskWithSprintMeta>(
  tasks: T[],
  sprints: SprintNameRef[]
): TaskSprintGroup<T>[] {
  const tasksBySprintId = new Map<string | null, T[]>()

  for (const task of tasks) {
    const sprintId = task.sprint_id ?? null
    const bucket = tasksBySprintId.get(sprintId) ?? []
    bucket.push(task)
    tasksBySprintId.set(sprintId, bucket)
  }

  const groups: TaskSprintGroup<T>[] = []

  const backlogTasks = sortTasksBySprintOrder(tasksBySprintId.get(null) ?? [])
  groups.push({
    id: null,
    label: 'Backlog',
    orderIndex: -1,
    tasks: backlogTasks,
  })

  const sortedSprints = [...sprints].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  )

  for (const sprint of sortedSprints) {
    const sprintTasks = sortTasksBySprintOrder(tasksBySprintId.get(sprint.id) ?? [])
    groups.push({
      id: sprint.id,
      label: resolveSprintDisplayLabel(sprint.id, sprints) ?? sprint.name,
      orderIndex: sprint.order_index ?? 0,
      tasks: sprintTasks,
    })
  }

  return groups
}

export function getSprintGroupCollapseKey(groupId: string | null): string {
  return groupId ?? 'backlog'
}
