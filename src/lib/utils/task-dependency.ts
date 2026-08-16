export interface TaskDependencyRef {
  id: string
  task_number: number | null
  title: string
  status: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

/** Supabase puede devolver la relación como objeto, array o null. */
export function normalizeDependsOn(
  raw: unknown,
  dependsOnTaskId?: string | null
): TaskDependencyRef | null {
  if (!dependsOnTaskId) return null

  if (Array.isArray(raw)) {
    const item = raw.find(
      (entry): entry is TaskDependencyRef =>
        !!entry && typeof entry === 'object' && 'id' in entry && typeof (entry as TaskDependencyRef).title === 'string'
    )
    return item ?? null
  }

  if (raw && typeof raw === 'object' && 'id' in raw && 'title' in raw) {
    const task = raw as TaskDependencyRef
    return task.title ? task : null
  }

  return null
}

export function formatDependencyLabel(
  task: Pick<TaskDependencyRef, 'task_number' | 'title'>
): string {
  const parts: string[] = []
  if (task.task_number != null) parts.push(`#${task.task_number}`)
  if (task.title) parts.push(task.title)
  return parts.join(' ')
}

export const ADVANCED_TASK_STATUSES = ['in_progress', 'review', 'done'] as const

export type AdvancedTaskStatus = (typeof ADVANCED_TASK_STATUSES)[number]

export function isAdvancedTaskStatus(status: string): status is AdvancedTaskStatus {
  return (ADVANCED_TASK_STATUSES as readonly string[]).includes(status)
}

export function formatBlockedByDependencyMessage(
  dependency: Pick<TaskDependencyRef, 'task_number' | 'title'>
): string {
  return `No puedes avanzar esta tarea hasta completar ${formatDependencyLabel(dependency)}`
}

export async function assertTaskNotBlockedByDependency(
  supabaseAdmin: SupabaseAdmin,
  options: {
    dependsOnTaskId: string | null
    newStatus: string
  }
): Promise<string | null> {
  const { dependsOnTaskId, newStatus } = options

  if (!dependsOnTaskId || !isAdvancedTaskStatus(newStatus)) {
    return null
  }

  const { data: dependencyTask, error } = await supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, status')
    .eq('id', dependsOnTaskId)
    .single()

  if (error || !dependencyTask) {
    return 'La tarea de dependencia no existe'
  }

  if (dependencyTask.status === 'done') {
    return null
  }

  return formatBlockedByDependencyMessage(dependencyTask)
}

type TaskDependencyLookup = Pick<TaskDependencyRef, 'id' | 'task_number' | 'title'> & {
  status?: string
}

export function resolveDependencyTask(
  dependsOnTaskId: string | null | undefined,
  dependsOnRaw: unknown,
  fallbackTasks?: TaskDependencyLookup[]
): TaskDependencyRef | null {
  if (!dependsOnTaskId) return null

  const normalized = normalizeDependsOn(dependsOnRaw, dependsOnTaskId)
  if (normalized) return normalized

  const fromList = fallbackTasks?.find((task) => task.id === dependsOnTaskId)
  if (fromList?.title) {
    return {
      id: fromList.id,
      task_number: fromList.task_number,
      title: fromList.title,
      status: fromList.status ?? 'backlog',
    }
  }

  return null
}

export function enrichTasksWithDependencies<
  T extends {
    id: string
    task_number: number | null
    title: string
    status: string
    depends_on_task_id?: string | null
  }
>(tasks: T[]): Array<T & { depends_on: TaskDependencyRef | null }> {
  const byId = new Map(tasks.map((task) => [task.id, task]))

  return tasks.map((task) => {
    if (!task.depends_on_task_id) {
      return { ...task, depends_on: null }
    }

    const dep = byId.get(task.depends_on_task_id)
    return {
      ...task,
      depends_on: dep
        ? {
            id: dep.id,
            task_number: dep.task_number,
            title: dep.title,
            status: dep.status,
          }
        : null,
    }
  })
}

export async function validateTaskDependency(
  supabaseAdmin: SupabaseAdmin,
  options: {
    taskId: string | null
    dependsOnTaskId: string | null
    projectId: string
  }
): Promise<string | null> {
  const { taskId, dependsOnTaskId, projectId } = options

  if (!dependsOnTaskId) return null
  if (taskId && dependsOnTaskId === taskId) {
    return 'Una tarea no puede depender de sí misma'
  }

  const { data: depTask, error } = await supabaseAdmin
    .from('tasks')
    .select('id, project_id, depends_on_task_id')
    .eq('id', dependsOnTaskId)
    .single()

  if (error || !depTask) return 'La tarea de dependencia no existe'
  if (depTask.project_id !== projectId) {
    return 'La dependencia debe ser una tarea del mismo proyecto'
  }

  if (!taskId) return null

  let current: string | null = dependsOnTaskId
  for (let depth = 0; depth < 25 && current; depth++) {
    const { data: node } = await supabaseAdmin
      .from('tasks')
      .select('depends_on_task_id')
      .eq('id', current)
      .single()

    const next = node?.depends_on_task_id as string | null
    if (!next) break
    if (next === taskId) return 'Dependencia circular detectada'
    current = next
  }

  return null
}
